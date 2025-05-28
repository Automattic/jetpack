<?php
/**
 * Banner connecting Pages screen to homepage editing.
 *
 * Displays a banner in the Pages admin list to help users navigate to homepage editing.
 * This addresses user confusion about where to edit their homepage when it's controlled by theme settings.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Adds a connection banner to the Pages screen linking to homepage editing.
 */
function wpcom_add_pages_homepage_connection_banner() {
	$screen = get_current_screen();
	if ( ! $screen || ! wp_is_block_theme() ) {
		return;
	}

	$is_edit_page_screen   = 'edit-page' === $screen->id;
	$is_site_editor_screen = 'site-editor' === $screen->id;

	if ( ! $is_edit_page_screen && ! $is_site_editor_screen ) {
		return;
	}

	$show_on_front  = get_option( 'show_on_front' );
	$front_page_id  = (int) get_option( 'page_on_front' );
	$posts_on_front = $show_on_front === 'posts' || ( $show_on_front === 'page' && ! $front_page_id );
	if ( ! $posts_on_front ) {
		return;
	}

	wp_register_style(
		'wpcom-pages-homepage-connection-banner',
		plugin_dir_url( __FILE__ ) . 'css/pages-homepage-connection-banner.css',
		array(),
		'20250527'
	);
	wp_enqueue_style( 'wpcom-pages-homepage-connection-banner' );

	$can_edit       = current_user_can( 'edit_theme_options' );
	$localized_data = array(
		'text'     => esc_html( __( 'Looking to customize your homepage?', 'jetpack-mu-wpcom' ) ),
		'editLink' => $can_edit ? esc_url( admin_url( 'site-editor.php' ) ) : '',
		'editText' => esc_html__( 'Edit homepage', 'jetpack-mu-wpcom' ),
		'canEdit'  => $can_edit,
		'screenId' => esc_html( $screen->id ),
	);

	add_action(
		'admin_footer',
		function () use ( $localized_data ) {
			?>
		<script type="text/javascript">
			window.wpcomPagesHomepageConnectionBanner = <?php echo wp_json_encode( $localized_data ); ?>;
		</script>
			<?php
		},
		1
	);

	wp_register_script_module(
		'wpcom-tracks-module',
		plugin_dir_url( __FILE__ ) . '../../common/tracks.js',
		array(),
		'20250527',
		true
	);

	wp_enqueue_script_module(
		'wpcom-pages-homepage-connection-banner',
		plugin_dir_url( __FILE__ ) . 'js/pages-homepage-connection-banner.js',
		array( 'wpcom-tracks-module', 'jquery' ),
		'20250527',
		true
	);
}

add_action( 'current_screen', 'wpcom_add_pages_homepage_connection_banner' );
