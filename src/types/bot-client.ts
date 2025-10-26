import type { Client } from 'oceanic.js';
import type { CommandModule } from './command.js';

export type CommandCollection = Map<string, CommandModule>;

export type BotClient = Client & { commands: CommandCollection };
