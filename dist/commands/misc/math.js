import { SlashCommandBuilder } from '#discord-compat';
import { evaluate } from 'mathjs';
const command = {
    data: new SlashCommandBuilder()
        .setName('math')
        .setDescription('Evaluate a mathematical expression.')
        .addStringOption((option) => option.setName('expression').setDescription('Expression to evaluate').setRequired(true)),
    async execute(interaction) {
        const expression = interaction.options.getString('expression', true);
        try {
            const result = evaluate(expression);
            await interaction.reply({ content: `📐 ${expression} = **${result}**` });
        }
        catch (error) {
            await interaction.reply({ content: 'I could not evaluate that expression.', ephemeral: true });
        }
    }
};
export default command;
