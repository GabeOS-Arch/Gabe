import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const WARNINGS_URL = new URL('../../data/warnings.json', import.meta.url);
const WARNINGS_PATH = fileURLToPath(WARNINGS_URL);
async function loadWarnings() {
    if (!existsSync(WARNINGS_PATH)) {
        await writeFile(WARNINGS_PATH, JSON.stringify({}, null, 2));
    }
    const raw = await readFile(WARNINGS_PATH, 'utf-8');
    try {
        return JSON.parse(raw);
    }
    catch (error) {
        console.error('Failed to parse warnings file, resetting.', error);
        await saveWarnings({});
        return {};
    }
}
async function saveWarnings(warnings) {
    await writeFile(WARNINGS_PATH, JSON.stringify(warnings, null, 2));
}
export async function addWarning(guildId, userId, moderatorId, reason) {
    const warnings = await loadWarnings();
    if (!warnings[guildId])
        warnings[guildId] = {};
    if (!warnings[guildId][userId])
        warnings[guildId][userId] = [];
    warnings[guildId][userId].push({ moderatorId, reason, timestamp: new Date().toISOString() });
    await saveWarnings(warnings);
    return warnings[guildId][userId];
}
export async function getWarnings(guildId, userId) {
    const warnings = await loadWarnings();
    return warnings[guildId]?.[userId] ?? [];
}
export async function clearWarnings(guildId, userId) {
    const warnings = await loadWarnings();
    if (warnings[guildId]) {
        delete warnings[guildId][userId];
        if (Object.keys(warnings[guildId]).length === 0) {
            delete warnings[guildId];
        }
        await saveWarnings(warnings);
    }
}
export { WARNINGS_PATH };
