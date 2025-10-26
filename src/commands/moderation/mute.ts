import { SlashCommandBuilder, PermissionFlagsBits } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

const durationChoices = [
  { name: '5 minutes', value: 5 * 60 * 1000 },
  { name: '10 minutes', value: 10 * 60 * 1000 },
  { name: '1 hour', value: 60 * 60 * 1000 },
  { name: '1 day', value: 24 * 60 * 60 * 1000 }
];

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a member for a period of time.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName('user').setDescription('Member to mute').setRequired(true))
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription('Timeout duration')
        .setRequired(true)
        .addChoices(...durationChoices.map((choice) => ({ name: choice.name, value: choice.value.toString() })))
    )
    .addStringOption((option) => option.setName('reason').setDescription('Reason for the mute')),
  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const duration = Number(interaction.options.getString('duration', true));
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
      return;
    }

    try {
      const member = await interaction.guild.getMember(target.id);
      await member.edit({
        communicationDisabledUntil: new Date(Date.now() + duration).toISOString(),
        reason
      });
      await interaction.reply({
        content: `Muted **${target.tag}** for ${Math.round(duration / 60000)} minutes. Reason: ${reason}`
      });
    } catch (error) {
      console.error('Mute failed:', error);
      await interaction.reply({ content: 'Failed to mute that member. Check my permissions.', ephemeral: true });
    }
  }
};

export default command;
