# Podcast for Jetpack

Hosts the wp-admin Podcast experience for the Jetpack plugin (Simple and Atomic only).

The package owns the wp-admin SPA, REST integration, and feed customization, and is gated behind the `jetpack_podcast_untangle` filter (default on). The filter remains an escape hatch for forcing the legacy stack back on: filtering it off falls back to the legacy `Automattic_Podcasting` code in the wpcom mu-plugin on Simple sites. (The Atomic-side `at-pressable-podcasting` bridge has been removed.)
