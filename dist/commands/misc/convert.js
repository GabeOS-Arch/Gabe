import { SlashCommandBuilder } from '#discord-compat';
const command = {
    data: new SlashCommandBuilder()
        .setName('convert')
        .setDescription('Convert between temperature or distance units.')
        .addSubcommand((sub) => sub
        .setName('temperature')
        .setDescription('Convert between Celsius and Fahrenheit')
        .addNumberOption((option) => option.setName('value').setDescription('Value to convert').setRequired(true))
        .addStringOption((option) => option
        .setName('scale')
        .setDescription('Scale to convert from')
        .setRequired(true)
        .addChoices({ name: 'Celsius to Fahrenheit', value: 'c_to_f' }, { name: 'Fahrenheit to Celsius', value: 'f_to_c' })))
        .addSubcommand((sub) => sub
        .setName('distance')
        .setDescription('Convert between kilometers and miles')
        .addNumberOption((option) => option.setName('value').setDescription('Value to convert').setRequired(true))
        .addStringOption((option) => option
        .setName('scale')
        .setDescription('Direction of conversion')
        .setRequired(true)
        .addChoices({ name: 'Kilometers to miles', value: 'km_to_mi' }, { name: 'Miles to kilometers', value: 'mi_to_km' }))),
    async execute(interaction) {
        const subPath = interaction.options.getSubCommand(true);
        const sub = subPath[subPath.length - 1];
        const value = interaction.options.getNumber('value', true);
        const scale = interaction.options.getString('scale', true);
        let result;
        if (sub === 'temperature') {
            result = scale === 'c_to_f' ? value * (9 / 5) + 32 : (value - 32) * (5 / 9);
            const unit = scale === 'c_to_f' ? '°F' : '°C';
            return interaction.reply({ content: `${value}${scale === 'c_to_f' ? '°C' : '°F'} = ${result.toFixed(2)}${unit}` });
        }
        if (sub === 'distance') {
            result = scale === 'km_to_mi' ? value * 0.621371 : value / 0.621371;
            const unit = scale === 'km_to_mi' ? 'mi' : 'km';
            return interaction.reply({ content: `${value} ${scale === 'km_to_mi' ? 'km' : 'mi'} = ${result.toFixed(2)} ${unit}` });
        }
    }
};
export default command;
