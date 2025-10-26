import { SlashCommandBuilder } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

const words = ['serendipity', 'ephemeral', 'sonder', 'luminous', 'mellifluous', 'halcyon', 'labyrinth'];

const command: CommandModule = {
  data: new SlashCommandBuilder().setName('word').setDescription('Discover a random interesting word.'),
  async execute(interaction) {
    const word = words[Math.floor(Math.random() * words.length)];
    await interaction.reply(`📚 Your word of the moment is **${word}**.`);
  }
};

export default command;
