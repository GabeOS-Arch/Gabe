import { CommandInteraction, Message, MessageFlags, User, Member } from 'oceanic.js';
import { AttachmentBuilder } from './attachment-builder.js';
const repliedSymbol = Symbol('discordCompatReplied');
const deferredSymbol = Symbol('discordCompatDeferred');
const appliedSymbol = Symbol('discordCompatApplied');
function isEmbedBuilder(value) {
    return typeof value === 'object' && value !== null && 'toJSON' in value;
}
function normalizeEmbeds(embeds) {
    if (!embeds)
        return undefined;
    return embeds.map((embed) => (isEmbedBuilder(embed) ? embed.toJSON() : embed));
}
function normalizeFiles(files) {
    if (!files)
        return undefined;
    return files.map((file, index) => (file instanceof AttachmentBuilder ? file.toFile(index) : file));
}
function normalizeReplyOptions(options) {
    if (typeof options === 'string') {
        return { payload: { content: options }, fetchReply: false };
    }
    const payload = options ? { ...options } : {};
    const fetchReply = Boolean(payload.fetchReply);
    const ephemeral = Boolean(payload.ephemeral);
    delete payload.fetchReply;
    delete payload.ephemeral;
    if (ephemeral) {
        payload.flags = (payload.flags ?? 0) | MessageFlags.EPHEMERAL;
    }
    payload.embeds = normalizeEmbeds(payload.embeds);
    payload.files = normalizeFiles(payload.files);
    return { payload, fetchReply };
}
function normalizeEditOptions(options) {
    if (typeof options === 'string') {
        return { content: options };
    }
    const payload = options ? { ...options } : {};
    payload.embeds = normalizeEmbeds(payload.embeds);
    payload.files = normalizeFiles(payload.files);
    delete payload.flags;
    return payload;
}
function patchCommandInteraction() {
    const proto = CommandInteraction.prototype;
    if (proto[appliedSymbol]) {
        return;
    }
    proto[appliedSymbol] = true;
    const originalReply = proto.reply;
    proto.reply = (async function reply(options) {
        const { payload, fetchReply } = normalizeReplyOptions(options);
        const response = (await originalReply.call(this, payload));
        this[repliedSymbol] = true;
        if (fetchReply) {
            return response.getMessage();
        }
        return response;
    });
    proto.deferReply = async function deferReply(options) {
        const { payload } = normalizeReplyOptions(options);
        await this.defer(payload.flags);
        this[deferredSymbol] = true;
    };
    const originalEdit = proto.editOriginal;
    proto.editReply = function editReply(options) {
        this[repliedSymbol] = true;
        return originalEdit.call(this, normalizeEditOptions(options));
    };
    proto.followUp = async function followUp(options) {
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
        set(value) {
            this[deferredSymbol] = value;
        }
    });
    Object.defineProperty(proto, 'replied', {
        get() {
            return this[repliedSymbol] ?? false;
        },
        set(value) {
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
    const proto = Message.prototype;
    if (typeof proto.react !== 'function') {
        proto.react = function react(emoji) {
            return this.createReaction(emoji);
        };
    }
}
function patchUser() {
    const proto = User.prototype;
    if (!proto.displayAvatarURL) {
        proto.displayAvatarURL = function displayAvatarURL(options) {
            const size = options?.size ?? 1024;
            const extension = options?.extension ?? 'png';
            const dynamic = options?.dynamic ?? true;
            const isGif = dynamic && typeof this.avatar === 'string' && this.avatar.startsWith('a_');
            const format = (isGif ? 'gif' : extension);
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
    const proto = Member.prototype;
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
