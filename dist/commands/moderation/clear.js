import { SlashCommandBuilder, PermissionFlagsBits } from '#discord-compat';
const command = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete a number of recent messages in the current channel.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption((option) => option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount', true);
        await interaction.deferReply({ ephemeral: true });
        const channel = interaction.channel;
        if (!interaction.inGuild() || !channel || typeof channel.purge !== 'function') {
            await interaction.editReply('This command can only be used in a server text channel.');
            return;
        }
        try {
            const deleted = await channel.purge({
                limit: amount,
                reason: `Bulk delete requested by ${interaction.user.tag}`
            });
            await interaction.editReply(`Deleted ${deleted} message(s).`);
        }
        catch (error) {
            console.error('Clear failed:', error);
            await interaction.editReply('Failed to delete messages. I might lack permissions or messages are too old.');
        }
    }
};
export default command;
