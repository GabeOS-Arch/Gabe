import type {
  CommandInteraction,
  InteractionContent,
  EditInteractionContent,
  InteractionOptionsWrapper,
  Message,
  Member,
  User,
  ImageFormat,
  File,
  RawEmbedOptions
} from 'oceanic.js';
import type { AttachmentBuilder } from '../compat/attachment-builder.js';
import type { EmbedBuilder } from '../compat/embed-builder.js';

type EmbedLike = RawEmbedOptions | EmbedBuilder;
type FileLike = File | AttachmentBuilder;

type DiscordishResponsePayload = Omit<InteractionContent, 'files' | 'embeds'> & {
  ephemeral?: boolean;
  fetchReply?: boolean;
  embeds?: EmbedLike[];
  files?: FileLike[];
};

type DiscordishEditPayload = Omit<EditInteractionContent, 'files' | 'embeds'> & {
  embeds?: EmbedLike[];
  files?: FileLike[];
};

type DiscordishResponse = string | DiscordishResponsePayload;
type DiscordishEdit = string | DiscordishEditPayload;

declare module 'oceanic.js' {
  interface CommandInteraction<T = unknown, C = unknown> {
    readonly options: InteractionOptionsWrapper;
    readonly guildId?: string;
    readonly commandName: string;
    deferred: boolean;
    replied: boolean;
    inGuild(): boolean;
    reply(options?: DiscordishResponse): Promise<unknown>;
    deferReply(options?: DiscordishResponse): Promise<void>;
    editReply(options?: DiscordishEdit): Promise<unknown>;
    followUp(options?: DiscordishResponse): Promise<Message>;
    fetchReply(): Promise<Message>;
    deleteReply(): Promise<void>;
  }

  interface Message<T = unknown> {
    react(emoji: string): Promise<void>;
  }

  interface User {
    displayAvatarURL(options?: { size?: number; extension?: ImageFormat; dynamic?: boolean }): string;
    readonly createdTimestamp: number;
  }

  interface Member {
    readonly joinedTimestamp: number;
  }
}
