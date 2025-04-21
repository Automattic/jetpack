<?php
/**
 * WordPress.com external connection tools.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Registers the Connections admin page.
 */
function wpcom_register_connections_page() {
	add_submenu_page(
		'tools.php',
		__( 'Connections', 'jetpack-mu-wpcom' ),
		__( 'Connections', 'jetpack-mu-wpcom' ),
		'manage_options',
		'connections',
		'wpcom_render_connections_page'
	);
}
add_action( 'admin_menu', 'wpcom_register_connections_page' );

/**
 * Renders the Connections admin page.
 */
function wpcom_render_connections_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Sorry, you are not allowed to manage connections for this site.', 'jetpack-mu-wpcom' ) );
	}

	$response = Client::wpcom_json_api_request_as_user( '/me/connections' );
	if ( is_wp_error( $response ) ) {
		wp_die( esc_html__( 'Sorry, something went wrong when fetching connections for this site.', 'jetpack-mu-wpcom' ) );
	}
	$body = json_decode( wp_remote_retrieve_body( $response ) );

	$services = array(
		array(
			'slug'        => 'google_photos',
			'name'        => __( 'Google Photos', 'jetpack-mu-wpcom' ),
			'description' => __( 'Access photos stored in your Google Photos library.', 'jetpack-mu-wpcom' ),
		),
		array(
			'slug'        => 'google_my_business',
			'name'        => __( 'Google Business Profile', 'jetpack-mu-wpcom' ),
			'description' => __( 'Connect to your Google Business Profile account.', 'jetpack-mu-wpcom' ),
		),
		array(
			'slug'        => 'google_drive',
			'name'        => __( 'Google Drive', 'jetpack-mu-wpcom' ),
			'description' => __( 'Create and access files in your Google Drive.', 'jetpack-mu-wpcom' ),
		),
		array(
			'slug'        => 'mailchimp',
			'name'        => __( 'Mailchimp', 'jetpack-mu-wpcom' ),
			'description' => __( 'Allow users to sign up to your Mailchimp mailing lists.', 'jetpack-mu-wpcom' ),
		),
		array(
			'slug'        => 'instagram',
			'name'        => __( 'Instagram', 'jetpack-mu-wpcom' ),
			'description' => __( 'Connect to use the Latest Instagram Posts block.', 'jetpack-mu-wpcom' ),
		),
	);

	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Connections', 'jetpack-mu-wpcom' ); ?></h1>
		<p><?php esc_html_e( 'Connect your site to external services.', 'jetpack-mu-wpcom' ); ?></p>
		<table class="widefat importers striped">
			<?php
			foreach ( $services as $service ) {
				$action = sprintf(
					'<a href="#">%1$s</a>',
					__( 'Connect', 'jetpack-mu-wpcom' )
				);
				?>
				<tr class='importer-item'>
					<td class='import-system'>
						<span class='importer-title'><?php echo esc_html( $service['name'] ); ?></span>
						<span class='importer-action'>
							<?php echo $action; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- we escape things above. ?>
						</span>
					</td>
					<td class='desc'>
						<span class='importer-desc'><?php echo esc_html( $service['description'] ); ?></span>
					</td>
				</tr>
				<?php
			}
			?>
		</table>
	</div>
	<?php
}
