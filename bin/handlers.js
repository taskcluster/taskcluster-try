#!/usr/bin/env node
var path        = require('path');
var Promise     = require('promise');
var debug       = require('debug')('try:bin:handlers');
var base        = require('taskcluster-base');
var taskcluster = require('taskcluster-client');
var Handlers    = require('../try/handlers');

/** Launch handlers */
var launch = function(profile) {
  // Load configuration
  var cfg = base.config({
    defaults:     require('../config/defaults'),
    profile:      require('../config/' + profile),
    envs: [
      'taskcluster_schedulerBaseUrl',
      'taskcluster_authBaseUrl',
      'taskcluster_credentials_clientId',
      'taskcluster_credentials_accessToken',
      'influx_connectionString'
    ],
    filename:     'taskcluster-try'
  });

  var drain;
  if (cfg.get('influx:connectionString')) {
    // Create InfluxDB connection for submitting statistics
    drain = new base.stats.Influx({
      connectionString:   cfg.get('influx:connectionString'),
      maxDelay:           cfg.get('influx:maxDelay'),
      maxPendingPoints:   cfg.get('influx:maxPendingPoints')
    });
  } else {
    drain = new base.stats.NullDrain();
  }


  // Start monitoring the process
  base.stats.startProcessUsageReporting({
    drain:        drain,
    component:    cfg.get('try:statsComponent'),
    process:      'handlers'
  });

  // Create scheduler client
  var scheduler = new taskcluster.Scheduler({
    credentials:      cfg.get('taskcluster:credentials'),
    baseUrl:          cfg.get('taskcluster:schedulerBaseUrl')
  });

  // Create event handlers
  var handlers = new Handlers({
    exchange:           cfg.get('try:treeherderExchangePrefix') +
                        'new-result-set',
    branches:           cfg.get('try:branches'),
    scheduler:          scheduler,
    drain:              drain,
    component:          cfg.get('try:statsComponent')
  });

  // Create listener
  var listener = new taskcluster.PulseListener({
    credentials:        cfg.get('pulse'),
    queueName:          cfg.get('try:listenerQueueName'),
    prefetch:           cfg.get('try:listenerPrefetch')
  })

  // Start listening for events and handle them
  return handlers.setup(listener).then(function() {
    debug('Handlers are now listening for events');

    // Notify parent process, so that this worker can run using LocalApp
    base.app.notifyLocalAppInParentProcess();
  });
};

// If handlers.js is executed start the handlers
if (!module.parent) {
  // Find configuration profile
  var profile = process.argv[2];
  if (!profile) {
    console.log("Usage: handlers.js [profile]")
    console.error("ERROR: No configuration profile is provided");
  }
  // Launch with given profile
  launch(profile).then(function() {
    debug("Launched handlers successfully");
  }).catch(function(err) {
    debug("Failed to start handlers, err: %s, as JSON: %j", err, err, err.stack);
    // If we didn't launch the handlers we should crash
    process.exit(1);
  });
}

// Export launch in-case anybody cares
module.exports = launch;
