import { SlashCommandBuilder, PermissionFlagsBits } from '#discord-compat';
import { addWarning } from '../../utils/warnings.js';
import type { CommandModule } from '../../types/command.js';

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a warning to a member.')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('Reason for the warning').setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
      return;
    }

    try {
      const warnings = await addWarning(
        guildId,
        target.id,
        interaction.user.id,
        reason
      );

      await interaction.reply({
        content: `Warned **${target.tag}**. They now have ${warnings.length} warning(s).`
      });
    } catch (error) {
      console.error('Warn failed:', error);
      await interaction.reply({ content: 'Failed to log that warning.', ephemeral: true });
    }
  }
};

export default command;
