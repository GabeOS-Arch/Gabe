import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  type ApplicationCommandOptions,
  type ApplicationCommandOptionsSubCommand,
  type ApplicationCommandOptionsWithValue,
  type CreateChatInputApplicationCommandOptions
} from 'oceanic.js';

type OptionTransformer<T extends SlashCommandOptionBase<ApplicationCommandOptionTypes>> = (
  option: T
) => T;

function cloneOptions<T>(options: T | undefined): T | undefined {
  return options ? structuredClone(options) : undefined;
}

abstract class SlashCommandOptionBase<T extends ApplicationCommandOptionTypes> {
  protected data: Extract<ApplicationCommandOptions, { type: T }>;

  constructor(type: T) {
    this.data = {
      type,
      name: '',
      description: ''
    } as Extract<ApplicationCommandOptions, { type: T }>;
  }

  setName(name: string) {
    this.data.name = name;
    return this;
  }

  setDescription(description: string) {
    this.data.description = description;
    return this;
  }

  setRequired(required: boolean) {
    (this.data as ApplicationCommandOptions & { required?: boolean }).required = required;
    return this;
  }

  toJSON() {
    return structuredClone(this.data);
  }
}

class SlashCommandStringOption extends SlashCommandOptionBase<ApplicationCommandOptionTypes.STRING> {
  constructor() {
    super(ApplicationCommandOptionTypes.STRING);
  }

  addChoices(...choices: { name: string; value: string }[]) {
    this.data.choices = [...(this.data.choices ?? []), ...choices];
    return this;
  }

  setMinLength(value: number) {
    this.data.minLength = value;
    return this;
  }

  setMaxLength(value: number) {
    this.data.maxLength = value;
    return this;
  }
}

class SlashCommandIntegerOption extends SlashCommandOptionBase<ApplicationCommandOptionTypes.INTEGER> {
  constructor() {
    super(ApplicationCommandOptionTypes.INTEGER);
  }

  addChoices(...choices: { name: string; value: number }[]) {
    this.data.choices = [...(this.data.choices ?? []), ...choices];
    return this;
  }

  setMinValue(value: number) {
    this.data.minValue = value;
    return this;
  }

  setMaxValue(value: number) {
    this.data.maxValue = value;
    return this;
  }
}

class SlashCommandNumberOption extends SlashCommandOptionBase<ApplicationCommandOptionTypes.NUMBER> {
  constructor() {
    super(ApplicationCommandOptionTypes.NUMBER);
  }

  addChoices(...choices: { name: string; value: number }[]) {
    this.data.choices = [...(this.data.choices ?? []), ...choices];
    return this;
  }

  setMinValue(value: number) {
    this.data.minValue = value;
    return this;
  }

  setMaxValue(value: number) {
    this.data.maxValue = value;
    return this;
  }
}

class SlashCommandBooleanOption extends SlashCommandOptionBase<ApplicationCommandOptionTypes.BOOLEAN> {
  constructor() {
    super(ApplicationCommandOptionTypes.BOOLEAN);
  }
}
class SlashCommandUserOption extends SlashCommandOptionBase<ApplicationCommandOptionTypes.USER> {
  constructor() {
    super(ApplicationCommandOptionTypes.USER);
  }
}
class SlashCommandAttachmentOption extends SlashCommandOptionBase<ApplicationCommandOptionTypes.ATTACHMENT> {
  constructor() {
    super(ApplicationCommandOptionTypes.ATTACHMENT);
  }
}

type BuiltCommandOption =
  | SlashCommandStringOption
  | SlashCommandIntegerOption
  | SlashCommandNumberOption
  | SlashCommandBooleanOption
  | SlashCommandUserOption
  | SlashCommandAttachmentOption;

class SlashCommandSubcommandBuilder {
  private data: ApplicationCommandOptionsSubCommand;

  constructor() {
    this.data = {
      type: ApplicationCommandOptionTypes.SUB_COMMAND,
      name: '',
      description: ''
    };
  }

  setName(name: string) {
    this.data.name = name;
    return this;
  }

  setDescription(description: string) {
    this.data.description = description;
    return this;
  }

  private addOption<T extends BuiltCommandOption>(
    option: T,
    transformer: OptionTransformer<T>
  ) {
    const built = transformer(option);
    this.data.options = [
      ...(this.data.options ?? []),
      built.toJSON() as ApplicationCommandOptionsWithValue
    ];
    return this;
  }

  addStringOption(transformer: OptionTransformer<SlashCommandStringOption>) {
    return this.addOption(new SlashCommandStringOption(), transformer);
  }

  addIntegerOption(transformer: OptionTransformer<SlashCommandIntegerOption>) {
    return this.addOption(new SlashCommandIntegerOption(), transformer);
  }

  addNumberOption(transformer: OptionTransformer<SlashCommandNumberOption>) {
    return this.addOption(new SlashCommandNumberOption(), transformer);
  }

  addBooleanOption(transformer: OptionTransformer<SlashCommandBooleanOption>) {
    return this.addOption(new SlashCommandBooleanOption(), transformer);
  }

  addUserOption(transformer: OptionTransformer<SlashCommandUserOption>) {
    return this.addOption(new SlashCommandUserOption(), transformer);
  }

  addAttachmentOption(transformer: OptionTransformer<SlashCommandAttachmentOption>) {
    return this.addOption(new SlashCommandAttachmentOption(), transformer);
  }

  toJSON() {
    return {
      ...this.data,
      options: cloneOptions(this.data.options)
    };
  }
}

export class SlashCommandBuilder {
  private data: CreateChatInputApplicationCommandOptions;

  constructor() {
    this.data = {
      name: '',
      description: '',
      type: ApplicationCommandTypes.CHAT_INPUT
    };
  }

  setName(name: string) {
    this.data.name = name;
    return this;
  }

  setDescription(description: string) {
    this.data.description = description;
    return this;
  }

  get name() {
    return this.data.name;
  }

  setDMPermission(value: boolean) {
    this.data.dmPermission = value;
    return this;
  }

  setDefaultMemberPermissions(value: bigint | number | string | null) {
    if (value === null) {
      this.data.defaultMemberPermissions = null;
    } else if (typeof value === 'bigint' || typeof value === 'number') {
      this.data.defaultMemberPermissions = value.toString();
    } else {
      this.data.defaultMemberPermissions = value;
    }
    return this;
  }

  private ensureOptions() {
    if (!this.data.options) {
      this.data.options = [];
    }
  }

  private pushOption<T extends BuiltCommandOption>(
    option: T,
    transformer: OptionTransformer<T>
  ) {
    this.ensureOptions();
    const built = transformer(option);
    this.data.options!.push(built.toJSON());
    return this;
  }

  addStringOption(transformer: OptionTransformer<SlashCommandStringOption>) {
    return this.pushOption(new SlashCommandStringOption(), transformer);
  }

  addIntegerOption(transformer: OptionTransformer<SlashCommandIntegerOption>) {
    return this.pushOption(new SlashCommandIntegerOption(), transformer);
  }

  addNumberOption(transformer: OptionTransformer<SlashCommandNumberOption>) {
    return this.pushOption(new SlashCommandNumberOption(), transformer);
  }

  addBooleanOption(transformer: OptionTransformer<SlashCommandBooleanOption>) {
    return this.pushOption(new SlashCommandBooleanOption(), transformer);
  }

  addUserOption(transformer: OptionTransformer<SlashCommandUserOption>) {
    return this.pushOption(new SlashCommandUserOption(), transformer);
  }

  addAttachmentOption(transformer: OptionTransformer<SlashCommandAttachmentOption>) {
    return this.pushOption(new SlashCommandAttachmentOption(), transformer);
  }

  addSubcommand(transformer: (sub: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder) {
    this.ensureOptions();
    const built = transformer(new SlashCommandSubcommandBuilder());
    this.data.options!.push(built.toJSON() as ApplicationCommandOptions);
    return this;
  }

  toJSON(): CreateChatInputApplicationCommandOptions {
    return {
      ...this.data,
      options: cloneOptions(this.data.options)
    };
  }
}

export type SlashCommandData = SlashCommandBuilder;
