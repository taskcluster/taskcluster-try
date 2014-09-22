suite('parameterize', function() {
  var _             = require('lodash');
  var debug         = require('debug')('json-parameterization:test');
  var assert        = require('assert');
  var parameterize  = require('./');

  test("Empty case", function() {
    var input = {};
    var params = {};
    var output = {};
    assert.deepEqual(parameterize(input, params), output,
                     "Predicted output wasn't matched!");
  });

  test("String extraction", function() {
    var input = {
      key1:     "{{'Hello World'}}",
      key2:     "{{   'Hello World'   }}",
      key3:     "{{\"Hello World\"}}",
      key4:     "{{  \"Hello World\"   }}"
    };
    var params = {};
    var output = {
      key1:     "Hello World",
      key2:     "Hello World",
      key3:     "Hello World",
      key4:     "Hello World"
    };
    assert.deepEqual(parameterize(input, params), output,
                     "Predicted output wasn't matched!");
  });

  test("Substitute strings in", function() {
    var input = {
      key1:       "{{param1}}",
      key2:       "{{param2}}"
    };
    var params = {
      param1:     "PAR1",
      param2:     "PAR2",
    };
    var output = {
      key1:     "PAR1",
      key2:     "PAR2",
    };
    assert.deepEqual(parameterize(input, params), output,
                     "Predicted output wasn't matched!");
  });

  test("Substitute functions in", function() {
    var input = {
      key1:       "{{param1}}",
      key2:       "{{param2}}"
    };
    var params = {
      param1:     function() { return "PAR1"; },
      param2:     function() { return "PAR" + (1 + 1); }
    };
    var output = {
      key1:     "PAR1",
      key2:     "PAR2",
    };
    assert.deepEqual(parameterize(input, params), output,
                     "Predicted output wasn't matched!");
  });

  test("Modify string", function() {
    var input = {
      key1:     "{{'hello world' | to-upper}}",
      key2:     "{{ 'hello world'   | to-upper   | to-lower  }}",
      key3:     "{{   hi-var   | to-upper   |    to-lower  }}",
    };
    var params = {
      'to-upper': function(text) {
        return text.toUpperCase();
      },
      'to-lower': function(text) {
        return text.toLowerCase();
      },
      'hi-var':   'hello World'
    };
    var output = {
      key1:     "HELLO WORLD",
      key2:     "hello world",
      key3:     "hello world"
    };
    assert.deepEqual(parameterize(input, params), output,
                     "Predicted output wasn't matched!");
  });

  test("Substitute into a key", function() {
    var input = {
      "{{prefix}}Key": "Value"
    };
    var params = {
      'prefix':     'Some'
    };
    var output = {
      SomeKey: 'Value'
    };
    assert.deepEqual(parameterize(input, params), output,
                     "Predicted output wasn't matched!");
  });
});
