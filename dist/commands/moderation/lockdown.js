import { SlashCommandBuilder, PermissionFlagsBits } from '#discord-compat';
import { OverwriteTypes, Permissions } from 'oceanic.js';
function isPermissionEditableChannel(channel) {
    return (typeof channel === 'object' &&
        channel !== null &&
        'permissionOverwrites' in channel &&
        'editPermission' in channel &&
        typeof channel.editPermission === 'function');
}
const command = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Prevent everyone from sending messages in this channel.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const channel = interaction.channel;
        if (!interaction.inGuild() || !interaction.guild || !channel || !isPermissionEditableChannel(channel)) {
            await interaction.editReply('This command can only be used inside a server channel.');
            return;
        }
        try {
            const everyoneId = interaction.guildID;
            const overwrite = channel.permissionOverwrites.get(everyoneId);
            const currentAllow = overwrite?.allow ?? 0n;
            const currentDeny = overwrite?.deny ?? 0n;
            const newDeny = currentDeny | Permissions.SEND_MESSAGES;
            await channel.editPermission(everyoneId, {
                type: OverwriteTypes.ROLE,
                allow: currentAllow,
                deny: newDeny,
                reason: `Locked by ${interaction.user.tag}`
            });
            await interaction.editReply('Channel locked.');
        }
        catch (error) {
            console.error('Lockdown failed:', error);
            await interaction.editReply('Failed to lock the channel.');
        }
    }
};
export default command;
