import { SlashCommandBuilder } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('yomama')
    .setDescription('So stupid'),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const response = await fetch('https://www.yomama-jokes.com/api/v1/jokes/random/');

      if (!response.ok) {
        throw new Error(`Yo Momma API responded with status ${response.status}`);
      }

      const data = await response.json();
      const joke = data?.joke?.trim();

      if (!joke) {
        throw new Error('API response missing joke.');
      }

      await interaction.editReply(joke);
    } catch (error) {
      console.error('Failed to fetch Yo Mama joke:', error);
      const fallback = 'Yo mama is so stupid, she still laughs even when the API fails. (By the way, the API failed)';
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(fallback);
      } else {
        await interaction.reply(fallback);
      }
    }
  }
};

export default command;
