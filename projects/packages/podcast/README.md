# Podcast for Jetpack

Hosts the wp-admin Podcast experience for the Jetpack plugin (Simple and Atomic only).

The package is gated behind the `jetpack_podcast_untangle` filter (default off). Until the filter is flipped on, the package contributes nothing — the legacy podcasting code (`Automattic_Podcasting` in the wpcom mu-plugin and the `at-pressable-podcasting` bridge plugin) keeps running unchanged. Subsequent PRs in the untangle train layer the new wp-admin SPA, REST integration, and feed customization on top of this gate.
