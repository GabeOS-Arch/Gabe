import { SlashCommandBuilder } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

const command: CommandModule = {
  data: new SlashCommandBuilder().setName('flip').setDescription('Flip a virtual coin.'),
  async execute(interaction) {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    await interaction.reply(`🪙 The coin landed on **${result}**!`);
  }
};

export default command;
