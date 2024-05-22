<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Extra UI elements added to the User Menu for the SSO feature.
 *
 * @deprecated 13.5 Use Automattic\Jetpack\Connection\Manager\SSO instead.
 *
 * phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
 *
 * @package automattic/jetpack
 */

if ( ! class_exists( 'Jetpack_SSO_User_Admin' ) ) :
	/**
	 * Jetpack sso user admin class.
	 *
	 * @deprecated 13.5
	 */
	class Jetpack_SSO_User_Admin {
		/**
		 * Constructor function.
		 *
		 * @deprecated 13.5
		 */
		public function __construct() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin' );
		}

		/**
		 * Enqueue assets for user-new.php.
		 *
		 * @deprecated 13.5
		 */
		public function jetpack_new_users_styles() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->jetpack_new_users_styles' );
		}

		/**
		 * Intercept the arguments for building the table, and create WP_User_Query instance
		 *
		 * @deprecated 13.5
		 *
		 * @param array $args The search arguments.
		 */
		public function set_user_query( $args ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->set_user_query' );
		}

		/**
		 * Revokes WordPress.com invitation.
		 *
		 * @deprecated 13.5
		 *
		 * @param int $user_id The user ID.
		 */
		public function revoke_user_invite( $user_id ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->revoke_user_invite' );
		}

		/**
		 * Renders invitations errors/success messages in users.php.
		 *
		 * @deprecated 13.5
		 */
		public function handle_invitation_results() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->handle_invitation_results' );
		}

		/**
		 * Invites a user to connect to WordPress.com to allow them to log in via SSO.
		 *
		 * @deprecated 13.5
		 */
		public function invite_user_to_wpcom() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->invite_user_to_wpcom' );
		}

		/**
		 * Revokes a user's invitation to connect to WordPress.com.
		 *
		 * @deprecated 13.5
		 *
		 * @param string $invite_id The ID of the invite to revoke.
		 */
		public function send_revoke_wpcom_invite( $invite_id ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->send_revoke_wpcom_invite' );
		}

		/**
		 * Handles logic to revoke user invite.
		 *
		 * @deprecated 13.5
		 */
		public function handle_request_revoke_invite() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->handle_request_revoke_invite' );
		}

		/**
		 * Handles resend user invite.
		 *
		 * @deprecated 13.5
		 */
		public function handle_request_resend_invite() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->handle_request_resend_invite' );
		}

		/**
		 * Adds 'Revoke invite' and 'Resend invite' link to user table row actions.
		 * Removes 'Reset password' link.
		 *
		 * @deprecated 13.5
		 *
		 * @param array   $actions - User row actions.
		 * @param WP_User $user_object - User object.
		 */
		public function jetpack_user_table_row_actions( $actions, $user_object ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->jetpack_user_table_row_actions' );
		}

		/**
		 * Render the invitation email message.
		 *
		 * @deprecated 13.5
		 */
		public function render_invitation_email_message() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->render_invitation_email_message' );
		}

		/**
		 * Render a note that wp.com invites will be automatically revoked.
		 *
		 * @deprecated 13.5
		 */
		public function render_invitations_notices_for_deleted_users() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->render_invitations_notices_for_deleted_users' );
		}

		/**
		 * Render WordPress.com invite checkbox for new user registration.
		 *
		 * @deprecated 13.5
		 *
		 * @param string $type The type of new user form the hook follows.
		 */
		public function render_wpcom_invite_checkbox( $type ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->render_wpcom_invite_checkbox' );
		}

		/**
		 * Render a checkbox to differentiate if a user is external.
		 *
		 * @deprecated 13.5
		 *
		 * @param string $type The type of new user form the hook follows.
		 */
		public function render_wpcom_external_user_checkbox( $type ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->render_wpcom_external_user_checkbox' );
		}

		/**
		 * Render the custom email message form field for new user registration.
		 *
		 * @deprecated 13.5
		 *
		 * @param string $type The type of new user form the hook follows.
		 */
		public function render_custom_email_message_form_field( $type ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->render_custom_email_message_form_field' );
		}

		/**
		 * Conditionally disable the core invitation email.
		 * It should be sent when SSO is disabled or when admins opt-out of WordPress.com invites intentionally.
		 * If the "Send User Notification" checkbox is checked, the core invitation email should be sent.
		 *
		 * @deprecated 13.5
		 *
		 * @param boolean $send_wp_email Whether the core invitation email should be sent.
		 */
		public function should_send_wp_mail_new_user( $send_wp_email ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->should_send_wp_mail_new_user' );
		}

		/**
		 * Send user invitation to WordPress.com if user has no errors.
		 *
		 * @deprecated 13.5
		 *
		 * @param WP_Error $errors The WP_Error object.
		 * @param bool     $update Whether the user is being updated or not.
		 * @param stdClass $user   The User object about to be created.
		 */
		public function send_wpcom_mail_user_invite( $errors, $update, $user ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->send_wpcom_mail_user_invite' );
		}

		/**
		 * Adds a column in the user admin table to display user connection status and actions.
		 *
		 * @deprecated 13.5
		 *
		 * @param array $columns User list table columns.
		 */
		public function jetpack_user_connected_th( $columns ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->jetpack_user_connected_th' );
		}

		/**
		 * Check if there is cached invite for a user email.
		 *
		 * @access private
		 * @static
		 *
		 * @deprecated 13.5
		 *
		 * @param string $email The user email.
		 */
		public static function get_pending_cached_wpcom_invite( $email ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->get_pending_cached_wpcom_invite' );
		}

		/**
		 * Show Jetpack SSO user connection status.
		 *
		 * @deprecated 13.5
		 *
		 * @param string $val HTML for the column.
		 * @param string $col User list table column.
		 * @param int    $user_id User ID.
		 */
		public function jetpack_show_connection_status( $val, $col, $user_id ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->jetpack_show_connection_status' );
		}

		/**
		 * Creates error notices and redirects the user to the previous page.
		 *
		 * @deprecated 13.5
		 *
		 * @param array $query_params - query parameters added to redirection URL.
		 */
		public function create_error_notice_and_redirect( $query_params ) {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->create_error_notice_and_redirect' );
		}

		/**
		 * Style the Jetpack user rows and columns.
		 *
		 * @deprecated 13.5
		 */
		public function jetpack_user_table_styles() {
			_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\SSO\\User_Admin->jetpack_user_table_styles' );
		}
	}
endif;
