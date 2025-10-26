import { SlashCommandBuilder } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('choose')
    .setDescription('Let the bot decide between options.')
    .addStringOption((option) =>
      option
        .setName('options')
        .setDescription('Comma separated list of options')
        .setRequired(true)
    ),
  async execute(interaction) {
    const raw = interaction.options.getString('options', true);
    const choices = raw
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (choices.length < 2) {
      return interaction.reply({ content: 'Please provide at least two options.', ephemeral: true });
    }

    const selection = choices[Math.floor(Math.random() * choices.length)];
    await interaction.reply(`I choose: **${selection}**`);
  }
};

export default command;
