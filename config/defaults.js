module.exports = {
  // Try configuration
  'try': {
    // Name of AMQP queue, if a non-exclusive queue is to be used.
    listenerQueueName:            undefined,

    // Component name in statistics
    statsComponent:               'try',

    // Mapping from projects to patterns for fetching task-graph.yml
    branches: {
      'try':              'https://hg.mozilla.org/try/raw-file/<rev>/taskgraph.yml'
    },

    // Treeherder exchange prefix
    treeherderExchangePrefix:     'exchange/treeherder/v1/',

    // Scopes tasks should be able to be created with
    scopes: [
      'scheduler:create-task-graph',
      'queue:*'
    ]
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
      clientId:                   undefined,
      accessToken:                undefined
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
