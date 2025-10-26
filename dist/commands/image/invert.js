import { SlashCommandBuilder } from '#discord-compat';
import { addImageOptions, processImageCommand } from '../../utils/image.js';
const command = {
    data: addImageOptions(new SlashCommandBuilder()
        .setName('invert')
        .setDescription('Invert the colors of an image or avatar.')),
    async execute(interaction) {
        await processImageCommand(interaction, (image) => image.negate(), {
            fileNameSuffix: 'invert',
            successMessage: 'Flipped the colors for you!'
        });
    }
};
export default command;
