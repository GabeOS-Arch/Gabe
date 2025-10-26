import { SlashCommandBuilder, PermissionFlagsBits } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

type PrunableDays = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) => option.setName('user').setDescription('Member to ban').setRequired(true))
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Reason for the ban')
        .setMaxLength(200)
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('delete_days')
        .setDescription('Days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const deleteDays = (interaction.options.getInteger('delete_days') ?? 0) as PrunableDays;

    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
      return;
    }

    try {
      const guild = interaction.guild;
      try {
        const member = await guild.getMember(target.id);
        await member.ban({ deleteMessageDays: deleteDays, reason });
      } catch (memberError) {
        console.warn('Member not cached or fetch failed, attempting to ban via REST.', memberError);
        await guild.createBan(target.id, { deleteMessageDays: deleteDays, reason });
      }

      await interaction.reply({ content: `Banned **${target.tag}**. Reason: ${reason}` });
    } catch (error) {
      console.error('Ban failed:', error);
      await interaction.reply({ content: 'Failed to ban that member. Check my permissions.', ephemeral: true });
    }
  }
};

export default command;
