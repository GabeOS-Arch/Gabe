import { SlashCommandBuilder } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

const quotes = [
  'The best time to plant a tree was 20 years ago. The second best time is now.',
  'Success is the sum of small efforts, repeated day in and day out.',
  'In the middle of every difficulty lies opportunity.',
  'Do not wait to strike till the iron is hot; but make it hot by striking.',
  'Courage is resistance to fear, mastery of fear, not absence of fear.'
];

const command: CommandModule = {
  data: new SlashCommandBuilder().setName('quote').setDescription('Receive a random inspirational quote.'),
  async execute(interaction) {
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    await interaction.reply(`💡 ${quote}`);
  }
};

export default command;
