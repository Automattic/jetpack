<?php

class Jetpack_Unified_Importer_Module {
	const UI_ACTION_ARG = 'jetpack_import_ui';

	static function admin_init() {
		global $pagenow;

		if ( 'import.php' !== $pagenow ) {
			return;
		}

		/**
		 * This action fires in wp-admin when query argument `action=jetpack_import_ui`
		 * @see https://developer.wordpress.org/reference/hooks/admin_action__requestaction/
		 */
		add_action( 'admin_action_' . self::UI_ACTION_ARG, __CLASS__ . '::import_ui' );

		// The `import_ui` class will remove this function when our UI shows
		add_action( 'admin_notices', __CLASS__ . '::admin_notice' );
	}

	static function import_ui() {
		// Don't print the admin notice when already on our UI
		remove_action( 'admin_notices', __CLASS__ . '::admin_notice' );

		/**
		 * Pre-hide the core UI so it doesn't jump around
		 *
		 * @TODO If you can find a better way to reference this markup, that'd be awesome.
		 * This is fragile in that a core change to this markup would break our app.
		 * See:
		 *   * https://github.com/WordPress/WordPress/blob/71cf332e6569f0ac2f263ce9b2168644942f5534/wp-admin/admin-header.php#L251
		 *   * https://github.com/WordPress/WordPress/blob/71cf332e6569f0ac2f263ce9b2168644942f5534/wp-admin/import.php#L56-L60
		 *
		 * The scripts can use the `parentElement` of `table.importers` which is probably less fragile.
		 * (wouldn't a parent pseudoselector be nice! ;) )
		 */
?><style>#wpbody-content .wrap { display: none; }</style><?php

//		wp_enqueue_script( 'unified_importer_ui', plugin_dir_url( __FILE__ ) . '/index.js', array( 'jquery' /* @TODO react n stuff */ ), JETPACK__VERSION, true );
		wp_enqueue_script(
			'jetpack_import_ui',
			plugins_url( '_inc/build/unified-importer.js', JETPACK__PLUGIN_FILE ),
			array( 'react', 'wp-api-fetch', 'wp-components', 'wp-data', 'wp-core-data' ),
			JETPACK__VERSION,
			true
		);

		// @TODO is `admin_notices` our best hook for our entry element?
		add_action( 'admin_notices', __CLASS__ . '::import_ui_entry_element' );
		add_action( 'admin_footer', __CLASS__ . '::import_ui_ensure_core_ui_is_hidden_by_default' );

		/**
		 * @TODO override help text? https://github.com/WordPress/WordPress/blob/e0e99fe82e652a9d16b603ec17b777395fb9783e/wp-admin/import.php#L20-L33
		 * 	See:
		 * 		https://user-images.githubusercontent.com/1587282/53657998-a8811880-3c25-11e9-9a75-5e8f67b0d67d.png
		 * 	...for default look  & feel
		 */
	}

	static function import_ui_entry_element() {
		?><div class="jetpack-unified-importer" /><?php
	}

	static function import_ui_ensure_core_ui_is_hidden_by_default() {
?>
<script>
try {
	document.querySelector( 'table.importers' ).parentElement.style.display = 'none';
} catch ( e ) {
	console.error( 'Jetpack Importer UI: Unable to locate importers table' );
}
</script>
<?php
	}

	static function ui_url() {
		return add_query_arg( 'action', self::UI_ACTION_ARG, admin_url( 'import.php' ) );
	}

	static function admin_notice() {
		/**
		 * TODO:
		 * - [ ] Copy
		 * - [ ] Styling
		 * - [ ] Persist the opt-out for some period...?
		 */
?>
<div class="notice notice-info is-dismissible">
	<h1>Try the Unified Importer</h1>
	<p>Jetpack includes an import experience that's easy-to-use and supports....</p>
	<a class="button primary" href="<?php echo esc_url( self::ui_url() ) ?>">Try it!</a>
</div>
<?php
	}
}

add_action( 'admin_init', array( 'Jetpack_Unified_Importer_Module', 'admin_init' ) );
