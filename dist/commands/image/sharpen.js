import { SlashCommandBuilder } from '#discord-compat';
import { addImageOptions, processImageCommand } from '../../utils/image.js';
const SHARPEN_KERNELS = {
    light: {
        label: 'light',
        matrix: [
            [0, -0.5, 0],
            [-0.5, 3, -0.5],
            [0, -0.5, 0]
        ],
        message: 'Lightly sharpened the details.'
    },
    medium: {
        label: 'medium',
        matrix: [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ],
        message: 'Sharpened things up for extra crispness.'
    },
    strong: {
        label: 'strong',
        matrix: [
            [1, -2, 1],
            [-2, 9, -2],
            [1, -2, 1]
        ],
        message: 'Cranked the sharpness to the max!'
    }
};
const command = {
    data: addImageOptions(new SlashCommandBuilder()
        .setName('sharpen')
        .setDescription('Sharpen an image or avatar to bring out the edges.')
        .addStringOption((option) => option
        .setName('strength')
        .setDescription('How intense the sharpening should be.')
        .addChoices({ name: 'Light', value: 'light' }, { name: 'Medium', value: 'medium' }, { name: 'Strong', value: 'strong' }))),
    async execute(interaction) {
        const strength = interaction.options.getString('strength') ?? 'medium';
        const kernel = SHARPEN_KERNELS[strength];
        await processImageCommand(interaction, (sharpImage) => sharpImage.convolve({
            width: kernel.matrix[0].length,
            height: kernel.matrix.length,
            kernel: kernel.matrix.flat()
        }), {
            fileNameSuffix: `sharpen-${kernel.label}`,
            successMessage: kernel.message
        });
    }
};
export default command;
