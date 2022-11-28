<?php
/**
 * Loader for the Markdown library.
 *
 * This file loads in a couple specific things from the markdown dir.
 *
 * @package automattic/jetpack
 */

if ( ! class_exists( 'MarkdownExtra_Parser' ) ) {
	require_once JETPACK__PLUGIN_DIR . '/_inc/lib/markdown/extra.php';
}

require_once JETPACK__PLUGIN_DIR . '/_inc/lib/markdown/gfm.php';
