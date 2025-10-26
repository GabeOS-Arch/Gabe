import test from 'node:test';
import assert from 'node:assert/strict';

import pollCommand from '../dist/commands/misc/poll.js';

test('poll refuses to run without reaction permissions', async () => {
  const replyCalls = [];
  const interaction = {
    appPermissions: undefined,
    options: {
      getString() {
        throw new Error('options should not be read when permissions are missing');
      }
    },
    async reply(payload) {
      replyCalls.push(payload);
      return payload;
    }
  };

  await pollCommand.execute(interaction);

  assert.deepEqual(replyCalls, [
    {
      content:
        'I need the Add Reactions and Read Message History permissions in this channel before I can create a poll. Ask a server admin to adjust the app permissions and try again.',
      ephemeral: true
    }
  ]);
});
