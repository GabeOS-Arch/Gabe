import {
  CommandInteraction,
  Message,
  MessageFlags,
  type InteractionContent,
  type EditInteractionContent,
  type InteractionOptionsWrapper,
  type File,
  type RawEmbedOptions,
  User,
  Member,
  type ImageFormat,
  type MessageInteractionResponse
} from 'oceanic.js';
import { AttachmentBuilder } from './attachment-builder.js';
import type { EmbedBuilder } from './embed-builder.js';

type EmbedLike = EmbedBuilder | RawEmbedOptions;
type FileLike = AttachmentBuilder | File;

type DiscordStyleReply =
  | string
  | (InteractionContent & {
      ephemeral?: boolean;
      fetchReply?: boolean;
      embeds?: EmbedLike[];
      files?: FileLike[];
    });

type DiscordStyleEdit =
  | string
  | (EditInteractionContent & {
      embeds?: EmbedLike[];
      files?: FileLike[];
    });

const repliedSymbol = Symbol('discordCompatReplied');
const deferredSymbol = Symbol('discordCompatDeferred');
const appliedSymbol = Symbol('discordCompatApplied');

type InstrumentedInteraction = CommandInteraction & {
  [appliedSymbol]?: boolean;
  [repliedSymbol]?: boolean;
  [deferredSymbol]?: boolean;
};

function isEmbedBuilder(value: EmbedLike): value is EmbedBuilder {
  return typeof value === 'object' && value !== null && 'toJSON' in value;
}

function normalizeEmbeds(embeds?: EmbedLike[]) {
  if (!embeds) return undefined;
  return embeds.map((embed) => (isEmbedBuilder(embed) ? embed.toJSON() : embed));
}

function normalizeFiles(files?: FileLike[]) {
  if (!files) return undefined;
  return files.map((file, index) => (file instanceof AttachmentBuilder ? file.toFile(index) : file));
}

function normalizeReplyOptions(options?: DiscordStyleReply) {
  if (typeof options === 'string') {
    return { payload: { content: options } as InteractionContent, fetchReply: false };
  }

  const payload: InteractionContent = options ? { ...options } : {};
  const fetchReply = Boolean((payload as Record<string, unknown>).fetchReply);
  const ephemeral = Boolean((payload as Record<string, unknown>).ephemeral);
  delete (payload as Record<string, unknown>).fetchReply;
  delete (payload as Record<string, unknown>).ephemeral;

  if (ephemeral) {
    payload.flags = (payload.flags ?? 0) | MessageFlags.EPHEMERAL;
  }

  payload.embeds = normalizeEmbeds(payload.embeds as EmbedLike[] | undefined);
  payload.files = normalizeFiles(payload.files as FileLike[] | undefined);

  return { payload, fetchReply };
}

function normalizeEditOptions(options?: DiscordStyleEdit) {
  if (typeof options === 'string') {
    return { content: options } as EditInteractionContent;
  }

  const payload: EditInteractionContent = options ? { ...options } : {};
  payload.embeds = normalizeEmbeds(payload.embeds as EmbedLike[] | undefined);
  payload.files = normalizeFiles(payload.files as FileLike[] | undefined);
  delete (payload as Record<string, unknown>).flags;
  return payload;
}

function patchCommandInteraction() {
  const proto = CommandInteraction.prototype as CommandInteraction & {
    [appliedSymbol]?: boolean;
    [repliedSymbol]?: boolean;
    [deferredSymbol]?: boolean;
    options?: InteractionOptionsWrapper;
    deferred?: boolean;
    replied?: boolean;
    guildId?: string;
    inGuild?: () => boolean;
    deferReply?: (options?: DiscordStyleReply) => Promise<void>;
    editReply?: (options?: DiscordStyleEdit) => Promise<unknown>;
    followUp?: (options?: DiscordStyleReply) => Promise<Message>;
    fetchReply?: () => Promise<Message>;
    deleteReply?: () => Promise<void>;
  };

  if (proto[appliedSymbol]) {
    return;
  }

  proto[appliedSymbol] = true;

  const originalReply = proto.reply;
  proto.reply = (async function reply(this: InstrumentedInteraction, options?: DiscordStyleReply) {
    const { payload, fetchReply } = normalizeReplyOptions(options);
    const response = (await originalReply.call(this, payload)) as MessageInteractionResponse<CommandInteraction>;
    this[repliedSymbol] = true;
    if (fetchReply) {
      return response.getMessage();
    }
    return response;
  }) as unknown as CommandInteraction['reply'];

  proto.deferReply = async function deferReply(this: InstrumentedInteraction, options?: DiscordStyleReply) {
    const { payload } = normalizeReplyOptions(options);
    await this.defer(payload.flags);
    this[deferredSymbol] = true;
  };

  const originalEdit = proto.editOriginal;
  proto.editReply = function editReply(this: InstrumentedInteraction, options?: DiscordStyleEdit) {
    this[repliedSymbol] = true;
    return originalEdit.call(this, normalizeEditOptions(options));
  };

  proto.followUp = async function followUp(options?: DiscordStyleReply) {
    const { payload } = normalizeReplyOptions(options);
    const response = await this.createFollowup(payload);
    return response.message ?? response.getMessage();
  };

  proto.fetchReply = function fetchReply() {
    return this.getOriginal();
  };

  proto.deleteReply = function deleteReply() {
    return this.deleteOriginal();
  };

  Object.defineProperty(proto, 'options', {
    get() {
      return this.data.options;
    }
  });

  Object.defineProperty(proto, 'guildId', {
    get() {
      return this.guildID ?? undefined;
    }
  });

  Object.defineProperty(proto, 'commandName', {
    get() {
      return this.data.name;
    }
  });

  Object.defineProperty(proto, 'deferred', {
    get() {
      return this[deferredSymbol] ?? false;
    },
    set(value: boolean) {
      this[deferredSymbol] = value;
    }
  });

  Object.defineProperty(proto, 'replied', {
    get() {
      return this[repliedSymbol] ?? false;
    },
    set(value: boolean) {
      this[repliedSymbol] = value;
    }
  });

  if (!proto.inGuild) {
    proto.inGuild = function inGuild() {
      return Boolean(this.guildID);
    };
  }
}

function patchMessage() {
  const proto = Message.prototype as Message & { react?: (emoji: string) => Promise<void> };
  if (typeof proto.react !== 'function') {
    proto.react = function react(emoji: string) {
      return this.createReaction(emoji);
    };
  }
}

type DisplayAvatarOptions = {
  extension?: ImageFormat;
  size?: number;
  dynamic?: boolean;
};

function patchUser() {
  const proto = User.prototype as User & {
    displayAvatarURL?: (options?: DisplayAvatarOptions) => string;
    createdTimestamp?: number;
  };

  if (!proto.displayAvatarURL) {
    proto.displayAvatarURL = function displayAvatarURL(options?: DisplayAvatarOptions) {
      const size = options?.size ?? 1024;
      const extension = options?.extension ?? 'png';
      const dynamic = options?.dynamic ?? true;
      const isGif = dynamic && typeof this.avatar === 'string' && this.avatar.startsWith('a_');
      const format = (isGif ? 'gif' : extension) as ImageFormat;
      return this.avatarURL(format, size);
    };
  }

  if (!Object.getOwnPropertyDescriptor(proto, 'createdTimestamp')) {
    Object.defineProperty(proto, 'createdTimestamp', {
      get() {
        return this.createdAt?.getTime() ?? Number.NaN;
      }
    });
  }
}

function patchMember() {
  const proto = Member.prototype as Member & { joinedTimestamp?: number };
  if (!Object.getOwnPropertyDescriptor(proto, 'joinedTimestamp')) {
    Object.defineProperty(proto, 'joinedTimestamp', {
      get() {
        return this.joinedAt?.getTime() ?? Number.NaN;
      }
    });
  }
}

export function applyDiscordCompatShims() {
  patchCommandInteraction();
  patchMessage();
  patchUser();
  patchMember();
}
