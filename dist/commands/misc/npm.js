import { SlashCommandBuilder, EmbedBuilder } from '#discord-compat';
function formatDate(dateString) {
    if (!dateString) {
        return 'Unknown';
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return 'Unknown';
    }
    return date.toISOString().split('T')[0];
}
const command = {
    data: new SlashCommandBuilder()
        .setName('npm')
        .setDescription('Fetch npm package information similar to esmBot\'s registry helpers.')
        .addStringOption((option) => option.setName('package').setDescription('Package name to inspect.').setRequired(true)),
    async execute(interaction) {
        const pkgName = interaction.options.getString('package', true).trim();
        await interaction.deferReply();
        try {
            const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkgName)}`);
            if (response.status === 404) {
                await interaction.editReply(`Package **${pkgName}** was not found on npm.`);
                return;
            }
            if (!response.ok) {
                throw new Error(`npm registry request failed with status ${response.status}`);
            }
            const data = await response.json();
            const latestVersion = data?.['dist-tags']?.latest;
            if (!latestVersion) {
                await interaction.editReply(`Could not determine the latest version for **${pkgName}**.`);
                return;
            }
            const latestMetadata = data.versions?.[latestVersion] ?? {};
            const { description = 'No description provided.', homepage, repository } = latestMetadata;
            const author = latestMetadata.author?.name || latestMetadata._npmUser?.name || 'Unknown';
            const publishedDate = formatDate(data.time?.[latestVersion]);
            const embed = new EmbedBuilder()
                .setTitle(`${pkgName}@${latestVersion}`)
                .setURL(`https://www.npmjs.com/package/${encodeURIComponent(pkgName)}`)
                .setDescription(description)
                .addFields({ name: 'Author', value: author, inline: true }, { name: 'Published', value: publishedDate, inline: true });
            if (homepage) {
                embed.addFields({ name: 'Homepage', value: homepage });
            }
            if (repository?.url) {
                embed.addFields({ name: 'Repository', value: repository.url.replace(/^git\+/, '') });
            }
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            const err = error;
            console.error('npm lookup failed:', err);
            await interaction.editReply('Unable to contact the npm registry right now.');
        }
    }
};
export default command;
