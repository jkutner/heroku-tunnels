'use strict';

var child = require('child_process');
let cli = require('heroku-cli-util');
let co = require('co');
let helpers = require('../lib/run/helpers')
let Dyno = require('../lib/run/dyno')

module.exports = {
  topic: 'tunnels',
  command: 'run',
  description: 'Run a one-off dyno with a Tunnels connection',
  help: `
Examples:
  $ heroku tunnels:run bash
  [tunnels] Tunnel is ready!
  ~ $
`,
  variableArgs: true,
  needsAuth: true,
  needsApp: true,
  flags: [
    {name: 'size', char: 's', description: 'dyno size', hasValue: true},
    {name: 'exit-code', char: 'x', description: 'passthrough the exit code of the remote command'},
    {name: 'env', char: 'e', description: "environment variables to set (use ';' to split multiple vars)", hasValue: true},
    {name: 'no-tty', description: 'force the command to not run in a tty', hasValue: false}
  ],
  run: cli.command(co.wrap(run))
}

function * run(context, heroku) {
  let opts = {
    heroku: heroku,
    app: context.app,
    command: "echo $PORT && curl -sSL $TUNNELS_URL | bash -s $DYNO && " + helpers.buildCommand(context.args),
    size: context.flags.size,
    'exit-code': context.flags['exit-code'],
    env: context.flags.env,
    'no-tty': context.flags['no-tty'],
    attach: true
  }
  if (context.args.length === 0) throw new Error('Usage: heroku tunnels:run COMMAND\n\nExample: heroku tunnels:run bash')

  let dyno = new Dyno(opts)
  try {
    yield dyno.start()
  } catch (err) {
    if (err.exitCode) {
      cli.error(err)
      process.exit(err.exitCode)
    } else throw err
  }
}
