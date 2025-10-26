import { SlashCommandBuilder, EmbedBuilder } from '#discord-compat';
async function fetchComic(number) {
    const url = number ? `https://xkcd.com/${number}/info.0.json` : 'https://xkcd.com/info.0.json';
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch XKCD comic ${number ?? 'latest'} (status ${response.status})`);
    }
    return response.json();
}
const command = {
    data: new SlashCommandBuilder()
        .setName('xkcd')
        .setDescription('Grab the latest, random, or specific XKCD comic—mirroring esmBot\'s comic fun.')
        .addIntegerOption((option) => option
        .setName('number')
        .setDescription('Specific comic number to fetch.')
        .setMinValue(1))
        .addBooleanOption((option) => option.setName('random').setDescription('Fetch a random comic instead of the latest.')),
    async execute(interaction) {
        const requestedNumber = interaction.options.getInteger('number');
        const random = interaction.options.getBoolean('random') ?? false;
        await interaction.deferReply();
        try {
            let comic;
            if (requestedNumber) {
                comic = await fetchComic(requestedNumber);
            }
            else if (random) {
                const latest = await fetchComic();
                const randomNumber = Math.floor(Math.random() * latest.num) + 1;
                comic = await fetchComic(randomNumber);
            }
            else {
                comic = await fetchComic();
            }
            const embed = new EmbedBuilder()
                .setTitle(`#${comic.num} • ${comic.title}`)
                .setURL(`https://xkcd.com/${comic.num}`)
                .setDescription(comic.alt || 'No alt text provided.')
                .setImage(comic.img)
                .setFooter({ text: `Published ${comic.year}-${comic.month}-${comic.day}` });
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            const err = error;
            console.error('XKCD command failed:', err);
            await interaction.editReply('Unable to retrieve that XKCD comic. Try another number!');
        }
    }
};
export default command;
