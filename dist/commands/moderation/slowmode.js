import { SlashCommandBuilder, PermissionFlagsBits } from '#discord-compat';
const command = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Configure slowmode for the current channel.')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addIntegerOption((option) => option
        .setName('seconds')
        .setDescription('Slowmode delay in seconds (0 disables)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)),
    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds', true);
        await interaction.deferReply({ ephemeral: true });
        const channel = interaction.channel;
        if (!interaction.inGuild() || !channel || typeof channel.edit !== 'function') {
            await interaction.editReply('This command can only be used in a server text channel.');
            return;
        }
        try {
            await channel.edit({
                rateLimitPerUser: seconds,
                reason: `Changed by ${interaction.user.tag}`
            });
            await interaction.editReply(seconds === 0 ? 'Slowmode disabled.' : `Slowmode set to ${seconds}s.`);
        }
        catch (error) {
            console.error('Slowmode failed:', error);
            await interaction.editReply('Failed to update slowmode.');
        }
    }
};
export default command;
