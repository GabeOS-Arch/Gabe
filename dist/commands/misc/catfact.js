import { SlashCommandBuilder } from '#discord-compat';
const facts = [
    'Cats have whiskers on the backs of their front legs.',
    'A group of cats is called a clowder.',
    'Cats can rotate their ears 180 degrees.',
    'Most cats have five toes on their front paws, but only four on the back paws.',
    'Cats sleep for around 70% of their lives.'
];
const command = {
    data: new SlashCommandBuilder().setName('catfact').setDescription('Get a random cat fact.'),
    async execute(interaction) {
        const fact = facts[Math.floor(Math.random() * facts.length)];
        await interaction.reply(`🐱 ${fact}`);
    }
};
export default command;
