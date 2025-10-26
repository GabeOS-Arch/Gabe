import { SlashCommandBuilder } from '#discord-compat';
import { addImageOptions, processImageCommand } from '../../utils/image.js';
import type { CommandModule } from '../../types/command.js';

const DEFAULT_STRENGTH = 5;
const MIN_STRENGTH = 1;
const MAX_STRENGTH = 50;

const command: CommandModule = {
  data: addImageOptions(
    new SlashCommandBuilder()
      .setName('blur')
      .setDescription('Blur an image or avatar for a soft focus effect.')
      .addIntegerOption((option) =>
        option
          .setName('strength')
          .setDescription('How intense the blur should be (1-50).')
          .setMinValue(MIN_STRENGTH)
          .setMaxValue(MAX_STRENGTH)
      )
  ),
  async execute(interaction) {
    const strength = interaction.options.getInteger('strength') ?? DEFAULT_STRENGTH;
    const blurStrength = Math.min(Math.max(strength, MIN_STRENGTH), MAX_STRENGTH);

    await processImageCommand(
      interaction,
      (image) => image.blur(blurStrength),
      {
        fileNameSuffix: `blur-${blurStrength}`,
        successMessage: `Blurred with strength ${blurStrength}.`
      }
    );
  }
};

export default command;
