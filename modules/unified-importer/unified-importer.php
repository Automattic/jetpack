<?php

class Jetpack_Unified_Importer_Module {
	static function is_import_screen() {
		global $pagenow;

		// $pagenow is probably enough for us
		// We may want additional "screen" info at some point, so putting here for ref
		// $screen = get_current_screen();
		// error_log( print_r( $screen, 1 ) );

		switch ( $pagenow ) {
			case 'import.php':
				return true;
			case 'admin.php':
				return isset( $_REQUEST['import'] ) && $_REQUEST['import'];
		}
	}

	static function import_ui() {
		if ( ! self::is_import_screen() ) {
			// Do nothing except on the import screen
			return;
		}

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

		wp_enqueue_script( 'jetpack_import_ui', plugin_dir_url( __FILE__ ) . '/index.js', array( 'jquery' /* @TODO react n stuff */ ), JETPACK__VERSION, true );

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
?>
<div class="jetpack-unified-importer">
	<h1>Oh hi, hullo, Unified Importer!!!!</h1>
	<p>So, this element (<code>.jetpack-unified-importer</code>) is our entry point for our script.</p>
	<hr />
	<p>
		We can clone and mutate the core list (<code>table.importers</code>)<br />
		...then append it to the bottom of our UI as desired
	</p>
	<hr />
	<p>And we can have a button which toggles visibility of this & the "regular" UI</p>
	<p>e.g.&nbsp;&nbsp;<button class="jetpack-unified-importer__exit">Exit</button></p>
	<div style="width: 400px">
		<marquee>For now, please enjoy this super-1337 throwback jQuery mockup ;P</marquee>
	</div>
</div>
<?php
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
}

/**
 * This action fires in wp-admin when query argument `action=jetpack_import_ui`
 * @see https://developer.wordpress.org/reference/hooks/admin_action__requestaction/
 */
add_action( 'admin_action_jetpack_import_ui', array( 'Jetpack_Unified_Importer_Module', 'import_ui' ) );
