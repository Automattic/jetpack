# Scan UI for Jetpack

This package will host the wp-admin Scan UI for the Jetpack plugin.

The dashboard is currently an empty `wp-build` scaffold gated behind the
`rsm_jetpack_ui_modernization_scan` filter (default off). Follow-up PRs
port Calypso's Scan dashboard (`client/dashboard/sites/scan/`) onto this
native wp-admin page.
