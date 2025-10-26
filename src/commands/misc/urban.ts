import { SlashCommandBuilder, EmbedBuilder } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('urban')
    .setDescription('Search Urban Dictionary definitions, a staple in esmBot.')
    .addStringOption((option) =>
      option.setName('term').setDescription('The word or phrase to look up.').setRequired(true)
    ),
  async execute(interaction) {
    const term = interaction.options.getString('term', true);
    await interaction.deferReply();

    try {
      const response = await fetch(
        `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`
      );

      if (!response.ok) {
        throw new Error(`Urban Dictionary request failed with status ${response.status}`);
      }

      const data = await response.json();
      const entry = data?.list?.[0];

      if (!entry) {
        await interaction.editReply(`No Urban Dictionary definition found for **${term}**.`);
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(entry.word)
        .setURL(entry.permalink)
        .setDescription(truncate(entry.definition.replace(/\r?\n/g, '\n'), 2048))
        .addFields({
          name: 'Example',
          value: truncate(entry.example.replace(/\r?\n/g, '\n') || 'No example provided.', 1024)
        })
        .setFooter({ text: `👍 ${entry.thumbs_up} | 👎 ${entry.thumbs_down}` });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const err = error as Error;
      console.error('Urban Dictionary lookup failed:', err);
      await interaction.editReply('Something went wrong while contacting Urban Dictionary.');
    }
  }
};

export default command;
