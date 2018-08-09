#!/bin/bash
java -jar closure-compiler.jar --js $1 --compilation_level ADVANCED --jscomp_off "*" --language_out ECMASCRIPT5 >tmp.c.js
wc -c tmp.c.js

uglifyjs tmp.c.js --compress toplevel,drop_console --mangle toplevel -b beautify=false,ascii_only=true> tmp.c.u.js
wc -c tmp.c.u.js

ruby pnginator.rb tmp.c.u.js luola.html
wc -c luola.html
rm tmp.c.js tmp.c.u.js
