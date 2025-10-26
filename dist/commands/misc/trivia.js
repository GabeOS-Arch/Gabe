import { SlashCommandBuilder } from '#discord-compat';
const questions = [
    {
        question: 'What planet is known as the Red Planet?',
        answer: 'Mars'
    },
    {
        question: 'Who wrote the novel "1984"?',
        answer: 'George Orwell'
    },
    {
        question: 'How many elements are there on the periodic table?',
        answer: '118'
    },
    {
        question: 'What is the tallest mountain in the world?',
        answer: 'Mount Everest'
    },
    {
        question: 'Which ocean is the largest?',
        answer: 'Pacific Ocean'
    }
];
const command = {
    data: new SlashCommandBuilder().setName('trivia').setDescription('Receive a random trivia question.'),
    async execute(interaction) {
        const item = questions[Math.floor(Math.random() * questions.length)];
        await interaction.reply(`❓ ${item.question}\n||${item.answer}||`);
    }
};
export default command;
