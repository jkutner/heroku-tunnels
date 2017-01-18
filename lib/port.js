'use strict';

const child = require('child_process');
const path = require('path');
const cli = require('heroku-cli-util');
const https = require('https')
const http = require('http')
const fs = require('fs')
const co = require('co');
const socks = require('socksv5')
const net = require("net");
const helpers = require('../lib/helpers')

function forwardPort(heroku, remotePort, localPort, appName, dyno) {
  let configVars = heroku.get(`/apps/${appName}/config-vars`)
  helpers.createSocksProxy(dyno, configVars, function(dynoIp, dynoName, socksPort) {
    cli.log(`Listening on ${cli.color.white.bold(localPort)} and forwarding to ${cli.color.white.bold(`${dynoName}:${remotePort}`)}`)
    net.createServer(function(connIn) {
      socks.connect({
        host: '0.0.0.0',
        port: remotePort,
        proxyHost: '127.0.0.1',
        proxyPort: socksPort,
        auths: [ socks.auth.None() ]
      }, function(socket) {
        connIn.pipe(socket);
        socket.pipe(connIn);
      });
    }).listen(localPort);
  });
}

module.exports = {
  forwardPort
}
