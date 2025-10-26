import { SlashCommandBuilder } from '#discord-compat';
import { addImageOptions, processImageCommand } from '../../utils/image.js';
const DEFAULT_AMOUNT = 0.3;
const MIN_AMOUNT = -1;
const MAX_AMOUNT = 1;
function formatPercent(amount) {
    const percent = Math.round(amount * 100);
    if (percent === 0) {
        return '0%';
    }
    return `${percent > 0 ? '+' : ''}${percent}%`;
}
const command = {
    data: addImageOptions(new SlashCommandBuilder()
        .setName('contrast')
        .setDescription('Boost or reduce the contrast of an image or avatar.')
        .addNumberOption((option) => option
        .setName('amount')
        .setDescription('Contrast adjustment between -1.0 (flatter) and 1.0 (punchier).')
        .setMinValue(MIN_AMOUNT)
        .setMaxValue(MAX_AMOUNT))),
    async execute(interaction) {
        const amount = interaction.options.getNumber('amount') ?? DEFAULT_AMOUNT;
        const clampedAmount = Math.min(Math.max(amount, MIN_AMOUNT), MAX_AMOUNT);
        await processImageCommand(interaction, (sharpImage) => {
            if (clampedAmount === 0) {
                return sharpImage;
            }
            const normalized = Math.max(-1, Math.min(1, clampedAmount));
            const scaled = normalized * 255;
            const factor = (259 * (scaled + 255)) / (255 * (259 - scaled));
            const intercept = 128 * (1 - factor);
            return sharpImage.linear(factor, intercept);
        }, {
            fileNameSuffix: `contrast-${Math.round(clampedAmount * 100)}`,
            successMessage: `Contrast nudged by ${formatPercent(clampedAmount)}.\n(Use negative values to flatten.)`
        });
    }
};
export default command;
