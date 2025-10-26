import { SlashCommandBuilder } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

const facts = [
  'Dogs have about 1,700 taste buds, while humans have around 9,000.',
  'Basenji dogs are known as "barkless" dogs because they yodel instead.',
  'Dogs\' sense of smell is at least 40 times better than humans.',
  'Three dogs survived the sinking of the Titanic.',
  'Dalmatian puppies are born completely white and develop spots later.'
];

const command: CommandModule = {
  data: new SlashCommandBuilder().setName('dogfact').setDescription('Get a random dog fact.'),
  async execute(interaction) {
    const fact = facts[Math.floor(Math.random() * facts.length)];
    await interaction.reply(`🐶 ${fact}`);
  }
};

export default command;
