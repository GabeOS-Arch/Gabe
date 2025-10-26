import { AttachmentBuilder } from '#discord-compat';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { resolveExternalMediaSource } from './external-media.js';
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']);
const MAX_IMAGE_DIMENSION = 2048;
const MAX_INPUT_PIXELS = 36_000_000;
const PNG_OUTPUT_OPTIONS = {
    compressionLevel: 6,
    effort: 3
};
const overlayCache = new Map();
export async function loadOverlay(assetPath) {
    if (!overlayCache.has(assetPath)) {
        overlayCache.set(assetPath, readFile(assetPath));
    }
    const data = await overlayCache.get(assetPath);
    return Buffer.from(data);
}
function createUserFacingError(message) {
    const error = new Error(message);
    error.isUserFacing = true;
    return error;
}
function sanitizeBaseName(name) {
    if (!name) {
        return 'image';
    }
    const cleaned = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return cleaned || 'image';
}
function isImageAttachment(attachment) {
    if (!attachment)
        return false;
    if (attachment.contentType?.startsWith('image/'))
        return true;
    if (attachment.filename) {
        const ext = path.extname(attachment.filename).slice(1).toLowerCase();
        return IMAGE_EXTENSIONS.has(ext);
    }
    return false;
}
function determineFileName({ attachment, url, userName, fallback = 'image' }) {
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
        }
        catch {
            // ignore, we'll fallback to provided name
        }
    }
    if (userName) {
        return userName;
    }
    return fallback;
}
function bufferIsGif(buffer) {
    if (!buffer || buffer.length < 3) {
        return false;
    }
    return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
}
export function addImageOptions(builder) {
    return builder
        .addAttachmentOption((option) => option
        .setName('image')
        .setDescription('Image attachment to transform (takes priority over other options).'))
        .addUserOption((option) => option
        .setName('user')
        .setDescription("Transform a user's avatar if no attachment is provided."))
        .addStringOption((option) => option
        .setName('url')
        .setDescription('Direct image URL to transform if no attachment is provided.'));
}
async function downloadInteractionImage(interaction) {
    const attachment = interaction.options.getAttachment('image');
    const urlOption = interaction.options.getString('url');
    const userOption = interaction.options.getUser('user');
    let imageUrl;
    let baseName;
    if (attachment) {
        if (!isImageAttachment(attachment)) {
            throw createUserFacingError('Please provide a valid image attachment (PNG, JPG, GIF, WebP, or BMP).');
        }
        imageUrl = attachment.url;
        baseName = determineFileName({ attachment });
    }
    else if (urlOption) {
        let parsedUrl;
        try {
            parsedUrl = new URL(urlOption);
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                throw createUserFacingError('Image URLs must start with http:// or https://.');
            }
        }
        catch (error) {
            const err = error;
            if (err.isUserFacing) {
                throw err;
            }
            throw createUserFacingError('Please provide a valid direct image URL.');
        }
        imageUrl = parsedUrl.toString();
        baseName = determineFileName({ url: imageUrl });
    }
    else if (userOption) {
        imageUrl = userOption.displayAvatarURL({ extension: 'png', size: 1024 });
        baseName = determineFileName({ userName: userOption.username, fallback: 'avatar' });
    }
    else {
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
        }
        catch {
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
export async function processImageCommand(interaction, effect, { fileNameSuffix = 'edited', successMessage } = {}) {
    await interaction.deferReply();
    try {
        const downloaded = await downloadInteractionImage(interaction);
        const { buffer, baseName, preferGif } = downloaded;
        const { outputBuffer, format } = await processSharpImage(buffer, interaction, effect, preferGif);
        const outputName = `${baseName}-${fileNameSuffix}.${format}`;
        const attachment = new AttachmentBuilder(outputBuffer, { name: outputName });
        const replyPayload = { files: [attachment] };
        if (successMessage) {
            replyPayload.content = successMessage;
        }
        await interaction.editReply(replyPayload);
    }
    catch (error) {
        const err = error;
        console.error('Image processing failed:', err);
        const message = err.isUserFacing
            ? err.message
            : 'Sorry, something went wrong while processing that image.';
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: message });
        }
        else {
            await interaction.reply({ content: message, ephemeral: true });
        }
    }
}
async function processSharpImage(buffer, interaction, effect, preferGif) {
    const { pipeline, width, height, frameCount, isGif } = await createNormalizedSharpImage(buffer, preferGif);
    const context = {
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
async function createNormalizedSharpImage(buffer, preferGif) {
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
