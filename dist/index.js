import { Client, Intents, InteractionTypes } from 'oceanic.js';
import { config } from 'dotenv';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import express from 'express'; // 👈 added for Cloud Run HTTP keepalive
import os from 'node:os';
import { applyDiscordCompatShims } from '#discord-compat';
config();
applyDiscordCompatShims();
function resolveDiscordToken() {
    const rawToken = process.env.DISCORD_TOKEN;
    if (!rawToken) {
        console.error('Missing DISCORD_TOKEN in environment.');
        process.exit(1);
    }
    const trimmedToken = rawToken.trim();
    if (!trimmedToken) {
        console.error('DISCORD_TOKEN is present but empty after trimming whitespace.');
        process.exit(1);
    }
    if (trimmedToken.length !== rawToken.length) {
        console.warn('DISCORD_TOKEN contained leading or trailing whitespace. Automatically trimmed it.');
    }
    return trimmedToken;
}
const token = resolveDiscordToken();
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Build intents list, only include privileged intents when explicitly enabled
const enablePrivilegedIntents = process.env.ENABLE_PRIVILEGED_INTENTS === 'true';
const intents = [
    Intents.GUILDS,
    Intents.GUILD_MESSAGES,
    Intents.GUILD_MESSAGE_REACTIONS,
    Intents.DIRECT_MESSAGES
];
if (enablePrivilegedIntents) {
    intents.push(Intents.GUILD_MEMBERS, Intents.MESSAGE_CONTENT);
}
if (!enablePrivilegedIntents) {
    console.info('Privileged intents (GuildMembers, MessageContent) are not enabled by environment.');
    console.info("If your bot needs member or message content access, set ENABLE_PRIVILEGED_INTENTS=true and enable those intents in the Discord Developer Portal for your application.");
}
const client = new Client({
    auth: `Bot ${token}`,
    gateway: {
        intents,
        removeDisallowedIntents: true
    }
});
client.commands = new Map();
let clientReadyAt = null;
let commandsLoaded = 0;
const recentEvents = [];
const MAX_EVENTS = 25;
const commandExtensions = new Set(['.js', '.ts']);
function pushEvent(type, detail, level = 'info') {
    recentEvents.unshift({
        type,
        detail,
        level,
        timestamp: new Date().toISOString()
    });
    if (recentEvents.length > MAX_EVENTS) {
        recentEvents.length = MAX_EVENTS;
    }
}
async function importCommandFresh(filePath, categoryName, cacheBustValue) {
    const fileUrl = url.pathToFileURL(filePath);
    const freshUrl = new URL(fileUrl.href);
    freshUrl.searchParams.set('update', String(cacheBustValue));
    try {
        const commandModule = (await import(freshUrl.href));
        return (commandModule?.default ?? commandModule);
    }
    catch (error) {
        const err = error;
        console.error(`Failed to load command module ${categoryName}/${path.basename(filePath)}`, err);
        pushEvent('Command Error', `Failed to load ${categoryName}/${path.basename(filePath)}: ${err.message ?? 'Unknown error.'}`, 'error');
        return undefined;
    }
}
async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const categories = await readdir(commandsPath, { withFileTypes: true });
    client.commands.clear();
    let loaded = 0;
    const cacheBustValue = Date.now();
    for (const category of categories) {
        if (!category.isDirectory())
            continue;
        const categoryPath = path.join(commandsPath, category.name);
        const files = await readdir(categoryPath);
        for (const file of files) {
            if (!commandExtensions.has(path.extname(file)))
                continue;
            const filePath = path.join(categoryPath, file);
            const command = await importCommandFresh(filePath, category.name, cacheBustValue);
            if (!command) {
                continue;
            }
            if (!command?.data?.name || typeof command.execute !== 'function') {
                console.warn(`Skipping invalid command module ${category.name}/${file}.`);
                pushEvent('Command Warning', `Skipped invalid command ${category.name}/${file}.`, 'warning');
                continue;
            }
            client.commands.set(command.data.name, command);
            console.log(`Loaded command ${command.data.name} (${category.name})`);
            loaded += 1;
        }
    }
    commandsLoaded = loaded;
    pushEvent('Commands', `Loaded ${loaded} commands.`, 'success');
}
const COMMAND_AUTO_RELOAD_MS = 5 * 60 * 1000;
let isReloadingCommands = false;
let autoReloadTimer = null;
async function reloadCommands(reasonForEvent) {
    if (isReloadingCommands) {
        const detail = 'Command reload skipped because another reload is already running.';
        console.warn(detail);
        pushEvent('Commands', detail, 'warning');
        return { skipped: true };
    }
    isReloadingCommands = true;
    try {
        await loadCommands();
        if (reasonForEvent) {
            pushEvent('Commands', reasonForEvent, 'success');
        }
        return { success: true };
    }
    catch (error) {
        const err = error;
        console.error('Command reload failed.', err);
        pushEvent('Commands', err.message ?? 'Failed to reload commands.', 'error');
        throw err;
    }
    finally {
        isReloadingCommands = false;
    }
}
function startAutoReload() {
    if (autoReloadTimer) {
        return;
    }
    autoReloadTimer = setInterval(() => {
        reloadCommands('Commands auto-reloaded (scheduled).')
            .then((result) => {
            if (result?.skipped) {
                console.info('Scheduled command reload skipped because another reload is running.');
            }
        })
            .catch((error) => {
            console.error('Scheduled command reload failed.', error);
        });
    }, COMMAND_AUTO_RELOAD_MS);
    pushEvent('Commands', `Scheduled automatic reload every ${Math.round(COMMAND_AUTO_RELOAD_MS / 60000)} minutes.`, 'info');
}
client.once('ready', () => {
    clientReadyAt = new Date();
    console.log(`✅ Logged in as ${client.user.tag}`);
    pushEvent('Ready', `Logged in as ${client.user.tag}.`, 'success');
});
client.on('interactionCreate', async (interaction) => {
    if (interaction.type !== InteractionTypes.APPLICATION_COMMAND)
        return;
    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.warn(`No command handler for ${interaction.commandName}`);
        return interaction.reply({ content: 'Command not implemented.', ephemeral: true });
    }
    try {
        await command.execute(interaction);
        pushEvent('Command', `Executed /${interaction.commandName}`, 'success');
    }
    catch (error) {
        const err = error;
        console.error(`Error executing command ${interaction.commandName}`, err);
        pushEvent('Command Error', err.message ?? 'Unknown error.', 'error');
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({
                content: 'Something went wrong executing that command.',
                ephemeral: true
            });
        }
        else {
            await interaction.reply({
                content: 'Something went wrong executing that command.',
                ephemeral: true
            });
        }
    }
});
client.on('error', (error) => {
    console.error('Discord client error', error);
    const message = typeof error === 'string' ? error : error?.message ?? 'Unknown error.';
    pushEvent('Client Error', message, 'error');
});
client.on('warn', (info) => {
    console.warn('Discord client warning', info);
    pushEvent('Warning', typeof info === 'string' ? info : JSON.stringify(info), 'warning');
});
client.on('shardReady', (shardId) => {
    pushEvent('Shard Ready', `Shard ${shardId} ready.`, 'success');
});
async function bootstrap() {
    try {
        await loadCommands();
        await client.connect();
        startAutoReload();
    }
    catch (error) {
        // Many startup failures present as a login error after attempting to open
        // the websocket. Detect the common "Used disallowed intents" error and
        // provide guidance.
        console.error('Failed to load commands or connect to Discord');
        const err = error;
        console.error(err);
        const msg = err?.message || String(err);
        if (msg.includes('Used disallowed intents') || msg.includes('disallowed intents')) {
            console.error('\n⚠️ Discord rejected the bot connection because it requested privileged intents that are not enabled.');
            console.error('Possible fixes:');
            console.error("  - In the Discord Developer Portal for your application, enable 'SERVER MEMBERS INTENT' and/or 'MESSAGE CONTENT INTENT' as needed.");
            console.error("  - Alternatively, set the environment variable ENABLE_PRIVILEGED_INTENTS=false to start without those privileged intents (recommended if you don't need them).");
            console.error("  - Ensure your bot token is correct and belongs to the application you updated.");
        }
        pushEvent('Startup Error', msg ?? 'Unknown error.', 'error');
        // Exit with failure code so orchestrators detect the problem.
        process.exit(1);
    }
}
bootstrap();
// --- 👇 Cloud Run keepalive server 👇 ---
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.json());
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** exponent;
    return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
function formatDuration(ms) {
    if (!ms || ms < 0)
        return '0s';
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const parts = [];
    if (hours)
        parts.push(`${hours}h`);
    if (minutes)
        parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
}
function getShardLatencies() {
    return Array.from(client.shards.values())
        .map((shard) => shard.latency)
        .filter((latency) => Number.isFinite(latency) && latency > 0);
}
function getAverageShardLatency() {
    const latencies = getShardLatencies();
    if (!latencies.length) {
        return null;
    }
    const sum = latencies.reduce((total, value) => total + value, 0);
    return Math.round(sum / latencies.length);
}
function getLastHeartbeatTimestamp() {
    const timestamps = Array.from(client.shards.values())
        .map((shard) => shard.lastHeartbeatReceived)
        .filter((value) => typeof value === 'number' && value > 0);
    if (!timestamps.length) {
        return null;
    }
    return Math.max(...timestamps);
}
async function refreshGuildCache() {
    for (const guild of client.guilds.values()) {
        try {
            await client.rest.guilds.get(guild.id);
        }
        catch (error) {
            console.warn(`Failed to refresh guild cache for ${guild.id}`, error);
        }
    }
}
app.get('/api/status', (_, res) => {
    const ready = client.ready;
    const status = ready ? 'online' : 'offline';
    const uptimeMs = ready && client.uptime ? client.uptime : 0;
    const memory = process.memoryUsage();
    const guilds = client.guilds;
    const wsPing = getAverageShardLatency();
    const lastHeartbeat = getLastHeartbeatTimestamp();
    res.json({
        status,
        ready,
        wsPing,
        lastHeartbeat: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : null,
        guilds: {
            total: guilds.size,
            names: Array.from(guilds.values())
                .map((guild) => guild.name)
                .slice(0, 10)
        },
        uptime: {
            ms: uptimeMs,
            human: formatDuration(uptimeMs),
            startedAt: clientReadyAt ? clientReadyAt.toISOString() : null
        },
        commandsLoaded,
        memory: {
            heapUsed: formatBytes(memory.heapUsed),
            rss: formatBytes(memory.rss)
        },
        environment: {
            node: process.version,
            platform: `${os.type()} ${os.release()}`,
            processUptime: formatDuration(process.uptime() * 1000)
        },
        recentEvents: recentEvents.slice(0, 10)
    });
});
app.post('/api/reload-commands', async (_, res) => {
    try {
        const result = await reloadCommands('Commands reloaded from portal.');
        if (result?.skipped) {
            res.status(409).json({ message: 'Command reload already in progress.' });
            return;
        }
        res.json({ success: true, events: recentEvents.slice(0, 5) });
    }
    catch (error) {
        const err = error;
        console.error('Failed to reload commands from portal', err);
        res.status(500).json({ message: 'Failed to reload commands.' });
    }
});
app.post('/api/sync-guilds', async (_, res) => {
    try {
        await refreshGuildCache();
        pushEvent('Guilds', 'Guild cache refreshed.', 'success');
        res.json({ success: true, events: recentEvents.slice(0, 5) });
    }
    catch (error) {
        const err = error;
        console.error('Failed to refresh guild cache', err);
        pushEvent('Guilds', err.message ?? 'Failed to refresh guild cache.', 'error');
        res.status(500).json({ message: 'Failed to refresh guild cache.' });
    }
});
app.get('/api/health-check', (_, res) => {
    const ready = client.ready;
    const ping = getAverageShardLatency();
    const lastHeartbeat = getLastHeartbeatTimestamp();
    const ok = ready && ping !== null && ping < 250;
    const summary = ok
        ? 'All systems operational.'
        : 'Some checks failed. Investigate the metrics below.';
    const events = [
        {
            type: 'Connection',
            detail: ready ? 'Client connected to Discord.' : 'Client not ready.',
            level: ready ? 'success' : 'warning'
        },
        {
            type: 'Latency',
            detail: ping !== null ? `${ping} ms` : 'Ping unavailable.',
            level: ping !== null && ping < 250 ? 'success' : 'warning'
        },
        {
            type: 'Heartbeat',
            detail: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : 'No heartbeat recorded.',
            level: lastHeartbeat ? 'success' : 'warning'
        }
    ];
    res.json({ ok, summary, events });
});
app.get('/healthz', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/', (_, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});
app.listen(PORT, () => {
    console.log(`🌐 HTTP server listening on port ${PORT}`);
    pushEvent('HTTP', `Listening on port ${PORT}`, 'success');
});
