import { SlashCommandBuilder } from '#discord-compat';
const command = {
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Generate a random number in a range.')
        .addIntegerOption((option) => option.setName('min').setDescription('Minimum value').setRequired(true))
        .addIntegerOption((option) => option.setName('max').setDescription('Maximum value').setRequired(true)),
    async execute(interaction) {
        const min = interaction.options.getInteger('min', true);
        const max = interaction.options.getInteger('max', true);
        if (min >= max) {
            return interaction.reply({ content: 'The minimum must be less than the maximum.', ephemeral: true });
        }
        const value = Math.floor(Math.random() * (max - min + 1)) + min;
        await interaction.reply(`🎲 Random number between ${min} and ${max}: **${value}**`);
    }
};
export default command;
