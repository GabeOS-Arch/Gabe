import { ApplicationCommandOptionTypes, ApplicationCommandTypes } from 'oceanic.js';
function cloneOptions(options) {
    return options ? structuredClone(options) : undefined;
}
class SlashCommandOptionBase {
    data;
    constructor(type) {
        this.data = {
            type,
            name: '',
            description: ''
        };
    }
    setName(name) {
        this.data.name = name;
        return this;
    }
    setDescription(description) {
        this.data.description = description;
        return this;
    }
    setRequired(required) {
        this.data.required = required;
        return this;
    }
    toJSON() {
        return structuredClone(this.data);
    }
}
class SlashCommandStringOption extends SlashCommandOptionBase {
    constructor() {
        super(ApplicationCommandOptionTypes.STRING);
    }
    addChoices(...choices) {
        this.data.choices = [...(this.data.choices ?? []), ...choices];
        return this;
    }
    setMinLength(value) {
        this.data.minLength = value;
        return this;
    }
    setMaxLength(value) {
        this.data.maxLength = value;
        return this;
    }
}
class SlashCommandIntegerOption extends SlashCommandOptionBase {
    constructor() {
        super(ApplicationCommandOptionTypes.INTEGER);
    }
    addChoices(...choices) {
        this.data.choices = [...(this.data.choices ?? []), ...choices];
        return this;
    }
    setMinValue(value) {
        this.data.minValue = value;
        return this;
    }
    setMaxValue(value) {
        this.data.maxValue = value;
        return this;
    }
}
class SlashCommandNumberOption extends SlashCommandOptionBase {
    constructor() {
        super(ApplicationCommandOptionTypes.NUMBER);
    }
    addChoices(...choices) {
        this.data.choices = [...(this.data.choices ?? []), ...choices];
        return this;
    }
    setMinValue(value) {
        this.data.minValue = value;
        return this;
    }
    setMaxValue(value) {
        this.data.maxValue = value;
        return this;
    }
}
class SlashCommandBooleanOption extends SlashCommandOptionBase {
    constructor() {
        super(ApplicationCommandOptionTypes.BOOLEAN);
    }
}
class SlashCommandUserOption extends SlashCommandOptionBase {
    constructor() {
        super(ApplicationCommandOptionTypes.USER);
    }
}
class SlashCommandAttachmentOption extends SlashCommandOptionBase {
    constructor() {
        super(ApplicationCommandOptionTypes.ATTACHMENT);
    }
}
class SlashCommandSubcommandBuilder {
    data;
    constructor() {
        this.data = {
            type: ApplicationCommandOptionTypes.SUB_COMMAND,
            name: '',
            description: ''
        };
    }
    setName(name) {
        this.data.name = name;
        return this;
    }
    setDescription(description) {
        this.data.description = description;
        return this;
    }
    addOption(option, transformer) {
        const built = transformer(option);
        this.data.options = [
            ...(this.data.options ?? []),
            built.toJSON()
        ];
        return this;
    }
    addStringOption(transformer) {
        return this.addOption(new SlashCommandStringOption(), transformer);
    }
    addIntegerOption(transformer) {
        return this.addOption(new SlashCommandIntegerOption(), transformer);
    }
    addNumberOption(transformer) {
        return this.addOption(new SlashCommandNumberOption(), transformer);
    }
    addBooleanOption(transformer) {
        return this.addOption(new SlashCommandBooleanOption(), transformer);
    }
    addUserOption(transformer) {
        return this.addOption(new SlashCommandUserOption(), transformer);
    }
    addAttachmentOption(transformer) {
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
    data;
    constructor() {
        this.data = {
            name: '',
            description: '',
            type: ApplicationCommandTypes.CHAT_INPUT
        };
    }
    setName(name) {
        this.data.name = name;
        return this;
    }
    setDescription(description) {
        this.data.description = description;
        return this;
    }
    get name() {
        return this.data.name;
    }
    setDMPermission(value) {
        this.data.dmPermission = value;
        return this;
    }
    setDefaultMemberPermissions(value) {
        if (value === null) {
            this.data.defaultMemberPermissions = null;
        }
        else if (typeof value === 'bigint' || typeof value === 'number') {
            this.data.defaultMemberPermissions = value.toString();
        }
        else {
            this.data.defaultMemberPermissions = value;
        }
        return this;
    }
    ensureOptions() {
        if (!this.data.options) {
            this.data.options = [];
        }
    }
    pushOption(option, transformer) {
        this.ensureOptions();
        const built = transformer(option);
        this.data.options.push(built.toJSON());
        return this;
    }
    addStringOption(transformer) {
        return this.pushOption(new SlashCommandStringOption(), transformer);
    }
    addIntegerOption(transformer) {
        return this.pushOption(new SlashCommandIntegerOption(), transformer);
    }
    addNumberOption(transformer) {
        return this.pushOption(new SlashCommandNumberOption(), transformer);
    }
    addBooleanOption(transformer) {
        return this.pushOption(new SlashCommandBooleanOption(), transformer);
    }
    addUserOption(transformer) {
        return this.pushOption(new SlashCommandUserOption(), transformer);
    }
    addAttachmentOption(transformer) {
        return this.pushOption(new SlashCommandAttachmentOption(), transformer);
    }
    addSubcommand(transformer) {
        this.ensureOptions();
        const built = transformer(new SlashCommandSubcommandBuilder());
        this.data.options.push(built.toJSON());
        return this;
    }
    toJSON() {
        return {
            ...this.data,
            options: cloneOptions(this.data.options)
        };
    }
}
