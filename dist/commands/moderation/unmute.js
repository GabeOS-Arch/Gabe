import { SlashCommandBuilder, PermissionFlagsBits } from '#discord-compat';
const command = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remove a timeout from a member.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption((option) => option.setName('user').setDescription('Member to unmute').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('Reason for unmuting')),
    async execute(interaction) {
        const target = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        if (!interaction.inGuild() || !interaction.guild) {
            await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
            return;
        }
        try {
            const member = await interaction.guild.getMember(target.id);
            await member.edit({ communicationDisabledUntil: null, reason });
            await interaction.reply({ content: `Removed timeout from **${target.tag}**.` });
        }
        catch (error) {
            console.error('Unmute failed:', error);
            await interaction.reply({ content: 'Failed to remove timeout for that member.', ephemeral: true });
        }
    }
};
export default command;
