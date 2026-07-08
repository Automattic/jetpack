<?php
/**
 * Expose the Jetpack Podcast module on Atomic sites.
 *
 * @package wpcomsh
 */

// Opt Atomic sites into the Podcast module. Jetpack hides it behind this filter
// until go-live; flipping it true lets the module's `Auto Activate` header turn
// it on by default, and it stays user-toggleable like any other Jetpack module.
// Simple sites are intentionally left out (wpcomsh doesn't run there): the module
// stays hidden and always-on via the IS_WPCOM active-state, so it can't be toggled off.
add_filter( 'jetpack_podcast_for_the_world', '__return_true' );
