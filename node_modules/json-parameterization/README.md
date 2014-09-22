json-parameterization - Parameterization of JSON Structures
===========================================================

Parameterize untrusted JSON structures safely. This is basically a very simple
library for substituting strings into JSON structures.

**Example**

```js
var parameterize = require('json-parameterization');

var input = {
  "{{key-prefix}}Key":  "{{now}} ms",
  "say":                "{{Hello World | to-lower }}"
};

var params = {
  'key-prefix':   'time',
  'now':          function() {
                    return new Date().getTime();
                  },
  'to-lower':     function(param) {
                    return param.toLowerCase();
                  }
};

parameterize(input, params);
```

**Result**

```js
{
  timeKey:      "1411165317832 ms",
  say:          "hello world"
}
```


License
-------
The `json-parameterization` library is released on the MIT license, see the
`LICENSE` for complete license.
