<?php
/**
 * Manage User profile fields.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\WPCOM_User_Profile_Fields_Revert instead.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Masterbar\WPCOM_User_Profile_Fields_Revert as Masterbar_WPCOM_User_Profile_Fields_Revert;

/**
 * Responsible with preventing the back-end default implementation to save the fields that are managed on WP.com profiles.
 *
 * Class Profile_Edit_Filter_Fields
 */
class WPCOM_User_Profile_Fields_Revert {

	/**
	 * Instance of \Automattic\Jetpack\Masterbar\WPCOM_User_Profile_Fields_Revert
	 * Used for deprecation purposes.
	 *
	 * @var \Automattic\Jetpack\Masterbar\WPCOM_User_Profile_Fields_Revert
	 */
	private $wpcom_user_profile_fields_revert_wrapper;

	/**
	 * Profile_Edit_Filter_Fields constructor.
	 *
	 * @deprecated 13.7
	 *
	 * @param Connection_Manager $connection_manager The connection manager.
	 */
	public function __construct( Connection_Manager $connection_manager ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPCOM_User_Profile_Fields_Revert::__construct' );
		$this->wpcom_user_profile_fields_revert_wrapper = new Masterbar_WPCOM_User_Profile_Fields_Revert( $connection_manager );
	}

	/**
	 * Filter the built-in user profile fields.
	 *
	 * @deprecated 13.7
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
	public function revert_user_data_on_wp_admin_profile_update( $data, $update, $id ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPCOM_User_Profile_Fields_Revert::revert_user_data_on_wp_admin_profile_update' );
		return $this->wpcom_user_profile_fields_revert_wrapper->revert_user_data_on_wp_admin_profile_update( $data, $update, $id );
	}

	/**
	 * Revert the first_name, last_name and description since this is managed by WP.com.
	 *
	 * @deprecated 13.7
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
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPCOM_User_Profile_Fields_Revert::revert_user_meta_on_wp_admin_profile_change' );
		return $this->wpcom_user_profile_fields_revert_wrapper->revert_user_meta_on_wp_admin_profile_change( $meta, $user, $update );
	}

	/**
	 * Disable the e-mail notification.
	 *
	 * @deprecated 13.7
	 *
	 * @param bool  $send     Whether to send or not the email.
	 * @param array $user     User data.
	 */
	public function disable_send_email_change_email( $send, $user ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPCOM_User_Profile_Fields_Revert::disable_send_email_change_email' );
		return $this->wpcom_user_profile_fields_revert_wrapper->disable_send_email_change_email( $send, $user );
	}

	/**
	 * Disable notification on E-mail changes for Atomic WP-Admin Edit Profile. (for WP.com we use a different section for changing the E-mail).
	 *
	 * We need this because WP.org uses a custom flow for E-mail changes.
	 *
	 * @deprecated 13.7
	 *
	 * @param int $user_id The id of the user that's updated.
	 */
	public function disable_email_notification( $user_id ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPCOM_User_Profile_Fields_Revert::disable_email_notification' );
		$this->wpcom_user_profile_fields_revert_wrapper->disable_email_notification( $user_id );
	}
}
