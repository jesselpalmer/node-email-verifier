#!/bin/bash
# Usage: ./retry-npm.sh <npm-command>
# Example: ./retry-npm.sh "ci" or ./retry-npm.sh "install --save-dev typescript@latest @types/node@latest"

NPM_COMMAND="$1"
MAX_ATTEMPTS=3
RETRY_DELAY=5

if [ -z "$NPM_COMMAND" ]; then
  echo "Error: npm command not provided"
  echo "Usage: $0 <npm-command>"
  exit 1
fi

for i in $(seq 1 $MAX_ATTEMPTS); do
  echo "Running: npm $NPM_COMMAND (attempt $i of $MAX_ATTEMPTS)"
  
  if npm $NPM_COMMAND; then
    echo "npm $NPM_COMMAND succeeded"
    exit 0
  fi
  
  echo "npm $NPM_COMMAND failed, attempt $i of $MAX_ATTEMPTS"
  
  if [ $i -eq $MAX_ATTEMPTS ]; then
    echo "npm $NPM_COMMAND failed after $MAX_ATTEMPTS attempts"
    exit 1
  fi
  
  echo "Retrying in $RETRY_DELAY seconds..."
  sleep $RETRY_DELAY
done