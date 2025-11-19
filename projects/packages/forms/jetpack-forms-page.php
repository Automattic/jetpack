<?php
/**
 * Jetpack Forms Page - Admin menu registration
 *
 * Integrates @wordpress/build generated page with WordPress admin.
 * Based on Gutenberg's experimental pages feature.
 *
 * @package automattic/jetpack-forms
 */

// Load the generated build files.
require_once __DIR__ . '/build/index.php';

/**
 * Register the Jetpack Forms admin menu page.
 */
function jetpack_forms_register_admin_page() {
	add_menu_page(
		__( 'Jetpack Forms', 'jetpack' ),
		__( 'Jetpack Forms', 'jetpack' ),
		'manage_options',
		'jetpack-forms',
		'jetpack_forms_render_page',
		'dashicons-feedback',
		30
	);
}
add_action( 'admin_menu', 'jetpack_forms_register_admin_page' );

/**
 * Register menu items for the page sidebar.
 */
function jetpack_forms_register_menu_items() {
	register_jetpack_forms_menu_item(
		'inbox',
		__( 'Inbox', 'jetpack' ),
		'/',
		''
	);
}
add_action( 'jetpack-forms_init', 'jetpack_forms_register_menu_items', 5 );

/**
 * Setup private APIs for bundled @wordpress modules.
 *
 * This registers our modules as allowed to use private WordPress APIs.
 * The import maps are handled by wp_register_script_module in routes.php.
 */
function jetpack_forms_setup_modules() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! isset( $_GET['page'] ) || 'jetpack-forms' !== $_GET['page'] ) {
		return;
	}

	$base_url = plugins_url( 'jetpack-forms/build/', dirname( __FILE__ ) );
	?>
	<script type="importmap">
	{
		"imports": {
			"@wordpress/private-apis": "<?php echo esc_url( $base_url . 'scripts/private-apis/index.min.js' ); ?>",
			"@wordpress/boot": "<?php echo esc_url( $base_url . 'modules/boot/index.min.js' ); ?>",
			"@wordpress/route": "<?php echo esc_url( $base_url . 'modules/route/index.min.js' ); ?>",
			"@wordpress/theme": "<?php echo esc_url( $base_url . 'modules/theme/index.min.js' ); ?>"
		}
	}
	</script>
	<script>
		window.wp = window.wp || {};
		if ( window.wp.privateApis ) {
			delete window.wp.privateApis;
		}
	</script>
	<script src="<?php echo esc_url( $base_url . 'scripts/private-apis/index.min.js' ); ?>"></script>
	<script>
		( function() {
			function setupPrivateApis() {
				if ( ! window.wp || ! window.wp.privateApis ) {
					setTimeout( setupPrivateApis, 10 );
					return;
				}

				const ourPrivateApis = window.wp.privateApis;

				try {
					Object.defineProperty( window.wp, 'privateApis', {
						get: function() { return ourPrivateApis; },
						set: function() { /* Prevent overwrites */ },
						configurable: false
					} );
				} catch ( e ) {
					console.warn( 'Could not protect privateApis:', e );
				}

				const { __dangerousOptInToUnstableAPIsOnlyForCoreModules } = ourPrivateApis;
				const consent = 'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.';

				__dangerousOptInToUnstableAPIsOnlyForCoreModules( consent, '@wordpress/route' );
				__dangerousOptInToUnstableAPIsOnlyForCoreModules( consent, '@wordpress/boot' );
				__dangerousOptInToUnstableAPIsOnlyForCoreModules( consent, '@wordpress/theme' );
			}

			setupPrivateApis();
		} )();
	</script>
	<?php
}
add_action( 'admin_head', 'jetpack_forms_setup_modules', 1 );

