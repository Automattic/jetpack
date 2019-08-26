<?php
/**
 * Map block.
 *
 * @since 6.8.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/map',
	array(
		'render_callback' => 'jetpack_map_block_load_assets',
	)
);

/**
 * Map block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the map block attributes.
 * @param string $content String containing the map block content.
 *
 * @return string
 */
function jetpack_map_block_load_assets( $attr, $content ) {
	$api_key = Jetpack_Options::get_option( 'mapbox_api_key' );

	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {

		$attr['api_key'] = $api_key;
		$attr['content'] = $content;

		$attr = wp_json_encode( $attr );
		$hmac = wp_hash( $attr );

		$src = add_query_arg(
			array(
				'jetpack_map_block_attr' => rawurlencode( $attr ),
				'jetpack_map_block_hmac' => rawurlencode( $hmac ),
			),
			home_url( '/' )
		);

		$placeholder = preg_replace( '/(?<=<div\s)/', 'placeholder ', $content );

		// @todo Is intrinsic size right? Is content_width the right dimensions?
		return sprintf(
			'<amp-iframe src="%s" width="%d" height="%d" layout="intrinsic" allowfullscreen sandbox="allow-scripts">%s</amp-iframe>',
			esc_url( $src ),
			Jetpack::get_content_width(),
			Jetpack::get_content_width(),
			$placeholder
		);

	} else {
		Jetpack_Gutenberg::load_assets_as_required( 'map' );

		return preg_replace( '/(?<=<div\s)/', 'data-api-key="' . esc_attr( $api_key ) . '" ', $content, 1 );
	}
}

/**
 * Render standalone document for a map block, for use inside an iframe (such as on an AMP page).
 */
function jetpack_map_block_render_standalone() {
	if ( ! isset( $_GET['jetpack_map_block_attr'] ) || ! isset( $_GET['jetpack_map_block_hmac'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}
	$hmac = wp_unslash( $_GET['jetpack_map_block_hmac'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$attr = wp_unslash( $_GET['jetpack_map_block_attr'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( wp_hash( $attr ) !== $hmac ) {
		wp_die( 'HMAC failure' );
	}
	$attr = json_decode( $attr, true );
	if ( ! is_array( $attr ) ) {
		wp_die( 'Parse error in jetpack_map_block JSON.' );
	}
	remove_theme_support( 'amp' ); // Prevent page from being served as AMP on standard-mode sites.
	?>
	<!DOCTYPE html>
	<html>
		<head>
			<style>
				html, body { margin: 0; padding: 0; }
			</style>
		</head>
		<body>
			<?php Jetpack_Gutenberg::load_assets_as_required( 'map' ); ?>
			<?php
			echo preg_replace( '/(?<=<div\s)/', 'data-api-key="' . esc_attr( $attr['api_key'] ) . '" ', $attr['content'], 1 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

			// @todo Are there non-required dependencies being added?
			wp_styles()->do_items();
			wp_scripts()->do_items();
			?>
		</body>
	</html>
	<?php
	exit;

}
add_action( 'wp', 'jetpack_map_block_render_standalone', 0 );
