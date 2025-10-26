import { SlashCommandBuilder } from '#discord-compat';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CommandModule } from '../../types/command.js';

const modelName = 'gemini-2.5-pro';

function createClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set.');
  }
  return new GoogleGenerativeAI(apiKey);
}

const command: CommandModule = {
  data: new SlashCommandBuilder()
    .setName('ask-gemini')
    .setDescription('Chat with the Gemini AI assistant about anything you like.')
    .addStringOption((option) =>
      option.setName('prompt').setDescription('What would you like to ask?').setRequired(true)
    ),
  async execute(interaction) {
    const prompt = interaction.options.getString('prompt', true);
    await interaction.deferReply();
    await interaction.editOriginal({ content: '🌀 Asking Gemini...' });

    try {
      const client = createClient();
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response?.text() ?? 'Gemini returned an empty response.';

      await interaction.editOriginal({ content: response.slice(0, 1900) });
    } catch (error) {
      console.error('Gemini request failed:', error);
      const message =
        'I could not reach Gemini. Please verify that the API key is set and that your request is valid.';
      try {
        await interaction.editOriginal({ content: message });
      } catch (editError) {
        console.error('Failed to update Gemini placeholder message:', editError);
        try {
          await interaction.followUp({ content: message, ephemeral: true });
        } catch (followUpError) {
          console.error('Failed to send Gemini follow-up error message:', followUpError);
        }
      }
    }
  }
};

export default command;
