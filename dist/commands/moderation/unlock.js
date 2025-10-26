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
        .setName('unlock')
        .setDescription('Allow everyone to send messages in this channel again.')
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
            const newDeny = currentDeny & ~Permissions.SEND_MESSAGES;
            await channel.editPermission(everyoneId, {
                type: OverwriteTypes.ROLE,
                allow: currentAllow,
                deny: newDeny,
                reason: `Unlocked by ${interaction.user.tag}`
            });
            await interaction.editReply('Channel unlocked.');
        }
        catch (error) {
            console.error('Unlock failed:', error);
            await interaction.editReply('Failed to unlock the channel.');
        }
    }
};
export default command;
