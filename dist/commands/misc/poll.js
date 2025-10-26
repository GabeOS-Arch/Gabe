import { SlashCommandBuilder, EmbedBuilder } from '#discord-compat';
const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
const requiredPermissions = ['ADD_REACTIONS', 'READ_MESSAGE_HISTORY'];
function formatPermissionName(permission) {
    return permission
        .split('_')
        .map((segment) => segment[0] + segment.slice(1).toLowerCase())
        .join(' ');
}
function formatPermissionList(permissions) {
    const readable = permissions.map((permission) => formatPermissionName(permission));
    if (readable.length <= 1) {
        return readable[0] ?? '';
    }
    const last = readable.at(-1);
    return `${readable.slice(0, -1).join(', ')} and ${last}`;
}
const command = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a reaction poll with up to five options.')
        .addStringOption((option) => option.setName('question').setDescription('Poll question').setRequired(true))
        .addStringOption((option) => option
        .setName('options')
        .setDescription('Comma separated list of up to five options')
        .setRequired(true)),
    async execute(interaction) {
        const missingPermissions = requiredPermissions.filter((permission) => !interaction.appPermissions?.has(permission));
        if (missingPermissions.length > 0) {
            const permissionList = formatPermissionList(missingPermissions);
            const plural = missingPermissions.length > 1 ? 'permissions' : 'permission';
            return interaction.reply({
                content: `I need the ${permissionList} ${plural} in this channel before I can create a poll. Ask a server admin to adjust the app permissions and try again.`,
                ephemeral: true
            });
        }
        const question = interaction.options.getString('question', true);
        const rawOptions = interaction.options.getString('options', true);
        const options = rawOptions
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
            .slice(0, emojis.length);
        if (options.length < 2) {
            return interaction.reply({ content: 'Provide at least two poll options.', ephemeral: true });
        }
        const description = options.map((option, index) => `${emojis[index]} ${option}`).join('\n');
        const embed = new EmbedBuilder().setTitle(question).setDescription(description).setColor('Yellow');
        const message = (await interaction.reply({ embeds: [embed], fetchReply: true }));
        for (let i = 0; i < options.length; i += 1) {
            await message.react(emojis[i]);
        }
    }
};
export default command;
