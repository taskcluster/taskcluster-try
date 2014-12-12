TaskCluster Try
===============

This component listens for result-sets on treeherder, and when a new result-set
from a branch that this components is configured to pick up arrives, it looks up
the revision for a file called taskgraph.yml. If the revision tree contains
such a file, a task-graph with the tasks from taskgraph.yml is created.

The contents of taskgraph.yml will be parsed as YAML and parameterized using
[json-parameterization](https://github.com/jonasfj/json-parameterization) with
the following parameters:

  * `now`, date-time for now in JSON compatible format,
  * `owner`, email for the author of the push,
  * `source`, url to the taskgraph.yml,
  * `revision`, revision identifier of the push,
  * `revision_hash`, identifier of treeherder resultset
  * `comment`, comment from the most recent revision pushed,
  * `project`, treeherder project this was pushed for,
  * `from-now`, modifier that converts relative time to JSON date-time,
  * `as-slugid`, modifier that converts a label to a slugid.

The `from-now` modifier takes a string on the form `X days Y hours X minutes`
and converts it to a JSON compatible date-time string. For example the
follow `'{{ "1 day 2 hours" | from-now }}'` will become a date-time string
point 26 hours into the future. Useful for constructing the `deadline` property.

The `as-slugid` modifier takes a label and translates it to a slugid within a
given task-graph. This is useful for constructing `taskId`s. For example  all
occurences of the following string `'{{ "my-task" | as-slugid }}'` will be
replaced with a slugid, unique to the given task-graph. In this case the string
`"my-task"` can be used as label for a `taskId`, so that it can be referenced
in the `requires` array for another node in the task-graph.
