import { SlashCommandBuilder, PermissionFlagsBits } from '#discord-compat';
import { getWarnings, clearWarnings } from '../../utils/warnings.js';
import type { CommandModule } from '../../types/command.js';

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View or clear a member\'s warnings.')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription('View all warnings for a member')
        .addUserOption((option) => option.setName('user').setDescription('Member to inspect').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription('Clear all warnings for a member')
        .addUserOption((option) => option.setName('user').setDescription('Member to clear').setRequired(true))
    ),
  async execute(interaction) {
    const subPath = interaction.options.getSubCommand(true);
    const sub = subPath[subPath.length - 1];
    const target = interaction.options.getUser('user', true);
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
      return;
    }

    if (sub === 'view') {
      const warnings = await getWarnings(guildId, target.id);
      if (warnings.length === 0) {
        return interaction.reply({ content: `**${target.tag}** has no warnings.`, ephemeral: true });
      }

      const formatted = warnings
        .map((warning, index) =>
          `#${index + 1} • <@${warning.moderatorId}> • ${warning.reason} • ${new Date(warning.timestamp).toLocaleString()}`
        )
        .join('\n');
      return interaction.reply({ content: formatted, ephemeral: true });
    }

    if (sub === 'clear') {
      await clearWarnings(guildId, target.id);
      return interaction.reply({ content: `Cleared all warnings for **${target.tag}**.` });
    }
  }
};

export default command;
