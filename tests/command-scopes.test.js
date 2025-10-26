import test from 'node:test';
import assert from 'node:assert/strict';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'oceanic.js';

import { guildOnlyCategories, resolveCommandScopes } from '../dist/utils/command-scopes.js';

test('guildOnlyCategories keeps moderation commands guild-only', () => {
  assert.ok(guildOnlyCategories.has('moderation'));
});

test('commands without flags remain global when not in a guild-only category', () => {
  const result = resolveCommandScopes({}, 'fun', { name: 'joke' });
  assert.deepEqual(result, { guildOnly: false, name: 'joke' });
});

test('commands opt into guild-only scope via module flag', () => {
  const result = resolveCommandScopes({ guildOnly: true }, 'misc', { name: 'secret' });
  assert.deepEqual(result, { guildOnly: true, name: 'secret' });
});

test('commands opt out of global deployment via module flag', () => {
  const result = resolveCommandScopes({ globalDeploy: false }, 'misc', { name: 'noglobal' });
  assert.deepEqual(result, { guildOnly: true, name: 'noglobal' });
});

test('category-level guild-only restriction applies even without module flags', () => {
  const result = resolveCommandScopes({}, 'moderation', { name: 'ban' });
  assert.deepEqual(result, { guildOnly: true, name: 'ban' });
});

test('falls back to unknown when command data is missing', () => {
  const result = resolveCommandScopes({}, 'misc');
  assert.deepEqual(result, { guildOnly: false, name: 'unknown' });
});

test('non guild-only commands default to DM contexts and user installs', () => {
  const commandData = {};
  resolveCommandScopes({}, 'misc', commandData);

  assert.deepEqual(commandData.integrationTypes, [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL
  ]);
  assert.deepEqual(commandData.contexts, [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL
  ]);
  assert.strictEqual(commandData.dmPermission, true);
});

test('guild-only commands restrict contexts and disable DMs', () => {
  const commandData = {};
  resolveCommandScopes({}, 'moderation', commandData);

  assert.deepEqual(commandData.integrationTypes, [ApplicationIntegrationTypes.GUILD_INSTALL]);
  assert.deepEqual(commandData.contexts, [InteractionContextTypes.GUILD]);
  assert.strictEqual(commandData.dmPermission, false);
});

test('dm_permission is enforced true for non guild-only commands', () => {
  const commandData = { dmPermission: false };
  resolveCommandScopes({}, 'misc', commandData);
  assert.strictEqual(commandData.dmPermission, true);
});
