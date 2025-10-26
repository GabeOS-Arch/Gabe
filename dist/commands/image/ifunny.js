import { SlashCommandBuilder } from '#discord-compat';
import path from 'node:path';
import url from 'node:url';
import sharp from 'sharp';
import { addImageOptions, processImageCommand, loadOverlay } from '../../utils/image.js';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OVERLAY_PATH = path.resolve(__dirname, '../../../assets/watermarks/ifunny.png');
const command = {
    data: addImageOptions(new SlashCommandBuilder()
        .setName('ifunny')
        .setDescription('Append the vintage iFunny watermark below an image, just like esmBot.')),
    async execute(interaction) {
        await processImageCommand(interaction, async (image, _interaction, context) => {
            const overlayBuffer = await loadOverlay(OVERLAY_PATH);
            const overlayPipeline = sharp(overlayBuffer).ensureAlpha();
            const resizedOverlay = await overlayPipeline.resize({ width: context.width }).toBuffer();
            const overlayInfo = await sharp(resizedOverlay).metadata();
            const overlayHeight = overlayInfo.height ?? 0;
            if (overlayHeight <= 0) {
                return image;
            }
            return image
                .extend({
                top: 0,
                bottom: overlayHeight,
                left: 0,
                right: 0,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
                .composite([{ input: resizedOverlay, left: 0, top: context.height }]);
        }, {
            fileNameSuffix: 'ifunny',
            successMessage: 'A certified iFunny classic. 👍'
        });
    }
};
export default command;
