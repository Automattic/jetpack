<!--
Link a related issue to this PR. If the PR does not immediately resolve the issue,
for example, it requires a separate deployment to production, avoid
using the "fixes" keyword and instead attach the [Status] Fix Inbound label to
the linked issue.
-->

Related to #

## Proposed Changes

*

## Testing Instructions

<!--
Add as many details as possible to help others reproduce the issue and test the fix.
"Before / After" screenshots can also be very helpful when the change is visual.
-->

1. Create a new Business site, mark it as a WoA Dev site, and take it Atomic.
2. Build wpcomsh plugin and synchronize to the WoA Dev site

```
git checkout BRANCH
composer install
WPCOMSH_DEVMODE=1 make clean build
rsync -avze ssh --delete build/wpcomsh USERNAME@sftp.wp.com:htdocs/wp-content/mu-plugins
```

3. Add your remaining test instructions here.
