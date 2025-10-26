import { SlashCommandBuilder } from '#discord-compat';
import { addImageOptions, processImageCommand } from '../../utils/image.js';
const command = {
    data: addImageOptions(new SlashCommandBuilder()
        .setName('grayscale')
        .setDescription('Turn an image or avatar into grayscale.')),
    async execute(interaction) {
        await processImageCommand(interaction, (image) => image.grayscale(), {
            fileNameSuffix: 'grayscale',
            successMessage: 'Here is your grayscale masterpiece!'
        });
    }
};
export default command;
