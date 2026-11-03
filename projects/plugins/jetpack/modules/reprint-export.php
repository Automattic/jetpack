<?php
/**
 * Reprint export support for Pressable and WordPress.com (Atomic) sites.
 *
 * Not a module: it has no module headers, so it cannot be activated or
 * deactivated. module-extras.php loads it as a connected tool, and
 * `jetpack_tools_to_include` can exclude it entirely.
 *
 * The registration itself is gated on the host — see Reprint_Exporter::is_available().
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

\Automattic\Jetpack\Reprint_Export\Reprint_Exporter::maybe_init();
