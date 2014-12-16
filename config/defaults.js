module.exports = {
  // Try configuration
  'try': {
    // Name of AMQP queue, if a non-exclusive queue is to be used.
    listenerQueueName:            undefined,

    // Concurrent messages to handle.
    listenerPrefetch:             1,

    // Component name in statistics
    statsComponent:               'try',

    // Mapping from projects to patterns for fetching task-graph.yml
    branches: {
      'try': 'https://hg.mozilla.org/try/raw-file/<rev>/testing/taskcluster/tasks/decision/try.yml'
    },

    // Treeherder exchange prefix
    treeherderExchangePrefix:     'exchange/treeherder-stage/v1/',

    // Scopes tasks should be able to be created with
    scopes: [
      'scheduler:create-task-graph',
      'queue:*'
    ]
  },

  pulse: {
    username: process.env.PULSE_USERNAME,
    password: process.env.PULSE_PASSWORD
  },

  // Configuration of access to other taskcluster components
  taskcluster: {
    // BaseUrl for auth, if default built-in baseUrl isn't to be used
    authBaseUrl:                  undefined,

    // BaseUrl for scheduler, if default built-in baseUrl isn't to be used
    schedulerBaseUrl:             undefined,

    // TaskCluster credentials for this server, these must have scopes:
    // 'auth:credentials', try.scopes
    // (typically configured using environment variables)
    credentials: {
      clientId:                   process.env['TASKCLUSTER_CLIENT_ID'],
      accessToken:                process.env['TASKCLUSTER_ACCESS_TOKEN']
    }
  },

  // InfluxDB configuration
  influx: {
    // Usually provided as environment variables, must be on the form:
    // https://<user>:<pwd>@<host>:<port>/db/<database>
    connectionString:               undefined,

    // Maximum delay before submitting pending points
    maxDelay:                       5 * 60,

    // Maximum pending points in memory
    maxPendingPoints:               250
  }
};
