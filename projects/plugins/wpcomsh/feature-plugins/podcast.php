<?php
/**
 * Keep the Jetpack Podcast module available on Atomic sites.
 *
 * @package wpcomsh
 */

// Jetpack builds before 16.1-a.3 hide Podcast behind this filter; #50447
// removed the gate. A small tail of Atomic sites still reports 16.0.x, and
// there dropping the opt-in would filter Podcast out of Modules::get_active(),
// so the module would stop loading even though it is in the stored setting.
// Registered at mu-plugin load so it is in place before get_available_modules()
// first runs. Delete once no Atomic site reports a Jetpack below 16.1-a.3.
add_filter( 'jetpack_podcast_for_the_world', '__return_true' );
