import { AttachmentBuilder, SlashCommandBuilder } from '#discord-compat';
import type { Attachment, CommandInteraction } from 'oceanic.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { resolveExternalMediaSource } from './external-media.js';

type UserFacingError = Error & { isUserFacing?: boolean };

type ImageEffectContext = {
  isGif: boolean;
  width: number;
  height: number;
  frameCount: number;
};

type ImageEffectHandler = (
  image: sharp.Sharp,
  interaction: CommandInteraction,
  context: ImageEffectContext
) => Promise<sharp.Sharp | void> | sharp.Sharp | void;

type DownloadedImage = {
  buffer: Buffer;
  baseName: string;
  preferGif: boolean;
};

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']);
const MAX_IMAGE_DIMENSION = 2048;
const MAX_INPUT_PIXELS = 36_000_000;
const PNG_OUTPUT_OPTIONS = {
  compressionLevel: 6,
  effort: 3
} as const;
const overlayCache = new Map<string, Promise<Buffer>>();

export async function loadOverlay(assetPath: string): Promise<Buffer> {
  if (!overlayCache.has(assetPath)) {
    overlayCache.set(assetPath, readFile(assetPath));
  }
  const data = await overlayCache.get(assetPath)!;
  return Buffer.from(data);
}

function createUserFacingError(message: string): UserFacingError {
  const error: UserFacingError = new Error(message);
  error.isUserFacing = true;
  return error;
}

function sanitizeBaseName(name?: string): string {
  if (!name) {
    return 'image';
  }

  const cleaned = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || 'image';
}

function isImageAttachment(attachment: Attachment | null | undefined): attachment is Attachment {
  if (!attachment) return false;
  if (attachment.contentType?.startsWith('image/')) return true;
  if (attachment.filename) {
    const ext = path.extname(attachment.filename).slice(1).toLowerCase();
    return IMAGE_EXTENSIONS.has(ext);
  }
  return false;
}

type FileNameParts = {
  attachment?: Attachment | null | undefined;
  url?: string;
  userName?: string;
  fallback?: string;
};

function determineFileName({ attachment, url, userName, fallback = 'image' }: FileNameParts): string {
  if (attachment?.filename) {
    return path.parse(attachment.filename).name;
  }
  if (url) {
    try {
      const parsed = new URL(url);
      const nameFromPath = path.parse(parsed.pathname).name;
      if (nameFromPath) {
        return nameFromPath;
      }
    } catch {
      // ignore, we'll fallback to provided name
    }
  }
  if (userName) {
    return userName;
  }
  return fallback;
}

function bufferIsGif(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 3) {
    return false;
  }

  return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
}

export function addImageOptions(builder: SlashCommandBuilder): SlashCommandBuilder {
  return builder
    .addAttachmentOption((option) =>
      option
        .setName('image')
        .setDescription('Image attachment to transform (takes priority over other options).')
    )
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription("Transform a user's avatar if no attachment is provided.")
    )
    .addStringOption((option) =>
      option
        .setName('url')
        .setDescription('Direct image URL to transform if no attachment is provided.')
    );
}

async function downloadInteractionImage(interaction: CommandInteraction): Promise<DownloadedImage> {
  const attachment = interaction.options.getAttachment('image');
  const urlOption = interaction.options.getString('url');
  const userOption = interaction.options.getUser('user');

  let imageUrl: string;
  let baseName: string;

  if (attachment) {
    if (!isImageAttachment(attachment)) {
      throw createUserFacingError('Please provide a valid image attachment (PNG, JPG, GIF, WebP, or BMP).');
    }
    imageUrl = attachment.url;
    baseName = determineFileName({ attachment });
  } else if (urlOption) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlOption);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw createUserFacingError('Image URLs must start with http:// or https://.');
      }
    } catch (error) {
      const err = error as UserFacingError;
      if (err.isUserFacing) {
        throw err;
      }
      throw createUserFacingError('Please provide a valid direct image URL.');
    }

    imageUrl = parsedUrl.toString();
    baseName = determineFileName({ url: imageUrl });
  } else if (userOption) {
    imageUrl = userOption.displayAvatarURL({ extension: 'png', size: 1024 });
    baseName = determineFileName({ userName: userOption.username, fallback: 'avatar' });
  } else {
    const author = interaction.user;
    imageUrl = author.displayAvatarURL({ extension: 'png', size: 1024 });
    baseName = determineFileName({ userName: author.username, fallback: 'avatar' });
  }

  const externalSource = await resolveExternalMediaSource(imageUrl);
  let downloadUrl = externalSource.url;
  if (externalSource.fileNameHint) {
    baseName = sanitizeBaseName(externalSource.fileNameHint);
  }

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw createUserFacingError(`Failed to download the image (${response.status}).`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  let preferGif = false;
  if (attachment?.contentType?.toLowerCase() === 'image/gif') {
    preferGif = true;
  }

  if (!preferGif && attachment?.filename) {
    preferGif = path.extname(attachment.filename).toLowerCase() === '.gif';
  }

  if (!preferGif && downloadUrl) {
    try {
      const parsed = new URL(downloadUrl);
      preferGif = path.extname(parsed.pathname).toLowerCase() === '.gif';
    } catch {
      // Ignore URL parsing issues; we'll rely on the buffer signature as a fallback.
    }
  }

  if (bufferIsGif(buffer)) {
    preferGif = true;
  }

  return {
    buffer,
    baseName: sanitizeBaseName(baseName),
    preferGif
  };
}

type ProcessImageOptions = {
  fileNameSuffix?: string;
  successMessage?: string;
};

export async function processImageCommand(
  interaction: CommandInteraction,
  effect: ImageEffectHandler,
  { fileNameSuffix = 'edited', successMessage }: ProcessImageOptions = {}
): Promise<void> {
  await interaction.deferReply();

  try {
    const downloaded = await downloadInteractionImage(interaction);
    const { buffer, baseName, preferGif } = downloaded;
    const { outputBuffer, format } = await processSharpImage(buffer, interaction, effect, preferGif);
    const outputName = `${baseName}-${fileNameSuffix}.${format}`;
    const attachment = new AttachmentBuilder(outputBuffer, { name: outputName });
    const replyPayload: { files: AttachmentBuilder[]; content?: string } = { files: [attachment] };
    if (successMessage) {
      replyPayload.content = successMessage;
    }
    await interaction.editReply(replyPayload);
  } catch (error) {
    const err = error as UserFacingError;
    console.error('Image processing failed:', err);
    const message = err.isUserFacing
      ? err.message
      : 'Sorry, something went wrong while processing that image.';

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: message });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
  }
}

async function processSharpImage(
  buffer: Buffer,
  interaction: CommandInteraction,
  effect: ImageEffectHandler,
  preferGif: boolean
): Promise<{ outputBuffer: Buffer; format: 'gif' | 'png' }> {
  const { pipeline, width, height, frameCount, isGif } = await createNormalizedSharpImage(buffer, preferGif);
  const context: ImageEffectContext = {
    isGif,
    width,
    height,
    frameCount
  };
  const processed = (await effect(pipeline, interaction, context)) ?? pipeline;

  if (isGif) {
    const gifBuffer = await processed.gif({ loop: 0 }).toBuffer();
    return { outputBuffer: gifBuffer, format: 'gif' };
  }

  const pngBuffer = await processed.png(PNG_OUTPUT_OPTIONS).toBuffer();
  return { outputBuffer: pngBuffer, format: 'png' };
}

async function createNormalizedSharpImage(
  buffer: Buffer,
  preferGif: boolean
): Promise<{ pipeline: sharp.Sharp; width: number; height: number; frameCount: number; isGif: boolean }> {
  const treatAsGif = preferGif && bufferIsGif(buffer);
  const basePipeline = sharp(buffer, {
    animated: treatAsGif,
    limitInputPixels: MAX_INPUT_PIXELS
  }).rotate();

  const metadata = await basePipeline.metadata();
  const sourceWidth = Math.max(1, metadata.width ?? MAX_IMAGE_DIMENSION);
  const sourceHeight = Math.max(1, metadata.height ?? MAX_IMAGE_DIMENSION);

  const requiresResize = sourceWidth > MAX_IMAGE_DIMENSION || sourceHeight > MAX_IMAGE_DIMENSION;
  let workingPipeline = basePipeline;
  if (requiresResize) {
    workingPipeline = workingPipeline.resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  const scale = requiresResize
    ? Math.min(MAX_IMAGE_DIMENSION / sourceWidth, MAX_IMAGE_DIMENSION / sourceHeight)
    : 1;
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const frameCount = Math.max(1, metadata.pages ?? 1);

  const normalizedPipeline = workingPipeline.ensureAlpha().toColourspace('srgb');

  return {
    pipeline: normalizedPipeline,
    width,
    height,
    frameCount,
    isGif: treatAsGif
  };
}
