import { SlashCommandBuilder, EmbedBuilder } from '#discord-compat';
const command = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display information about a user.')
        .addUserOption((option) => option.setName('user').setDescription('User to inspect')),
    async execute(interaction) {
        const user = interaction.options.getUser('user') ?? interaction.user;
        let member = null;
        if (interaction.inGuild() && interaction.guild) {
            try {
                member = await interaction.guild.getMember(user.id);
            }
            catch (error) {
                // Member might not be in the guild
            }
        }
        const embed = new EmbedBuilder()
            .setTitle(user.tag)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields({ name: 'ID', value: user.id });
        if (member?.joinedAt) {
            embed.addFields({ name: 'Joined Server', value: `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` });
        }
        embed.addFields({ name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>` }).setColor('Green');
        await interaction.reply({ embeds: [embed] });
    }
};
export default command;
