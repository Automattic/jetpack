<?php
/**
 * Manage User profile fields.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Responsible with preventing the back-end default implementation to save the fields that are managed on WP.com profiles.
 *
 * Class Profile_Edit_Filter_Fields
 */
class WPCOM_User_Profile_Fields_Revert {

	/**
	 * Jetpack connection manager object.
	 *
	 * @var Connection_Manager
	 */
	private $connection_manager;

	/**
	 * Profile_Edit_Filter_Fields constructor.
	 *
	 * @param string             $current_page The current page slug.
	 * @param Connection_Manager $connection_manager The connection manager.
	 */
	public function __construct( $current_page, Connection_Manager $connection_manager ) {
		// We'll apply this filter only on profile edit page to be sure we limit the impact of the change.
		if ( 'user-edit.php' !== $current_page && 'profile.php' !== $current_page ) {
			return;
		}

		$this->connection_manager = $connection_manager;

		\add_filter( 'wp_pre_insert_user_data', array( $this, 'revert_display_name_on_wp_admin_profile_update' ), 10, 3 );
		\add_filter( 'insert_user_meta', array( $this, 'revert_user_meta_on_wp_admin_profile_change' ), 10, 3 );
	}

	/**
	 * Filter the built-in user profile fields.
	 *
	 * @param array    $data            {
	 *                                  Values and keys for the user.
	 *
	 * @type string    $user_login      The user's login. Only included if $update == false
	 * @type string    $user_pass       The user's password.
	 * @type string    $user_email      The user's email.
	 * @type string    $user_url        The user's url.
	 * @type string    $user_nicename   The user's nice name. Defaults to a URL-safe version of user's login
	 * @type string    $display_name    The user's display name.
	 * @type string    $user_registered MySQL timestamp describing the moment when the user registered. Defaults to
	 *                                   the current UTC timestamp.
	 * }
	 *
	 * @param bool     $update          Whether the user is being updated rather than created.
	 * @param int|null $id              ID of the user to be updated, or NULL if the user is being created.
	 *
	 * @return array
	 */
	public function revert_display_name_on_wp_admin_profile_update( $data, $update, $id ) {

		// bail if the id is null, meaning that this was triggered in the context of user create.
		// bail if the user is not connected (e.g. non-WP.com users or disconnected users).
		if ( ! $update || null === $id || ! $this->connection_manager->is_user_connected( $id ) ) {
			return $data;
		}

		/**
		 * Revert the data in the form submission with the data from the database.
		 */
		$user = \get_userdata( $id );

		$data['user_email']    = $user->user_email;
		$data['user_url']      = $user->user_url;
		$data['user_nicename'] = $user->user_nicename;
		$data['display_name']  = $user->display_name;

		return $data;
	}

	/**
	 * Revert the first_name, last_name and description since this is managed by WP.com.
	 *
	 * @param array    $meta {
	 *        Default meta values and keys for the user.
	 *
	 *     @type string   $nickname             The user's nickname. Default is the user's username.
	 *     @type string   $first_name           The user's first name.
	 *     @type string   $last_name            The user's last name.
	 *     @type string   $description          The user's description.
	 *     @type string   $rich_editing         Whether to enable the rich-editor for the user. Default 'true'.
	 *     @type string   $syntax_highlighting  Whether to enable the rich code editor for the user. Default 'true'.
	 *     @type string   $comment_shortcuts    Whether to enable keyboard shortcuts for the user. Default 'false'.
	 *     @type string   $admin_color          The color scheme for a user's admin screen. Default 'fresh'.
	 *     @type int|bool $use_ssl              Whether to force SSL on the user's admin area. 0|false if SSL
	 *                                          is not forced.
	 *     @type string   $show_admin_bar_front Whether to show the admin bar on the front end for the user.
	 *                                          Default 'true'.
	 *     @type string   $locale               User's locale. Default empty.
	 * }
	 * @param \WP_User $user   User object.
	 * @param bool     $update Whether the user is being updated rather than created.
	 *
	 * @return array
	 */
	public function revert_user_meta_on_wp_admin_profile_change( $meta, $user, $update ) {

		// bail if not in update context.
		if ( ! $update || ! $this->connection_manager->is_user_connected( $user->ID ) ) {
			return $meta;
		}

		/**
		 * Revert the data in the form submission with the data from the database.
		 */
		$database_user = \get_userdata( $user->ID );

		$meta['first_name']  = $database_user->first_name;
		$meta['last_name']   = $database_user->last_name;
		$meta['description'] = $database_user->description;
		$meta['nickname']    = $database_user->nickname;

		return $meta;
	}
}
