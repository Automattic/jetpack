#!/bin/bash

# Array of commands to execute
IN_DOCKER_CONTAINER="pnpm jetpack docker --type e2e --name t1"

commands=(
    "$IN_DOCKER_CONTAINER wp -- plugin list"
    "$IN_DOCKER_CONTAINER wp -- jetpack module list"
    "$IN_DOCKER_CONTAINER wp -- option list"
    "$IN_DOCKER_CONTAINER wp -- jetpack options list"
    "$IN_DOCKER_CONTAINER wp -- jetpack status"
    "$IN_DOCKER_CONTAINER wp -- jetpack test-connection"
)

# Determine log file name
if [ -n "$1" ]; then
    LOG_FILE="debug-e2e-$1.log"
else
    TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
    LOG_FILE="debug-e2e-$TIMESTAMP.log"
fi

# Clear existing log file
> "$LOG_FILE"

# Execute each command in the array
for cmd in "${commands[@]}"; do
    echo "Executing: $cmd" | tee -a "$LOG_FILE"
    eval "$cmd" 2>&1 | tee -a "$LOG_FILE"
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo "Command failed: $cmd" | tee -a "$LOG_FILE"
        exit 1
    fi
    echo "---" | tee -a "$LOG_FILE"
done

echo "All commands executed successfully" | tee -a "$LOG_FILE"