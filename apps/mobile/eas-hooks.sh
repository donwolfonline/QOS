#!/usr/bin/env bash

set -e

echo "Running eas-build-pre-install script..."

# Navigate to the monorepo root
cd ../../

# Run pnpm install to ensure all workspace dependencies including qos-ui-shared are correctly hoisted
echo "Running pnpm install in the monorepo root..."
pnpm install

echo "Finished eas-build-pre-install script."
