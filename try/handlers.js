var assert      = require('assert');
var taskcluster = require('taskcluster-client');
var Promise     = require('promise');
var debug       = require('debug')('try:handlers');
var _           = require('lodash');
var base        = require('taskcluster-base');
var request     = require('superagent-promise');
var instantiate = require('./instantiate.js');
var slugid      = require('slugid');

/**
 * Create handlers
 *
 * options:
 * {
 *   scheduler:          // taskcluster.Scheduler instance
 *   queueName:          // Queue name (optional)
 *   drain:              // new base.Influx(...)
 *   component:          // Component name in statistics
 * }
 */
var Handlers = function(options) {
  // Validate options
  assert(options.exchange, "Exchange name for treeherder is required");
  assert(options.branches instanceof Object, "branches must be an array");
  assert(options.scheduler instanceof taskcluster.Scheduler,
         "An instance of taskcluster.Scheduler is required");
  assert(options.drain,             "statistics drains is required");
  assert(options.component,         "component name is needed for statistics");
  // Store options on this for use in event handlers
  this.exchange         = options.exchange;
  this.branches         = options.branches;
  this.scheduler        = options.scheduler;
  this.queueName        = options.queueName;  // Optional
  this.drain            = options.drain;
  this.component        = options.component;
  this.listener         = null;
};

/** Setup handlers and start listening */
Handlers.prototype.setup = function() {
  assert(this.listener === null, "Cannot setup twice!");
  var that = this;

  // Create listener
  this.listener = new taskcluster.Listener({
    connectionString:   'amqps://public:public@pulse.mozilla.org?heartbeat=180',
    queueName:          this.queueName
  });

  // Construct list of projects
  var projects = _.keys(this.branches);

  // Listen for messages about branches we want to push for
  projects.forEach(function(project) {
    // Binding for new result sets
    that.listener.bind({
      exchange:           that.exchange,
      routingKeyPattern:  [project, '#'].join('.')
    });
  });

  // Create message handler
  var handler = function(message) {
    if (projects.indexOf(message.payload.project) !== -1) {
      return that.onNewResultSet(message);
    }
    debug("Got message for project: %s check that bindings are correct!",
          message.payload.project);
  };

  // Create timed handler for statistics
  var timedHandler = base.stats.createHandlerTimer(handler, {
    drain:      this.drain,
    component:  this.component
  });

  // Listen for messages and handle them
  this.listener.on('message', timedHandler);

  // Start listening
  return this.listener.connect().then(function() {
    return that.listener.resume();
  });
};

// Export Handlers
module.exports = Handlers;


/** Handle notifications of completed messages */
Handlers.prototype.onNewResultSet = function(message) {
  var that = this;

  // Find url pattern for this project
  var urlPattern = this.branches[message.payload.project];
  assert(urlPattern, "This should have been cached earlier or " +
                     "we have bad configuration");

  // Parameterize url
  var url = urlPattern.replace(/<rev>/g, message.payload.revision);
  return request
    .get(url)
    .end()
    .then(function(res) {
      if (res.status === 404) {
        return console.log("Failed to get anything from: %s", url);
      }
      assert(res.ok, "Request failed, but not with a 404!");

      // Generate taskGraphId
      var taskGraphId = slugid.v4();

      // Instantiate task-graph
      var taskGraph = instantiate(res.text, {
        owner:    message.payload.author,
        source:   url,
        comment:  message.payload.comments,
        project:  message.payload.project,
        revision: message.payload.revision
      });

      // Create task-graph
      return that.scheduler.createTaskGraph(taskGraphId, taskGraph);
    });
};

