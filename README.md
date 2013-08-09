Hacker News mobile app
==

#### http://hn.premii.com

### lib.js contains

* Zepto
* Fastclick
* jQuery.cookie plugin
* PubSub
* localstorage wrapper

### Data source (index.htm).

<code>
"url" : {
    "stories" : "http://ng.premii.com:8080",
    "readability": "http://localhost/a/read/sample.txt"
}
</code>


Update these paths to point to your HN stories server and readability server. See sample.txt for readability output.

### Unofficial Hacker News API for HN data
- https://github.com/cheeaun/node-hnapi/

### Others
* Icon font - http://icomoon.io
* Normalize.css - https://github.com/necolas/normalize.css/

#### Build process (Not included)
* Using nodejs to generate production ready code
* Removes all console.log messages
* Combine and minify JS using uglifyjs
* Combine CSS into one file
* Phonegap ready code

