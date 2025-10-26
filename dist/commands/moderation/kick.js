import { SlashCommandBuilder, PermissionFlagsBits } from '#discord-compat';
const command = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption((option) => option.setName('user').setDescription('Member to kick').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('Reason for the kick').setMaxLength(200)),
    async execute(interaction) {
        const target = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        if (!interaction.inGuild() || !interaction.guild) {
            await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
            return;
        }
        try {
            const member = await interaction.guild.getMember(target.id);
            await member.kick(reason);
            await interaction.reply({ content: `Kicked **${target.tag}**. Reason: ${reason}` });
        }
        catch (error) {
            console.error('Kick failed:', error);
            await interaction.reply({ content: 'Failed to kick that member. Check my permissions.', ephemeral: true });
        }
    }
};
export default command;
