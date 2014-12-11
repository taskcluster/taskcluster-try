var assert        = require('assert');
var yaml          = require('yamljs');
var _             = require('lodash');
var slugid        = require('slugid');
var mustache      = require('mustache');

// Regular expression matching: X days Y hours Z minutes
var timeExp = /^(\s*(\d+)\s*d(ays?)?)?(\s*(\d+)\s*h(ours?)?)?(\s*(\d+)\s*m(in(utes?)?)?)?\s*$/;

/** Parse time string */
var parseTime = function(str) {
  // Parse the string
  var match = timeExp.exec(str);
  if (!match) {
    throw new Error("String: '" + str + "' isn't a time expression");
  }
  // Return parsed values
  return {
    days:     parseInt(match[2] || 0),
    hours:    parseInt(match[5] || 0),
    minutes:  parseInt(match[8] || 0)
  };
};

/** Convert time object to relative Date object*/
var relativeTime = function(time, to) {
  if (to === undefined) {
    to = new Date();
  }
  return new Date(
    to.getTime()
    + time.days * 24 * 60 * 60 * 1000
    + time.hours     * 60 * 60 * 1000
    + time.minutes        * 60 * 1000
  );
};

/**
 * Instantiate a task-graph template from YAML string
 *
 * options:
 * {
 *   owner:         'user@exmaple.com',  // Owner emails
 *   source:        'http://...'         // Source file this was instantiated from
 *   revision:      '...',               // Revision hash string
 *   comment:       'try: ...',          // Latest commit comment
 *   project:       'try',               // Treeherder project name
 *   revision_hash: '...',               // Revision hash for treeherder resultset
 * }
 *
 * In in addition to options provided above the following paramters is available
 * to templates:
 *  - `now` date-time string for now,
 *  - `from-now` modifier taking a relative date as 'X days Y hours Z minutes'
 *  - `as-slugid` modifier converting a label to a slugid
 *
 */
var instantiate = function(template, options) {
  // Validate options
  assert(options.owner,          "options.owner is required");
  assert(options.source,         "options.source is required");
  assert(options.revision,       "options.revision is required");
  assert(options.comment,        "options.comment is required");
  assert(options.project,        "options.owner is required");
  assert(options.revision_hash,  "options.revision_hash is required");

  // Create label cache, so we provide the same slugids for the same label
  var labelsToSlugids = {};

  // Parameterize template
  template = mustache.render(template, {
    'now':        new Date().toJSON(),
    'owner':      options.owner,
    'source':     options.source,
    'revision':   options.revision,
    'comment':    options.comment,
    'project':    options.project,
    'revision_hash':   options.revision_hash,
    'from-now':   function() {
                    return function(text, render) {
                      return render(relativeTime(parseTime(text)).toJSON());
                    }
                  },
    'as_slugid':  function() {
                    return function(label, render) {
                      var result = labelsToSlugids[label];
                      if (result === undefined) {
                        result = labelsToSlugids[label] = slugid.v4();
                      }
                      return render(result);
                    }
                  }
  });

  // Parse template
  return yaml.parse(template);
};

// Export parseTime
instantiate.parseTime = parseTime

// Export relativeTime
instantiate.relativeTime = relativeTime

// Export instantiate
module.exports = instantiate;
