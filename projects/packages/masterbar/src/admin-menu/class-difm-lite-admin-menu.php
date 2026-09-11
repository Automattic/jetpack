<?php
/**
 * DIFM Lite (Express) Admin Menu file.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class DIFM_Lite_Admin_Menu.
 *
 * The admin menu shown while a DIFM Express build is still awaiting the
 * customer's content. It is the domain-only menu plus Posts, Media and Pages:
 * the customer needs to read their existing content to fill in the content
 * form, but the site is otherwise locked for the duration of the build.
 *
 * Once the content is submitted the build is under way and
 * Domain_Only_Admin_Menu applies instead.
 */
class DIFM_Lite_Admin_Menu extends Domain_Only_Admin_Menu {
	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		parent::reregister_menu_items();

		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr__( 'Posts', 'jetpack-masterbar' ), __( 'Posts', 'jetpack-masterbar' ), 'edit_posts', 'edit.php', null, 'dashicons-admin-post' );
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr__( 'Media', 'jetpack-masterbar' ), __( 'Media', 'jetpack-masterbar' ), 'upload_files', 'upload.php', null, 'dashicons-admin-media' );
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_menu_page( esc_attr__( 'Pages', 'jetpack-masterbar' ), __( 'Pages', 'jetpack-masterbar' ), 'edit_pages', 'edit.php?post_type=page', null, 'dashicons-admin-page' );
	}
}
