import { config } from 'dotenv';
import { Client } from 'oceanic.js';
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';
import url from 'node:url';
import { Agent, ProxyAgent } from 'undici';
import { resolveCommandScopes } from './utils/command-scopes.js';
import type { CommandModule } from './types/command.js';
import type { CreateChatInputApplicationCommandOptions } from 'oceanic.js';

config();

const commandExtensions = new Set(['.js', '.ts']);

function resolveDiscordToken(): string | undefined {
  const rawToken = process.env.DISCORD_TOKEN;

  if (!rawToken) {
    return undefined;
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
const rawClientId = process.env.DISCORD_CLIENT_ID?.trim();
const guildId = process.env.DISCORD_GUILD_ID?.trim();

if (!token || !rawClientId) {
  console.error('DISCORD_TOKEN and DISCORD_CLIENT_ID must be set to deploy commands.');
  process.exit(1);
}

const clientId = rawClientId;

function resolveConnectTimeout(): number | undefined {
  const rawTimeout = process.env.DISCORD_CONNECT_TIMEOUT_MS;
  if (!rawTimeout) {
    return undefined;
  }

  const parsedTimeout = Number.parseInt(rawTimeout, 10);
  if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0) {
    console.error(
      'DISCORD_CONNECT_TIMEOUT_MS must be a positive integer representing milliseconds. '
        + `Received: ${rawTimeout}`,
    );
    process.exit(1);
  }

  return parsedTimeout;
}

function createDiscordDispatcher(): Agent | ProxyAgent | undefined {
  const connectTimeout = resolveConnectTimeout();
  const connectOptions = connectTimeout ? { timeout: connectTimeout } : undefined;
  const proxyUrl = process.env.DISCORD_PROXY_URL ?? process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;

  if (proxyUrl) {
    try {
      return new ProxyAgent({
        uri: proxyUrl,
        connect: connectOptions,
      });
    } catch (error) {
      console.error('Failed to configure Discord proxy agent. Verify DISCORD_PROXY_URL/HTTPS_PROXY.', error);
      process.exit(1);
    }
  }

  if (connectOptions) {
    return new Agent({ connect: connectOptions });
  }

  return undefined;
}

const dispatcher = createDiscordDispatcher();

if (dispatcher && process.env.DISCORD_PROXY_URL) {
  console.log('Routing Discord API requests through the configured proxy (DISCORD_PROXY_URL).');
} else if (dispatcher && (process.env.HTTPS_PROXY || process.env.HTTP_PROXY)) {
  console.log('Routing Discord API requests through the configured proxy (HTTP(S)_PROXY).');
} else if (dispatcher && process.env.DISCORD_CONNECT_TIMEOUT_MS) {
  console.log(`Configured Discord connect timeout: ${process.env.DISCORD_CONNECT_TIMEOUT_MS}ms.`);
}

const restClient = new Client({
  auth: `Bot ${token}`,
  rest: {
    agent: dispatcher ?? undefined
  }
});

async function collectCommands(): Promise<{
  guildCommands: CreateChatInputApplicationCommandOptions[];
  globalCommands: CreateChatInputApplicationCommandOptions[];
  guildOnlyNames: string[];
}> {
  const guildCommands: CreateChatInputApplicationCommandOptions[] = [];
  const globalCommands: CreateChatInputApplicationCommandOptions[] = [];
  const guildOnlyNames: string[] = [];
  const commandsDir = path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'commands');
  const categories = await readdir(commandsDir, { withFileTypes: true });
  const cacheBustValue = Date.now();

  for (const category of categories) {
    if (!category.isDirectory()) continue;
    const categoryPath = path.join(commandsDir, category.name);
    const files = await readdir(categoryPath);
    for (const file of files) {
      if (!commandExtensions.has(path.extname(file))) continue;
      const filePath = path.join(categoryPath, file);
      const fileUrl = url.pathToFileURL(filePath);
      const freshUrl = new URL(fileUrl.href);
      freshUrl.searchParams.set('update', String(cacheBustValue));

      try {
        const module = (await import(freshUrl.href)) as { default?: CommandModule };
        const command = (module?.default ?? module) as CommandModule | undefined;

        if (!command?.data?.toJSON) {
          console.warn(`Skipping command ${category.name}/${file}: missing data definition.`);
          continue;
        }

        const commandData = command.data.toJSON();
        const { guildOnly, name } = resolveCommandScopes(command, category.name, commandData);

        guildCommands.push(commandData);

        if (guildOnly) {
          guildOnlyNames.push(name);
        } else {
          globalCommands.push(commandData);
        }
      } catch (error) {
        console.error(`Failed to load command ${category.name}/${file} for deployment.`, error);
      }
    }
  }

  return { guildCommands, globalCommands, guildOnlyNames };
}

async function deploy(): Promise<void> {
  const { guildCommands, globalCommands, guildOnlyNames } = await collectCommands();
  await restClient.restMode(false);
  const maxAttempts = 3;
  const retryDelayMs = 5_000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `Deploying ${guildCommands.length} guild commands and ${globalCommands.length} global commands... `
          + `(attempt ${attempt}/${maxAttempts})`
      );

      if (guildId) {
        await restClient.rest.applications.bulkEditGuildCommands(clientId, guildId, guildCommands);
        console.log('Successfully registered guild commands.');
      } else if (guildOnlyNames.length > 0) {
        console.warn(
          'Skipping guild-only commands because DISCORD_GUILD_ID is not set: '
            + guildOnlyNames.join(', ')
        );
      }

      await restClient.rest.applications.bulkEditGlobalCommands(clientId, globalCommands);
      if (globalCommands.length > 0) {
        console.log('Successfully registered global commands.');
        if (guildId) {
          console.log('Global deployment ensures commands are available in DMs and other guilds.');
        }
      } else {
        console.log('No commands eligible for global registration. Cleared existing global commands.');
      }
      return;
    } catch (error) {
      const err = error as Error & { code?: string };
      const isTimeout = err?.code === 'UND_ERR_CONNECT_TIMEOUT';
      console.error('Failed to register commands:', err);

      if (!isTimeout || attempt === maxAttempts) {
        if (isTimeout) {
          console.error('Discord did not respond in time. Please verify your network connectivity and try again.');
        }
        process.exitCode = 1;
        return;
      }

      console.log(`Connection timed out. Retrying in ${retryDelayMs / 1000} seconds...`);
      await wait(retryDelayMs);
    }
  }
}

deploy().catch((error) => {
  console.error('Unexpected error while deploying commands:', error);
  process.exit(1);
});
