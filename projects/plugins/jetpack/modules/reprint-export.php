<?php
/**
 * Reprint export support for Pressable and WordPress.com (Atomic) sites.
 *
 * Not a module: it has no module headers, so it never appears in the module
 * list and cannot be activated or deactivated. module-extras.php requires it on
 * every request, through the `jetpack_tools_to_include` filter, which is how a
 * site owner can keep it from loading at all.
 *
 * The registration itself is gated on the host — see Reprint_Exporter::is_available().
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

\Automattic\Jetpack\Reprint_Export\Reprint_Exporter::maybe_init();
