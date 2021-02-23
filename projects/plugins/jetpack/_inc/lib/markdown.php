<?php
/**
 * Loader for the Markdown library.
 *
 * This file loads in a couple specific things from the markdown dir.
 *
 * @package automattic/jetpack
 */

if ( ! class_exists( 'MarkdownExtra_Parser' ) ) {
	jetpack_require_lib( 'markdown/extra' );
}

jetpack_require_lib( 'markdown/gfm' );
