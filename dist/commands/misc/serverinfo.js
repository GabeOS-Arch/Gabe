import { SlashCommandBuilder, EmbedBuilder } from '#discord-compat';
const command = {
    guildOnly: true,
    data: new SlashCommandBuilder().setName('serverinfo').setDescription('Display information about this server.'),
    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: 'This command can only be used inside a server.',
                ephemeral: true
            });
            return;
        }
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({ content: 'I could not fetch the guild details.', ephemeral: true });
            return;
        }
        const iconURL = guild.iconURL(undefined, 256);
        const embed = new EmbedBuilder().setTitle(guild.name);
        if (iconURL) {
            embed.setThumbnail(iconURL);
        }
        embed
            .addFields({ name: 'Members', value: guild.memberCount.toString(), inline: true }, { name: 'Owner', value: `<@${guild.ownerID}>`, inline: true }, { name: 'Created', value: `<t:${Math.floor((guild.createdAt?.getTime() ?? Date.now()) / 1000)}:R>` })
            .setColor('Blurple');
        await interaction.reply({ embeds: [embed] });
    }
};
export default command;
