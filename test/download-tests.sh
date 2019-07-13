#!/bin/sh

echo "Starting web server..."
./node_modules/.bin/superstatic --port=3474 --config=test/superstatic.json test &
webserver=$!

echo "Running tests..."
./node_modules/.bin/karma start "$@"
result=$?

echo "Shutting down web server..."
kill $webserver

exit $result
