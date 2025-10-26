import { SlashCommandBuilder } from '#discord-compat';
import path from 'node:path';
import url from 'node:url';
import sharp from 'sharp';
import { addImageOptions, processImageCommand, loadOverlay } from '../../utils/image.js';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OVERLAY_PATH = path.resolve(__dirname, '../../../assets/watermarks/bandicam.png');
const command = {
    data: addImageOptions(new SlashCommandBuilder()
        .setName('bandicam')
        .setDescription('Add the classic Bandicam watermark to an image, inspired by esmBot\'s filters.')),
    async execute(interaction) {
        await processImageCommand(interaction, async (image, _interaction, context) => {
            const overlayBuffer = await loadOverlay(OVERLAY_PATH);
            const resizedOverlay = await sharp(overlayBuffer)
                .ensureAlpha()
                .resize({ width: context.width })
                .toBuffer();
            return image.composite([{ input: resizedOverlay, left: 0, top: 0 }]);
        }, {
            fileNameSuffix: 'bandicam',
            successMessage: 'Recorded with Bandicam™.'
        });
    }
};
export default command;
