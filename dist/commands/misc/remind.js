import { SlashCommandBuilder } from '#discord-compat';
const MAX_DELAY = 24 * 60 * 60 * 1000; // 24 hours
const command = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder that pings you later.')
        .addIntegerOption((option) => option
        .setName('minutes')
        .setDescription('How many minutes from now to remind you (max 1440)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1440))
        .addStringOption((option) => option.setName('message').setDescription('Reminder message').setRequired(true)),
    async execute(interaction) {
        const minutes = interaction.options.getInteger('minutes', true);
        const message = interaction.options.getString('message', true);
        const delay = minutes * 60 * 1000;
        if (delay > MAX_DELAY) {
            return interaction.reply({ content: 'Please choose a time under 24 hours.', ephemeral: true });
        }
        await interaction.reply({ content: `I will DM you in ${minutes} minute(s).`, ephemeral: true });
        setTimeout(async () => {
            try {
                const dm = await interaction.user.createDM();
                await dm.createMessage({ content: `⏰ Reminder from ${interaction.guild?.name ?? 'the bot'}: ${message}` });
            }
            catch (error) {
                console.error('Failed to send reminder DM, falling back to channel.', error);
                const channel = interaction.channel;
                if (channel && 'createMessage' in channel && typeof channel.createMessage === 'function') {
                    const textChannel = channel;
                    try {
                        await textChannel.createMessage({ content: `${interaction.user.mention} ⏰ Reminder: ${message}` });
                    }
                    catch (sendError) {
                        console.error('Failed to send reminder to channel as well.', sendError);
                    }
                }
            }
        }, delay);
    }
};
export default command;
