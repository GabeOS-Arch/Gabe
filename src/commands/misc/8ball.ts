import { SlashCommandBuilder } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

const responses = [
  'It is certain.',
  'Without a doubt.',
  'You may rely on it.',
  'Yes definitely.',
  'It is decidedly so.',
  'As I see it, yes.',
  'Most likely.',
  'Outlook good.',
  'Yes.',
  'Signs point to yes.',
  'Reply hazy, try again.',
  'Ask again later.',
  'Better not tell you now.',
  'Cannot predict now.',
  'Concentrate and ask again.',
  "Don't count on it.",
  'My reply is no.',
  'Outlook not so good.',
  'Very doubtful.',
  'My sources say no.'
];

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Consult the mystical 8-ball for advice.')
    .addStringOption((option) =>
      option
        .setName('question')
        .setDescription('What do you want to ask the 8-ball?')
        .setRequired(true)
    ),
  async execute(interaction) {
    const question = interaction.options.getString('question', true);
    const response = responses[Math.floor(Math.random() * responses.length)];
    await interaction.reply(`🎱 You asked: ${question}\n${response}`);
  }
};

export default command;
