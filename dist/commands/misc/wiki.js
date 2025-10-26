import { SlashCommandBuilder, EmbedBuilder } from '#discord-compat';
const command = {
    data: new SlashCommandBuilder()
        .setName('wiki')
        .setDescription('Look up Wikipedia summaries, much like esmBot\'s encyclopedia tools.')
        .addStringOption((option) => option
        .setName('query')
        .setDescription('Topic to search on Wikipedia.')
        .setRequired(true)),
    async execute(interaction) {
        const query = interaction.options.getString('query', true);
        await interaction.deferReply();
        try {
            const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
            if (response.status === 404) {
                await interaction.editReply(`No Wikipedia article found for **${query}**.`);
                return;
            }
            if (!response.ok) {
                throw new Error(`Wikipedia summary failed with status ${response.status}`);
            }
            const summary = await response.json();
            const embed = new EmbedBuilder()
                .setTitle(summary.title)
                .setURL(summary.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(summary.title)}`)
                .setDescription(summary.extract || 'No summary available.')
                .setFooter({ text: summary.description ?? 'Wikipedia' });
            if (summary.thumbnail?.source) {
                embed.setThumbnail(summary.thumbnail.source);
            }
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Wikipedia lookup failed:', error);
            await interaction.editReply('Wikipedia had trouble with that request. Try adjusting your search!');
        }
    }
};
export default command;
