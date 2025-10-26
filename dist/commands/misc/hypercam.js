import { SlashCommandBuilder } from '#discord-compat';
import path from 'node:path';
import url from 'node:url';
import sharp from 'sharp';
import { addImageOptions, loadOverlay, processImageCommand } from '../../utils/image.js';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OVERLAY_PATH = path.resolve(__dirname, '../../../assets/hypercam.png');
const command = {
    data: addImageOptions(new SlashCommandBuilder()
        .setName('hypercam')
        .setDescription('Overlay the classic Unregistered HyperCam 2 banner onto an image.')),
    async execute(interaction) {
        await processImageCommand(interaction, async (image, _interaction, context) => {
            const overlayBuffer = await loadOverlay(OVERLAY_PATH);
            const overlayTemplate = sharp(overlayBuffer).ensureAlpha();
            const overlayMetadata = await overlayTemplate.metadata();
            const maxOverlayWidth = overlayMetadata.width ?? context.width;
            const targetWidth = Math.max(1, Math.min(Math.round(context.width * 0.35), maxOverlayWidth));
            const resizedOverlay = await overlayTemplate.resize({ width: targetWidth }).toBuffer();
            const resizedInfo = await sharp(resizedOverlay).metadata();
            const rawOverlayHeight = resizedInfo.height ?? 0;
            if (rawOverlayHeight <= 0) {
                return image;
            }
            const overlayHeight = Math.min(rawOverlayHeight, context.height);
            const preparedOverlay = overlayHeight > 0 && rawOverlayHeight > overlayHeight
                ? await sharp(resizedOverlay)
                    .extract({
                    left: 0,
                    top: 0,
                    width: resizedInfo.width ?? targetWidth,
                    height: overlayHeight
                })
                    .toBuffer()
                : resizedOverlay;
            return image.composite([{ input: preparedOverlay, left: 0, top: 0 }]);
        }, {
            fileNameSuffix: 'hypercam',
            successMessage: 'Here you go—totally unregistered!'
        });
    }
};
export default command;
