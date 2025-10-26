import { SlashCommandBuilder } from '#discord-compat';
import { addImageOptions, processImageCommand } from '../../utils/image.js';
const command = {
    data: addImageOptions(new SlashCommandBuilder()
        .setName('deepfry')
        .setDescription('Over-saturate, sharpen, and torch-pixelate an image like a cursed meme.')
        .addIntegerOption((option) => option
        .setName('size')
        .setDescription('Pixel size to apply (default 8).')
        .setMinValue(2)
        .setMaxValue(128))),
    async execute(interaction) {
        const size = interaction.options.getInteger('size') ?? 8;
        const pixelSize = Math.max(2, Math.min(size, 128));
        const saturationBoost = 1.9;
        const brightnessBoost = 1.15;
        await processImageCommand(interaction, (sharpImage, _interaction, context) => {
            if (context.isGif) {
                const error = new Error('deepfry don\'t work with GIFs. try a png or jpeg or a webp. maybe not webp i hate webp');
                error.isUserFacing = true;
                throw error;
            }
            const { width, height } = context;
            const downscaledWidth = Math.max(1, Math.round(width / pixelSize));
            const downscaledHeight = Math.max(1, Math.round(height / pixelSize));
            return sharpImage
                .modulate({ saturation: saturationBoost, brightness: brightnessBoost, hue: 6 })
                .linear(1.45, -0.2)
                .gamma(2.2)
                .clahe({ width: 3, height: 3 })
                .recomb([
                [1.2, -0.1, 0],
                [-0.05, 1.1, -0.05],
                [0, -0.15, 1.3]
            ])
                .resize({ width: downscaledWidth, height: downscaledHeight, kernel: 'nearest' })
                .resize({ width, height, kernel: 'nearest' })
                .sharpen({
                sigma: 1.2,
                m1: 0,
                m2: 2,
                x1: 3,
                y2: 15,
                y3: 15
            })
                .median(1);
        }, {
            fileNameSuffix: `deepfry-${pixelSize}`,
            successMessage: `Deep fried with chunky size ${pixelSize}!`
        });
    }
};
export default command;
