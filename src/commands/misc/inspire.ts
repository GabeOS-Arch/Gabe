import { SlashCommandBuilder } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

const prompts = [
  'Believe in your ability to learn new things every day.',
  'Take a deep breath—you\'re doing great.',
  'Small steps forward still move you ahead.',
  'You are more capable than you realize.',
  'Keep going; future you is cheering right now.'
];

const command: CommandModule = {
  data: new SlashCommandBuilder().setName('inspire').setDescription('Get a quick dose of motivation.'),
  async execute(interaction) {
    const message = prompts[Math.floor(Math.random() * prompts.length)];
    await interaction.reply(`🌟 ${message}`);
  }
};

export default command;
