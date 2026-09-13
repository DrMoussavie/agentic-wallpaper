import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {configureHooks} from '../scripts/install-hooks.mjs';
test('Installation réversible et idempotente sans écraser les paramètres ni les autres hooks',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'transit-fixture-'));const opts={codexHome:path.join(root,'codex'),claudeHome:path.join(root,'claude'),backupRoot:path.join(root,'backups')};await mkdir(opts.claudeHome);await writeFile(path.join(opts.claudeHome,'settings.json'),JSON.stringify({theme:'unchanged',hooks:{Stop:[{hooks:[{type:'command',command:'fixture-only-command'}]}]}}));
  const plan=await configureHooks('plan',opts);assert.equal(plan.length,2);
  await configureHooks('install',opts);const once=await readFile(path.join(opts.claudeHome,'settings.json'),'utf8');await configureHooks('install',opts);const twice=await readFile(path.join(opts.claudeHome,'settings.json'),'utf8');assert.equal(once,twice);assert.equal(JSON.parse(twice).theme,'unchanged');assert.ok(twice.includes('fixture-only-command'));
  await configureHooks('remove',opts);const restored=JSON.parse(await readFile(path.join(opts.claudeHome,'settings.json'),'utf8'));assert.equal(restored.theme,'unchanged');assert.equal(restored.hooks.Stop.length,1);assert.equal(restored.hooks.Stop[0].hooks[0].command,'fixture-only-command');
});
