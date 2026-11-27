IDC Package
=========

The Identity Crisis UI.

## Recovery authorization source

`IDCScreen` accepts an optional `from` string. It is passed to the fresh-connection
endpoint for registration and authorization, and preserved when navigating to
WordPress.com. Without it, the legacy screen keeps its `idc-notice` source.

For PHP consumers, see the connection package's
[Safe Mode authorization source](../../packages/connection/README.md#safe-mode-authorization-source).
