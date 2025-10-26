import { ApplicationIntegrationTypes, InteractionContextTypes } from 'oceanic.js';
import type { CreateChatInputApplicationCommandOptions } from 'oceanic.js';
import type { CommandModule } from '../types/command.js';

export const guildOnlyCategories = new Set(['moderation']);

export function resolveCommandScopes(
  commandModule: CommandModule | undefined,
  categoryName: string,
  commandData: CreateChatInputApplicationCommandOptions
): { guildOnly: boolean; name: string } {
  const guildOnlyExport = commandModule?.guildOnly === true;
  const globalOptOut = commandModule?.globalDeploy === false;
  const categoryGuildOnly = guildOnlyCategories.has(categoryName);

  const guildOnly = guildOnlyExport || globalOptOut || categoryGuildOnly;
  const name = commandData?.name ?? 'unknown';

  if (commandData) {
    commandData.integrationTypes = guildOnly
      ? [ApplicationIntegrationTypes.GUILD_INSTALL]
      : [ApplicationIntegrationTypes.GUILD_INSTALL, ApplicationIntegrationTypes.USER_INSTALL];

    commandData.contexts = guildOnly
      ? [InteractionContextTypes.GUILD]
      : [
          InteractionContextTypes.GUILD,
          InteractionContextTypes.BOT_DM,
          InteractionContextTypes.PRIVATE_CHANNEL
        ];

    commandData.dmPermission = !guildOnly;
  }

  return { guildOnly, name };
}
