<?php
/**
 * Site Editor - Show location-aware snackbar on load.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\SiteEditorSnackbarOnLoad;

const FEATURE_NAME = 'site-editor-snackbar-on-load';

add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			$extensions,
			array(
				FEATURE_NAME,
			)
		);
	}
);

add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
);
