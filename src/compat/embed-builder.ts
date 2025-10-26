import type { EmbedField, EmbedOptions, RawEmbedFooterOptions, RawEmbedOptions } from 'oceanic.js';

const NAMED_COLORS: Record<string, number> = {
  DEFAULT: 0x2f3136,
  BLURPLE: 0x5865f2,
  GREEN: 0x57f287,
  YELLOW: 0xfee75c,
  RED: 0xed4245
};

function resolveColor(input: number | string | null | undefined) {
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
  private data: RawEmbedOptions;

  constructor() {
    this.data = {};
  }

  setTitle(title: string) {
    this.data.title = title;
    return this;
  }

  setDescription(description: string) {
    this.data.description = description;
    return this;
  }

  setURL(url: string) {
    this.data.url = url;
    return this;
  }

  setColor(color: number | string) {
    this.data.color = resolveColor(color);
    return this;
  }

  setImage(url: string) {
    this.data.image = { url };
    return this;
  }

  setThumbnail(url: string) {
    this.data.thumbnail = { url };
    return this;
  }

  setFooter(footer: RawEmbedFooterOptions) {
    this.data.footer = { ...footer };
    return this;
  }

  addFields(...fields: EmbedField[]) {
    this.data.fields = [...(this.data.fields ?? []), ...fields.map((field) => ({ ...field }))];
    return this;
  }

  setFields(fields: EmbedField[]) {
    this.data.fields = fields.map((field) => ({ ...field }));
    return this;
  }

  toJSON(): EmbedOptions {
    return structuredClone(this.data);
  }
}
