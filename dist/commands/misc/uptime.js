import { SlashCommandBuilder } from '#discord-compat';
function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
        days ? `${days}d` : null,
        hours ? `${hours}h` : null,
        minutes ? `${minutes}m` : null,
        `${seconds}s`
    ]
        .filter(Boolean)
        .join(' ');
}
const command = {
    data: new SlashCommandBuilder().setName('uptime').setDescription('Check how long the bot has been running.'),
    async execute(interaction) {
        const uptime = interaction.client.uptime ?? 0;
        await interaction.reply({ content: `⏳ I have been online for ${formatDuration(uptime)}.` });
    }
};
export default command;
