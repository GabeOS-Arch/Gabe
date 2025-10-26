import type { CommandInteraction } from 'oceanic.js';
import type { SlashCommandBuilder } from '#discord-compat';

export type SlashCommandData = SlashCommandBuilder;

export interface CommandModule {
  data: SlashCommandData;
  execute: (interaction: CommandInteraction) => Promise<unknown>;
  guildOnly?: boolean;
  globalDeploy?: boolean;
}
