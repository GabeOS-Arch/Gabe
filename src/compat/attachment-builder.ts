import type { File } from 'oceanic.js';

export class AttachmentBuilder {
  private name: string;
  private contents: Buffer;

  constructor(data: Buffer | Uint8Array | string, options: { name: string }) {
    this.name = options.name;
    if (typeof data === 'string') {
      this.contents = Buffer.from(data);
    } else if (Buffer.isBuffer(data)) {
      this.contents = data;
    } else {
      this.contents = Buffer.from(data);
    }
  }

  toFile(index?: number): File {
    const file: File = {
      name: this.name,
      contents: this.contents
    };

    if (typeof index === 'number') {
      file.index = index;
    }

    return file;
  }
}
