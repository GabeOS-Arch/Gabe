import { SlashCommandBuilder } from '#discord-compat';
import type { CommandModule } from '../../types/command.js';

function formatInTimeZone(date: Date, timeZone: string): string | null {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      dateStyle: 'full',
      timeStyle: 'long'
    }).format(date);
  } catch (error) {
    return null;
  }
}

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('timezone')
    .setDescription('Show the current time in a given IANA timezone.')
    .addStringOption((option) => option.setName('zone').setDescription('IANA time zone, e.g., Europe/Paris').setRequired(true)),
  async execute(interaction) {
    const zone = interaction.options.getString('zone', true);
    const now = new Date();
    const formatted = formatInTimeZone(now, zone);

    if (!formatted) {
      return interaction.reply({ content: 'That did not look like a valid IANA time zone.', ephemeral: true });
    }

    await interaction.reply({ content: `🕒 The current time in **${zone}** is ${formatted}.` });
  }
};

export default command;
