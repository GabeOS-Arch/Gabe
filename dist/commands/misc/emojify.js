import { SlashCommandBuilder } from '#discord-compat';
const alphabet = {
    a: '🇦',
    b: '🇧',
    c: '🇨',
    d: '🇩',
    e: '🇪',
    f: '🇫',
    g: '🇬',
    h: '🇭',
    i: '🇮',
    j: '🇯',
    k: '🇰',
    l: '🇱',
    m: '🇲',
    n: '🇳',
    o: '🇴',
    p: '🇵',
    q: '🇶',
    r: '🇷',
    s: '🇸',
    t: '🇹',
    u: '🇺',
    v: '🇻',
    w: '🇼',
    x: '🇽',
    y: '🇾',
    z: '🇿'
};
const command = {
    data: new SlashCommandBuilder()
        .setName('emojify')
        .setDescription('Transform a word into regional indicator emojis.')
        .addStringOption((option) => option.setName('text').setDescription('Text to emojify').setRequired(true)),
    async execute(interaction) {
        const text = interaction.options.getString('text', true).toLowerCase();
        const converted = Array.from(text)
            .map((char) => alphabet[char] ?? char)
            .join('');
        await interaction.reply(converted);
    }
};
export default command;
