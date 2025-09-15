<?php
/**
 * Jetpack's Sharing feature, nee Sharedaddy.
 * The most super duper sharing tool on the interwebs.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Set up Sharing in wp-admin.
require_once plugin_dir_path( __FILE__ ) . 'sharing.php';

/**
 * Add a meta box to the post editing screen for sharing.
 *
 * @return void
 */
function sharing_add_meta_box() {
	global $post;
	if ( empty( $post ) ) { // If a current post is not defined, such as when editing a comment.
		return;
	}

	/**
	 * Filter whether to display the Sharing Meta Box or not.
	 *
	 * @module sharedaddy
	 *
	 * @since 3.8.0
	 *
	 * @param bool true Display Sharing Meta Box.
	 * @param $post Post.
	 */
	if ( ! apply_filters( 'sharing_meta_box_show', true, $post ) ) {
		return;
	}

	$post_types = get_post_types( array( 'public' => true ) );
	/**
	 * Filter the Sharing Meta Box title.
	 *
	 * @module sharedaddy
	 *
	 * @since 2.2.0
	 *
	 * @param string $var Sharing Meta Box title. Default is "Sharing".
	 */
	$title = apply_filters( 'sharing_meta_box_title', __( 'Sharing', 'jetpack' ) );
	if ( $post->ID !== get_option( 'page_for_posts' ) ) {
		foreach ( $post_types as $post_type ) {
			add_meta_box( 'sharing_meta', $title, 'sharing_meta_box_content', $post_type, 'side', 'default', array( '__back_compat_meta_box' => true ) );
		}
	}
}

/**
 * Content of the meta box.
 *
 * @param WP_Post $post The post to share.
 *
 * @return void
 */
function sharing_meta_box_content( $post ) {
	/**
	 * Fires before the sharing meta box content.
	 *
	 * @module sharedaddy
	 *
	 * @since 2.2.0
	 *
	 * @param WP_Post $post The post to share.
	 */
	do_action( 'start_sharing_meta_box_content', $post );

	$disabled = get_post_meta( $post->ID, 'sharing_disabled', true ); ?>

	<p>
		<label for="enable_post_sharing">
			<input type="checkbox" name="enable_post_sharing" id="enable_post_sharing" value="1" <?php checked( ! $disabled ); ?>>
			<?php esc_html_e( 'Show sharing buttons.', 'jetpack' ); ?>
		</label>
		<input type="hidden" name="sharing_status_hidden" value="1" />
	</p>

	<?php
	/**
	 * Fires after the sharing meta box content.
	 *
	 * @module sharedaddy
	 *
	 * @since 2.2.0
	 *
	 * @param WP_Post $post The post to share.
	 */
	do_action( 'end_sharing_meta_box_content', $post );
}

/**
 * Save new sharing status in post meta in the meta box.
 *
 * @param int $post_id Post ID.
 *
 * @return int
 */
function sharing_meta_box_save( $post_id ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return $post_id;
	}

	if ( ! isset( $_POST['post_type'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Core takes care of the validation.
		return $post_id;
	}

	$post_type_object = get_post_type_object( sanitize_key( $_POST['post_type'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Core takes care of the validation.

	// Record sharing disable.
	if (
		$post_type_object instanceof \WP_Post_Type
		&& $post_type_object->public
		&& current_user_can( 'edit_post', $post_id )
		&& isset( $_POST['sharing_status_hidden'] ) // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Core takes care of the validation.
	) {
		if ( ! isset( $_POST['enable_post_sharing'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Core takes care of the validation.
			update_post_meta( $post_id, 'sharing_disabled', 1 );
		} else {
			delete_post_meta( $post_id, 'sharing_disabled' );
		}
	}

	return $post_id;
}

/**
 * If Sharing is disabled, disable the meta box.
 *
 * @param bool   $protected Whether the key is considered protected.
 * @param string $meta_key  Metadata key.
 *
 * @return bool
 */
function sharing_meta_box_protected( $protected, $meta_key ) {
	if ( 'sharing_disabled' === $meta_key ) {
		$protected = true;
	}

	return $protected;
}
add_filter( 'is_protected_meta', 'sharing_meta_box_protected', 10, 2 );

/**
 * Add link to sharing settings in the Plugins screen.
 *
 * @param array $links An array of plugin action links.
 *
 * @return array
 */
function sharing_plugin_settings( $links ) {
	$settings_link = '<a href="options-general.php?page=sharing.php">' . __( 'Settings', 'jetpack' ) . '</a>';
	array_unshift( $links, $settings_link );
	return $links;
}

/**
 * Add links to settings and support in the plugin row.
 *
 * @param array  $links An array of the plugin's metadata, including the version, author, author URI, and plugin URI.
 * @param string $file  Path to the plugin file relative to the plugins directory.
 *
 * @return array
 */
function sharing_add_plugin_settings( $links, $file ) {
	if ( $file === basename( __DIR__ ) . '/' . basename( __FILE__ ) ) {
		$links[] = '<a href="options-general.php?page=sharing.php">' . __( 'Settings', 'jetpack' ) . '</a>';
		$links[] = '<a href="https://support.wordpress.com/sharing/" rel="noopener noreferrer" target="_blank">' . __( 'Support', 'jetpack' ) . '</a>';
	}

	return $links;
}

/**
 * Disable sharing on the frontend if disabled in the admin.
 *
 * @return void
 */
function sharing_init() {
	if ( Jetpack_Options::get_option_and_ensure_autoload( 'sharedaddy_disable_resources', '0' ) ) {
		add_filter( 'sharing_js', '__return_false' );
		remove_action( 'wp_head', 'sharing_add_header', 1 );
	}
}

/**
 * Add settings to disable CSS and JS normally enqueued by our feature.
 *
 * @return void
 */
function sharing_global_resources() {
	$disable = get_option( 'sharedaddy_disable_resources' );
	?>
<tr valign="top">
	<th scope="row"><label for="disable_css"><?php esc_html_e( 'Disable CSS and JS', 'jetpack' ); ?></label></th>
	<td>
		<?php
		printf(
			'<input id="disable_css" type="checkbox" name="disable_resources"%1$s />  <small><em>%2$s</em></small>',
			( 1 == $disable ) ? ' checked="checked"' : '', // phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual
			esc_html__( 'Advanced. If this option is checked, you must include these files in your theme manually for the sharing links to work.', 'jetpack' )
		);
		?>
	</td>
</tr>
	<?php
}

/**
 * Save settings to disable CSS and JS normally enqueued by our feature.
 *
 * @return void
 */
function sharing_global_resources_save() {
	update_option( 'sharedaddy_disable_resources', isset( $_POST['disable_resources'] ) ? 1 : 0 ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce handling is handled for all elements at once.
}

add_action( 'init', 'sharing_init' );
add_action( 'add_meta_boxes', 'sharing_add_meta_box' );
add_action( 'save_post', 'sharing_meta_box_save' );
add_action( 'edit_attachment', 'sharing_meta_box_save' );
add_action( 'sharing_global_options', 'sharing_global_resources', 30 );
add_action( 'sharing_admin_update', 'sharing_global_resources_save' );
add_action( 'plugin_action_links_' . basename( __DIR__ ) . '/' . basename( __FILE__ ), 'sharing_plugin_settings', 10, 4 );
add_filter( 'plugin_row_meta', 'sharing_add_plugin_settings', 10, 2 );
