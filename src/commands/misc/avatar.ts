import { SlashCommandBuilder } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Display the avatar for a user.')
    .addUserOption((option) => option.setName('user').setDescription('User to fetch')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const url = user.displayAvatarURL({ size: 1024 });
    await interaction.reply({ content: `${user.tag}\'s avatar: ${url}` });
  }
};

export default command;
