#!/bin/bash
# This script is ran as part of the `UpdateJetpackStaging` TeamCity build.
# It updates pre-defined Atomic test sites with the latest plugin versions.

####################################################
## Script variables.
####################################################

TMP_DIR=$(mktemp -d) # Temp dir where the plugin .zip files are downloaded and unpacked.
REMOTE_DIR='/srv/htdocs/jetpack-staging' # Remote dir where the unpacked plugin files are synced to.
PLUGINS=( "jetpack" "jetpack-mu-wpcom-plugin" ); # Plugins to update.
declare -A PLUGIN_DOWNLOAD_URLS # Array used to hold fetched plugin download URLs.

SITES='{
  "jetpackedge.wpcomstaging.com": {
    "url": "https://jetpackedge.wpcomstaging.com/",
    "note": "normal site",
    "ssh_string": "jetpackedge.wordpress.com@sftp.wp.com",
    "blog_id": "215379549"
  },
  "jetpackedgephp74.wpcomstaging.com": {
    "url": "https://jetpackedgephp74.wpcomstaging.com/",
    "note": "php 7.4",
    "ssh_string": "jetpackedgephp74.wordpress.com@sftp.wp.com",
    "blog_id": "215379848"
  },
  "jetpackedgephp82.wpcomstaging.com": {
    "url": "https://jetpackedgephp82.wpcomstaging.com/",
    "note": "php 8.2",
    "ssh_string": "jetpackedgephp82.wordpress.com@sftp.wp.com",
    "blog_id": "215380000"
  },
  "jetpackedgeecomm.wpcomstaging.com": {
    "url": "https://jetpackedgeecomm.wpcomstaging.com/",
    "note": "ecommerce plan",
    "ssh_string": "jetpackedgeecomm.wordpress.com@sftp.wp.com",
    "blog_id": "215380391"
  },
  "jetpackedgeprivate.wpcomstaging.com": {
    "url": "https://jetpackedgeprivate.wpcomstaging.com/",
    "note": "private site",
    "ssh_string": "jetpackedgeprivate.wordpress.com@sftp.wp.com",
    "blog_id": "215380534"
  },
  "jetpackedgewpbeta.wpcomstaging.com": {
    "url": "https://jetpackedgewpbeta.wpcomstaging.com/",
    "note": "latest wp beta",
    "ssh_string": "jetpackedgewpbeta.wordpress.com@sftp.wp.com",
    "blog_id": "215380197"
  },
  "jetpackedgewpprevious.wpcomstaging.com": {
    "url": "https://jetpackedgewpprevious.wpcomstaging.com/",
    "note": "previous wp version",
    "ssh_string": "jetpackedgewpprevious.wordpress.com@sftp.wp.com",
    "blog_id": "215380213"
  }
}'

####################################################
## Fetch plugin data from the Jetpack Beta Builder.
####################################################

# Fetch the latest data from the Jetpack Beta Builder for each plugin.
for PLUGIN in "${PLUGINS[@]}"; do
  echo "Fetching latest $PLUGIN data from the Jetpack Beta Builder..."
  if ! RESPONSE=$(curl -s https://betadownload.jetpack.me/$PLUGIN-branches.json); then
    echo "Error: unable to fetch data from Jetpack Beta Builder for $PLUGIN."
    exit 1
  fi

  DOWNLOAD_URL=$(jq -r ".master.download_url" <<<"$RESPONSE")
  PLUGIN_VERSION=$(jq -r ".master.version" <<<"$RESPONSE")

  if [[ -z "$DOWNLOAD_URL" || -z "$PLUGIN_VERSION" ]]; then
    echo "Error: unable to extract data from Jetpack Beta Builder response for $PLUGIN."
    exit 1
  else
    echo "Returned version number for $PLUGIN: $PLUGIN_VERSION"
    PLUGIN_DOWNLOAD_URLS[$PLUGIN]="$DOWNLOAD_URL"
  fi
done

####################################################
## Download and unpack the plugin .zip files.
####################################################

for PLUGIN in "${PLUGINS[@]}"; do
  echo "Attempting to download $PLUGIN .zip file..."
  if ! curl -f -o "$TMP_DIR/$PLUGIN-dev.zip" "${PLUGIN_DOWNLOAD_URLS[$PLUGIN]}"; then
    echo "Download of $PLUGIN .zip failed, exiting."
    exit 1
  else
    echo "Download of $PLUGIN .zip completed."
  fi

  echo "Unpacking .zip file to: $TMP_DIR/$PLUGIN"
  if ! unzip -q "$TMP_DIR/$PLUGIN-dev.zip" -d "$TMP_DIR"; then
    echo "Unpacking of the .zip failed, exiting."
    exit 1
  else
    echo "Unpacking of $PLUGIN completed successfully."
  fi
done

####################################################
## Sync the new Jetpack files.
####################################################

# Sync new plugin files to the Atomic test sites.
EXIT_CODE=0
for key in $(jq -r 'keys[]' <<<"$SITES"); do
  # Extract values for each site.
  ssh_string=$(jq -r --arg key "$key" '.[$key].ssh_string' <<<"$SITES")
  blog_id=$(jq -r --arg key "$key" '.[$key].blog_id' <<<"$SITES")

  # Attempt to rsync each plugin directory files over SSH.
  for PLUGIN in "${PLUGINS[@]}"; do
    echo "Attempting to sync $PLUGIN files to $key | blog_id: $blog_id"
    if ! rsync -az --quiet --delete "$TMP_DIR/$PLUGIN-dev/" "$ssh_string:$REMOTE_DIR/$PLUGIN/"; then
      echo "Failed to sync $PLUGIN files to $key | blog_id: $blog_id"
      EXIT_CODE=1
    else
      echo "Successfully synced $PLUGIN files to $key | blog_id: $blog_id"
    fi
  done
done

####################################################
## Cleanup.
####################################################

echo 'Cleaning up...'
rm -rf "$TMP_DIR"
echo "$(basename $0) script finished."
exit $EXIT_CODE
