suite('instantiate', function() {
  var instantiate       = require('../try/instantiate.js');
  var assert            = require('assert');
  var fs                = require('fs');
  var path              = require('path');
  var taskcluster       = require('taskcluster-client');
  var slugid            = require('slugid');
  var base              = require('taskcluster-base');
  var debug             = require('debug')('taskcluster-try:test:instantiate');

  test('parseTime 1 day', function() {
    assert.equal(instantiate.parseTime('1d').days, 1);
    assert.equal(instantiate.parseTime('1 d').days, 1);
    assert.equal(instantiate.parseTime('1 day').days, 1);
    assert.equal(instantiate.parseTime('1 days').days, 1);
    assert.equal(instantiate.parseTime('1day').days, 1);
    assert.equal(instantiate.parseTime('1    d').days, 1);
    assert.equal(instantiate.parseTime('  1    day   ').days, 1);
    assert.equal(instantiate.parseTime('  1 days   ').days, 1);
  });

  test('parseTime 3 days', function() {
    assert.equal(instantiate.parseTime('3d').days, 3);
    assert.equal(instantiate.parseTime('3 d').days, 3);
    assert.equal(instantiate.parseTime('3 day').days, 3);
    assert.equal(instantiate.parseTime('3 days').days, 3);
    assert.equal(instantiate.parseTime('3day').days, 3);
    assert.equal(instantiate.parseTime('3    d').days, 3);
    assert.equal(instantiate.parseTime('  3    day   ').days, 3);
    assert.equal(instantiate.parseTime('  3 days   ').days, 3);
  });

  test('parseTime 45 hours', function() {
    assert.equal(instantiate.parseTime('45h').hours, 45);
    assert.equal(instantiate.parseTime('45 h').hours, 45);
    assert.equal(instantiate.parseTime('45 hour').hours, 45);
    assert.equal(instantiate.parseTime('45 hours').hours, 45);
    assert.equal(instantiate.parseTime('45hours').hours, 45);
    assert.equal(instantiate.parseTime('45    h').hours, 45);
    assert.equal(instantiate.parseTime('  45    hour   ').hours, 45);
    assert.equal(instantiate.parseTime('  45 hours   ').hours, 45);
  });

  test('parseTime 45 min', function() {
    assert.equal(instantiate.parseTime('45m').minutes, 45);
    assert.equal(instantiate.parseTime('45 m').minutes, 45);
    assert.equal(instantiate.parseTime('45 min').minutes, 45);
    assert.equal(instantiate.parseTime('45 minutes').minutes, 45);
    assert.equal(instantiate.parseTime('45minutes').minutes, 45);
    assert.equal(instantiate.parseTime('45    m').minutes, 45);
    assert.equal(instantiate.parseTime('  45    min   ').minutes, 45);
    assert.equal(instantiate.parseTime('  45 minutes   ').minutes, 45);
  });

  test('parseTime 2d3h6m', function() {
    assert.equal(instantiate.parseTime('2d3h6m').days, 2);
    assert.equal(instantiate.parseTime('2d3h6m').hours, 3);
    assert.equal(instantiate.parseTime('2d3h6m').minutes, 6);
    assert.equal(instantiate.parseTime('2d3h').minutes, 0);
    assert.equal(instantiate.parseTime('2d0h').hours, 0);
  });

  test('relativeTime', function() {
    var d1 = new Date();
    var d2 = new Date(d1.getTime());
    d2.setHours(d1.getHours() + 2);
    var d3 = instantiate.relativeTime(instantiate.parseTime('2 hours'), d1);
    assert(d3.getTime() === d2.getTime(), "Wrong date");
  });

  test('instantiate task-graph.yml', function() {
    // Load input file
    var input = fs.readFileSync(
      path.join(__dirname, 'data', 'task-graph.yml'), {
      encoding: 'utf8'
    });

    var taskGraph = instantiate(input, {
      owner:         'user@example.com',
      source:        'http://localhost/unit-test',
      comment:       "try: something...",
      project:       "try",
      revision:      'REVISION',
      revision_hash: 'RESULTSET'
    });

    // Do a little smoke testing
    assert(taskGraph.metadata);
    assert(taskGraph.metadata.owner === 'user@example.com');
    assert(taskGraph.tasks[0].routes.indexOf('xyz.try.RESULTSET') !== -1);
    assert(taskGraph.tasks.length === 3);
    assert(taskGraph.tasks[1].taskId === taskGraph.tasks[2].requires[0]);

    // Print when debugging issues
    //console.log(JSON.stringify(taskGraph, null, 2));

    // Load configuration
    var cfg = base.config({
      defaults:     require('../config/defaults'),
      profile:      require('../config/' + 'localhost'),
      envs: [
        'taskcluster_schedulerBaseUrl',
        'taskcluster_authBaseUrl',
        'taskcluster_credentials_clientId',
        'taskcluster_credentials_accessToken',
        'influx_connectionString'
      ],
      filename:     'taskcluster-try'
    });

    // Create scheduler client
    var scheduler = new taskcluster.Scheduler({
      credentials:      cfg.get('taskcluster:credentials'),
      baseUrl:          cfg.get('taskcluster:schedulerBaseUrl'),
      authorizedScopes: cfg.get('try:scopes')
    });

    // Create taskGraphId
    var taskGraphId = slugid.v4();

    debug("Creating taskGraphId: %s", taskGraphId);
    return scheduler.createTaskGraph(taskGraphId, taskGraph);
  });
});
