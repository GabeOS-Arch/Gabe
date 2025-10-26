import { SlashCommandBuilder } from '#discord-compat';
const command = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot\'s latency.'),
    async execute(interaction) {
        const sent = (await interaction.reply({ content: 'Pinging...', fetchReply: true }));
        const latency = sent.timestamp.getTime() - (interaction.createdAt?.getTime() ?? Date.now());
        const shardLatencies = Array.from(interaction.client.shards.values())
            .map((shard) => shard.latency)
            .filter((value) => Number.isFinite(value) && value > 0);
        const heartbeat = shardLatencies.length
            ? Math.round(shardLatencies.reduce((total, value) => total + value, 0) / shardLatencies.length)
            : null;
        await interaction.editReply(heartbeat === null
            ? `Pong! Round-trip ${latency}ms.`
            : `Pong! Round-trip ${latency}ms. Websocket heartbeat ${heartbeat}ms.`);
    }
};
export default command;
