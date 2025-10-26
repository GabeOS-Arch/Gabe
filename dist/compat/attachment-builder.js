export class AttachmentBuilder {
    name;
    contents;
    constructor(data, options) {
        this.name = options.name;
        if (typeof data === 'string') {
            this.contents = Buffer.from(data);
        }
        else if (Buffer.isBuffer(data)) {
            this.contents = data;
        }
        else {
            this.contents = Buffer.from(data);
        }
    }
    toFile(index) {
        const file = {
            name: this.name,
            contents: this.contents
        };
        if (typeof index === 'number') {
            file.index = index;
        }
        return file;
    }
}
