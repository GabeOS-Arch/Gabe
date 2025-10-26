import { SlashCommandBuilder, EmbedBuilder } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

function randomColor(): number {
  return Math.floor(Math.random() * 0xffffff);
}

const command: CommandModule = {
  data: new SlashCommandBuilder().setName('color').setDescription('Generate a random color.'),
  async execute(interaction) {
    const value = randomColor();
    const hex = `#${value.toString(16).padStart(6, '0')}`.toUpperCase();
    const embed = new EmbedBuilder().setTitle(hex).setColor(value).setDescription('Here is a splash of color!');
    await interaction.reply({ embeds: [embed] });
  }
};

export default command;
