import { SlashCommandBuilder } from '#discord-compat';
import { addImageOptions, processImageCommand } from '../../utils/image.js';
import type { CommandModule } from '../../types/command.js';

const DEFAULT_AMOUNT = 0.25;
const MIN_AMOUNT = -1;
const MAX_AMOUNT = 1;

function formatPercent(amount: number): string {
  const percent = Math.round(amount * 100);
  if (percent === 0) {
    return '0%';
  }
  return `${percent > 0 ? '+' : ''}${percent}%`;
}

const command: CommandModule = {
  data: addImageOptions(
    new SlashCommandBuilder()
      .setName('brightness')
      .setDescription('Brighten or darken an image or avatar.')
      .addNumberOption((option) =>
        option
          .setName('amount')
          .setDescription('Brightness adjustment between -1.0 (darker) and 1.0 (brighter).')
          .setMinValue(MIN_AMOUNT)
          .setMaxValue(MAX_AMOUNT)
      )
  ),
  async execute(interaction) {
    const amount = interaction.options.getNumber('amount') ?? DEFAULT_AMOUNT;
    const clampedAmount = Math.min(Math.max(amount, MIN_AMOUNT), MAX_AMOUNT);

    await processImageCommand(
      interaction,
      (sharpImage) => {
        if (clampedAmount <= -0.999) {
          return sharpImage.linear(0, 0);
        }
        const brightnessFactor = 1 + clampedAmount;
        return sharpImage.modulate({ brightness: Math.max(0.001, brightnessFactor) });
      },
      {
        fileNameSuffix: `brightness-${Math.round(clampedAmount * 100)}`,
        successMessage: `Adjusted brightness by ${formatPercent(
          clampedAmount
        )}.\n(Use negative values to darken.)`
      }
    );
  }
};

export default command;
