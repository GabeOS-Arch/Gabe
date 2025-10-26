const NAMED_COLORS = {
    DEFAULT: 0x2f3136,
    BLURPLE: 0x5865f2,
    GREEN: 0x57f287,
    YELLOW: 0xfee75c,
    RED: 0xed4245
};
function resolveColor(input) {
    if (typeof input === 'number') {
        return input;
    }
    if (typeof input !== 'string') {
        return undefined;
    }
    const normalized = input.trim();
    if (!normalized) {
        return undefined;
    }
    if (normalized.startsWith('#')) {
        return Number.parseInt(normalized.slice(1), 16);
    }
    if (/^0x[0-9a-fA-F]+$/.test(normalized)) {
        return Number.parseInt(normalized, 16);
    }
    const named = NAMED_COLORS[normalized.toUpperCase()];
    if (named !== undefined) {
        return named;
    }
    if (/^[0-9a-fA-F]{6}$/i.test(normalized)) {
        return Number.parseInt(normalized, 16);
    }
    return undefined;
}
export class EmbedBuilder {
    data;
    constructor() {
        this.data = {};
    }
    setTitle(title) {
        this.data.title = title;
        return this;
    }
    setDescription(description) {
        this.data.description = description;
        return this;
    }
    setURL(url) {
        this.data.url = url;
        return this;
    }
    setColor(color) {
        this.data.color = resolveColor(color);
        return this;
    }
    setImage(url) {
        this.data.image = { url };
        return this;
    }
    setThumbnail(url) {
        this.data.thumbnail = { url };
        return this;
    }
    setFooter(footer) {
        this.data.footer = { ...footer };
        return this;
    }
    addFields(...fields) {
        this.data.fields = [...(this.data.fields ?? []), ...fields.map((field) => ({ ...field }))];
        return this;
    }
    setFields(fields) {
        this.data.fields = fields.map((field) => ({ ...field }));
        return this;
    }
    toJSON() {
        return structuredClone(this.data);
    }
}
