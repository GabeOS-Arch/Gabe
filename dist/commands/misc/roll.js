import { SlashCommandBuilder } from '#discord-compat';
const command = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll some dice (e.g., 2d6).')
        .addStringOption((option) => option.setName('dice').setDescription('Dice notation XdY + Z (default 1d6)').setRequired(false)),
    async execute(interaction) {
        const notation = interaction.options.getString('dice') ?? '1d6';
        const regex = /^(\d*)d(\d+)([+\-]\d+)?$/i;
        const match = notation.match(regex);
        if (!match) {
            return interaction.reply({ content: 'Invalid dice notation. Use XdY+Z.', ephemeral: true });
        }
        const count = Number(match[1] || '1');
        const sides = Number(match[2]);
        const modifier = match[3] ? Number(match[3]) : 0;
        if (count > 50 || sides > 1000) {
            return interaction.reply({ content: 'That is a lot of dice! Try fewer.', ephemeral: true });
        }
        const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
        const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
        await interaction.reply({
            content: `You rolled ${rolls.join(', ')}${modifier ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : ''} = **${total}**`
        });
    }
};
export default command;
