<?php
/**
 * Extra UI elements added to the User Menu for the SSO feature.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection\SSO;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Package_Version;
use Automattic\Jetpack\Roles;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Tracking;
use WP_Error;
use WP_User;
use WP_User_Query;

/**
 * Jetpack sso user admin class.
 */
class User_Admin {
	/**
	 * Instance of WP_User_Query.
	 *
	 * @var $user_search
	 */
	private static $user_search = null;
	/**
	 * Array of cached invites.
	 *
	 * @var $cached_invites
	 */
	private static $cached_invites = null;

	/**
	 * Instance of Jetpack Tracking.
	 *
	 * @var $instance
	 */
	private static $tracking = null;

	/**
	 * Constructor function.
	 */
	public function __construct() {
		add_action( 'delete_user', array( Helpers::class, 'delete_connection_for_user' ) );
		// If the user has no errors on creation, send an invite to WordPress.com.
		add_filter( 'user_profile_update_errors', array( $this, 'send_wpcom_mail_user_invite' ), 10, 3 );
		add_filter( 'wp_send_new_user_notification_to_user', array( $this, 'should_send_wp_mail_new_user' ) );
		add_action( 'user_new_form', array( $this, 'render_invitation_email_message' ) );
		add_action( 'user_new_form', array( $this, 'render_wpcom_invite_checkbox' ), 1 );
		add_action( 'user_new_form', array( $this, 'render_wpcom_external_user_checkbox' ), 1 );
		add_action( 'user_new_form', array( $this, 'render_custom_email_message_form_field' ), 1 );
		add_action( 'delete_user_form', array( $this, 'render_invitations_notices_for_deleted_users' ) );
		add_action( 'delete_user', array( $this, 'revoke_user_invite' ) );
		add_filter( 'manage_users_columns', array( $this, 'jetpack_user_connected_th' ) );
		add_action( 'manage_users_custom_column', array( $this, 'jetpack_show_connection_status' ), 10, 3 );
		add_action( 'user_row_actions', array( $this, 'jetpack_user_table_row_actions' ), 10, 2 );
		add_action( 'admin_notices', array( $this, 'handle_invitation_results' ) );
		add_action( 'admin_post_jetpack_invite_user_to_wpcom', array( $this, 'invite_user_to_wpcom' ) );
		add_action( 'admin_post_jetpack_revoke_invite_user_to_wpcom', array( $this, 'handle_request_revoke_invite' ) );
		add_action( 'admin_post_jetpack_resend_invite_user_to_wpcom', array( $this, 'handle_request_resend_invite' ) );
		add_action( 'admin_print_styles-users.php', array( $this, 'jetpack_user_table_styles' ) );
		add_filter( 'users_list_table_query_args', array( $this, 'set_user_query' ), 100, 1 );
		add_action( 'admin_print_styles-user-new.php', array( $this, 'jetpack_new_users_styles' ) );

		self::$tracking = new Tracking();
	}

	/**
	 * Enqueue assets for user-new.php.
	 */
	public function jetpack_new_users_styles() {
		Assets::register_script(
			'jetpack-sso-admin-create-user',
			'../../dist/jetpack-sso-admin-create-user.js',
			__FILE__,
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
				'enqueue'   => true,
			)
		);
	}

	/**
	 * Intercept the arguments for building the table, and create WP_User_Query instance
	 *
	 * @param array $args The search arguments.
	 *
	 * @return array
	 */
	public function set_user_query( $args ) {
		self::$user_search = new WP_User_Query( $args );
		return $args;
	}

	/**
	 * Revokes WordPress.com invitation.
	 *
	 * @param int $user_id The user ID.
	 */
	public function revoke_user_invite( $user_id ) {
		try {
			$has_pending_invite = self::has_pending_wpcom_invite( $user_id );

			if ( $has_pending_invite ) {
				$response = self::send_revoke_wpcom_invite( $has_pending_invite );
				$event    = 'sso_user_invite_revoked';

				if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
					self::$tracking->record_user_event(
						$event,
						array(
							'success'       => 'false',
							'error_message' => 'invalid-revoke-api-error',
						)
					);
					return $response;
				}

				$body = json_decode( $response['body'] );

				if ( ! $body->deleted ) {
					self::$tracking->record_user_event(
						$event,
						array(
							'success'       => 'false',
							'error_message' => 'invalid-invite-revoke',
						)
					);
				} else {
					self::$tracking->record_user_event( $event, array( 'success' => 'true' ) );
				}

				return $response;
			} else {
				// Delete external contributor if it exists.
				$wpcom_user_data = ( new Manager() )->get_connected_user_data( $user_id );
				if ( isset( $wpcom_user_data['ID'] ) ) {
					return self::delete_external_contributor( $wpcom_user_data['ID'] );
				}
			}
		} catch ( \Exception $e ) {
			return false;
		}
	}

	/**
	 * Renders invitations errors/success messages in users.php.
	 *
	 * @phan-suppress PhanUndeclaredFunction,UnusedSuppression -- Existence of wp_admin_notice (added in WP 6.4) is checked inline.
	 * @todo Remove suppression and function_exists check when we drop support for WP 6.3.
	 */
	public function handle_invitation_results() {
		$valid_nonce = isset( $_GET['_wpnonce'] )
			? wp_verify_nonce( sanitize_key( $_GET['_wpnonce'] ), 'jetpack-sso-invite-user' )
			: false;

		if ( ! $valid_nonce || ! isset( $_GET['jetpack-sso-invite-user'] ) || ! function_exists( 'wp_admin_notice' ) ) {
			return;
		}
		if ( $_GET['jetpack-sso-invite-user'] === 'success' ) {
			return wp_admin_notice( __( 'User was invited successfully!', 'jetpack-connection' ), array( 'type' => 'success' ) );
		}
		if ( $_GET['jetpack-sso-invite-user'] === 'reinvited-success' ) {
			return wp_admin_notice( __( 'User was re-invited successfully!', 'jetpack-connection' ), array( 'type' => 'success' ) );
		}

		if ( $_GET['jetpack-sso-invite-user'] === 'successful-revoke' ) {
			return wp_admin_notice( __( 'User invite revoked successfully.', 'jetpack-connection' ), array( 'type' => 'success' ) );
		}

		if ( $_GET['jetpack-sso-invite-user'] === 'failed' && isset( $_GET['jetpack-sso-invite-error'] ) ) {
			switch ( $_GET['jetpack-sso-invite-error'] ) {
				case 'invalid-user':
					return wp_admin_notice( __( 'Tried to invite a user that doesn&#8217;t exist.', 'jetpack-connection' ), array( 'type' => 'error' ) );
				case 'invalid-email':
					return wp_admin_notice( __( 'Tried to invite a user that doesn&#8217;t have an email address.', 'jetpack-connection' ), array( 'type' => 'error' ) );
				case 'invalid-user-permissions':
					return wp_admin_notice( __( 'You don&#8217;t have permission to invite users.', 'jetpack-connection' ), array( 'type' => 'error' ) );
				case 'invalid-user-revoke':
					return wp_admin_notice( __( 'Tried to revoke an invite for a user that doesn&#8217;t exist.', 'jetpack-connection' ), array( 'type' => 'error' ) );
				case 'invalid-invite-revoke':
					return wp_admin_notice( __( 'Tried to revoke an invite that doesn&#8217;t exist.', 'jetpack-connection' ), array( 'type' => 'error' ) );
				case 'invalid-revoke-permissions':
					return wp_admin_notice( __( 'You don&#8217;t have permission to revoke invites.', 'jetpack-connection' ), array( 'type' => 'error' ) );
				case 'empty-invite':
					return wp_admin_notice( __( 'There is no previous invite for this user', 'jetpack-connection' ), array( 'type' => 'error' ) );
				case 'invalid-invite':
					return wp_admin_notice( __( 'Attempted to send a new invitation to a user using an invite that doesn&#8217;t exist.', 'jetpack-connection' ), array( 'type' => 'error' ) );
				case 'error-revoke':
					return wp_admin_notice( __( 'An error has occurred when revoking the invite for the user.', 'jetpack-connection' ), array( 'type' => 'error' ) );
				case 'invalid-revoke-api-error':
					return wp_admin_notice( __( 'An error has occurred when revoking the user invite.', 'jetpack-connection' ), array( 'type' => 'error' ) );
				default:
					return wp_admin_notice( __( 'An error has occurred when inviting the user to the site.', 'jetpack-connection' ), array( 'type' => 'error' ) );
			}
		}
	}

	/**
	 * Invites a user to connect to WordPress.com to allow them to log in via SSO.
	 */
	public function invite_user_to_wpcom() {
		check_admin_referer( 'jetpack-sso-invite-user', 'invite_nonce' );
		$nonce = wp_create_nonce( 'jetpack-sso-invite-user' );
		$event = 'sso_user_invite_sent';

		if ( ! current_user_can( 'create_users' ) ) {
			$error        = 'invalid-user-permissions';
			$query_params = array(
				'jetpack-sso-invite-user'  => 'failed',
				'jetpack-sso-invite-error' => $error,
				'_wpnonce'                 => $nonce,
			);
			return self::create_error_notice_and_redirect( $query_params );
		} elseif ( isset( $_GET['user_id'] ) ) {
			$user_id    = intval( wp_unslash( $_GET['user_id'] ) );
			$user       = get_user_by( 'id', $user_id );
			$user_email = $user->user_email;

			if ( ! $user || ! $user_email ) {
				$reason       = ! $user ? 'invalid-user' : 'invalid-email';
				$query_params = array(
					'jetpack-sso-invite-user'  => 'failed',
					'jetpack-sso-invite-error' => $reason,
					'_wpnonce'                 => $nonce,
				);

				self::$tracking->record_user_event(
					$event,
					array(
						'success'       => 'false',
						'error_message' => $reason,
					)
				);
				return self::create_error_notice_and_redirect( $query_params );
			}

			$blog_id   = Manager::get_site_id( true );
			$roles     = new Roles();
			$user_role = $roles->translate_user_to_role( $user );

			$url      = '/sites/' . $blog_id . '/invites/new';
			$response = Client::wpcom_json_api_request_as_user(
				$url,
				'v2',
				array(
					'method' => 'POST',
				),
				array(
					'invitees' => array(
						array(
							'email_or_username' => $user_email,
							'role'              => $user_role,
						),
					),
				),
				'wpcom'
			);

			if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
				$error        = 'invalid-invite-api-error';
				$query_params = array(
					'jetpack-sso-invite-user'  => 'failed',
					'jetpack-sso-invite-error' => $error,
					'_wpnonce'                 => $nonce,
				);

				self::$tracking->record_user_event(
					$event,
					array(
						'success'       => 'false',
						'error_message' => $error,
					)
				);
				return self::create_error_notice_and_redirect( $query_params );
			}

			$body = json_decode( wp_remote_retrieve_body( $response ) );

			// access the first item since we're inviting one user.
			if ( is_array( $body ) && ! empty( $body ) ) {
				$body = $body[0];
			}

			$query_params = array(
				'jetpack-sso-invite-user' => $body->success ? 'success' : 'failed',
				'_wpnonce'                => $nonce,
			);

			if ( ! $body->success && $body->errors ) {
				$response_error                           = array_keys( (array) $body->errors );
				$query_params['jetpack-sso-invite-error'] = $response_error[0];
				self::$tracking->record_user_event(
					$event,
					array(
						'success'       => 'false',
						'error_message' => $response_error[0],
					)
				);
			} else {
				self::$tracking->record_user_event( $event, array( 'success' => 'true' ) );
			}

			return self::create_error_notice_and_redirect( $query_params );
		} else {
			$error        = 'invalid-user';
			$query_params = array(
				'jetpack-sso-invite-user'  => 'failed',
				'jetpack-sso-invite-error' => $error,
				'_wpnonce'                 => $nonce,
			);
			self::$tracking->record_user_event(
				$event,
				array(
					'success'       => 'false',
					'error_message' => $error,
				)
			);
			return self::create_error_notice_and_redirect( $query_params );
		}
		wp_die();
	}

	/**
	 * Revokes a user's invitation to connect to WordPress.com.
	 *
	 * @param string $invite_id The ID of the invite to revoke.
	 */
	public function send_revoke_wpcom_invite( $invite_id ) {
		$blog_id = Manager::get_site_id( true );

		$url = '/sites/' . $blog_id . '/invites/delete';
		return Client::wpcom_json_api_request_as_user(
			$url,
			'v2',
			array(
				'method' => 'POST',
			),
			array(
				'invite_ids' => array( $invite_id ),
			),
			'wpcom'
		);
	}

	/**
	 * Handles logic to revoke user invite.
	 */
	public function handle_request_revoke_invite() {
		check_admin_referer( 'jetpack-sso-revoke-user-invite', 'revoke_invite_nonce' );
		$nonce = wp_create_nonce( 'jetpack-sso-invite-user' );
		$event = 'sso_user_invite_revoked';
		if ( ! current_user_can( 'promote_users' ) ) {
			$error        = 'invalid-revoke-permissions';
			$query_params = array(
				'jetpack-sso-invite-user'  => 'failed',
				'jetpack-sso-invite-error' => $error,
				'_wpnonce'                 => $nonce,
			);

			return self::create_error_notice_and_redirect( $query_params );
		} elseif ( isset( $_GET['user_id'] ) ) {
			$user_id = intval( wp_unslash( $_GET['user_id'] ) );
			$user    = get_user_by( 'id', $user_id );
			if ( ! $user ) {
				$error        = 'invalid-user-revoke';
				$query_params = array(
					'jetpack-sso-invite-user'  => 'failed',
					'jetpack-sso-invite-error' => $error,
					'_wpnonce'                 => $nonce,
				);

				self::$tracking->record_user_event(
					$event,
					array(
						'success'       => 'false',
						'error_message' => $error,
					)
				);
				return self::create_error_notice_and_redirect( $query_params );
			}

			if ( ! isset( $_GET['invite_id'] ) ) {
				$error        = 'invalid-invite-revoke';
				$query_params = array(
					'jetpack-sso-invite-user'  => 'failed',
					'jetpack-sso-invite-error' => $error,
					'_wpnonce'                 => $nonce,
				);
				self::$tracking->record_user_event(
					$event,
					array(
						'success'       => 'false',
						'error_message' => $error,
					)
				);
				return self::create_error_notice_and_redirect( $query_params );
			}

			$invite_id = sanitize_text_field( wp_unslash( $_GET['invite_id'] ) );
			$response  = self::send_revoke_wpcom_invite( $invite_id );

			if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
				$error        = 'invalid-revoke-api-error';
				$query_params = array(
					'jetpack-sso-invite-user'  => 'failed',
					'jetpack-sso-invite-error' => $error, // general error message
					'_wpnonce'                 => $nonce,
				);
				self::$tracking->record_user_event(
					$event,
					array(
						'success'       => 'false',
						'error_message' => $error,
					)
				);
				return self::create_error_notice_and_redirect( $query_params );
			}

			$body         = json_decode( $response['body'] );
			$query_params = array(
				'jetpack-sso-invite-user' => $body->deleted ? 'successful-revoke' : 'failed',
				'_wpnonce'                => $nonce,
			);
			if ( ! $body->deleted ) { // no invite was deleted, probably it does not exist
				$error                                    = 'invalid-invite-revoke';
				$query_params['jetpack-sso-invite-error'] = $error;
				self::$tracking->record_user_event(
					$event,
					array(
						'success'       => 'false',
						'error_message' => $error,
					)
				);
			} else {
				self::$tracking->record_user_event( $event, array( 'success' => 'true' ) );
			}
			return self::create_error_notice_and_redirect( $query_params );
		} else {
			$error        = 'invalid-user-revoke';
			$query_params = array(
				'jetpack-sso-invite-user'  => 'failed',
				'jetpack-sso-invite-error' => $error,
				'_wpnonce'                 => $nonce,
			);
			self::$tracking->record_user_event(
				$event,
				array(
					'success'       => 'false',
					'error_message' => $error,
				)
			);
			return self::create_error_notice_and_redirect( $query_params );
		}

		wp_die();
	}

	/**
	 * Handles resend user invite.
	 */
	public function handle_request_resend_invite() {
		check_admin_referer( 'jetpack-sso-resend-user-invite', 'resend_invite_nonce' );
		$nonce = wp_create_nonce( 'jetpack-sso-invite-user' );
		$event = 'sso_user_invite_resend';
		if ( ! current_user_can( 'create_users' ) ) {
			$query_params = array(
				'jetpack-sso-invite-user'  => 'failed',
				'jetpack-sso-invite-error' => 'invalid-user-permissions',
				'_wpnonce'                 => $nonce,
			);
			return self::create_error_notice_and_redirect( $query_params );
		} elseif ( isset( $_GET['invite_id'] ) ) {
			$invite_slug = sanitize_text_field( wp_unslash( $_GET['invite_id'] ) );
			$blog_id     = Manager::get_site_id( true );
			$url         = '/sites/' . $blog_id . '/invites/resend';
			$response    = Client::wpcom_json_api_request_as_user(
				$url,
				'v2',
				array(
					'method' => 'POST',
				),
				array(
					'invite_slug' => $invite_slug,
				),
				'wpcom'
			);

			$status_code = wp_remote_retrieve_response_code( $response );

			if ( 200 !== $status_code ) {
				$message_type = $status_code === 404 ? 'invalid-invite' : ''; // empty is the general error message
				$query_params = array(
					'jetpack-sso-invite-user'  => 'failed',
					'jetpack-sso-invite-error' => $message_type,
					'_wpnonce'                 => $nonce,
				);
				self::$tracking->record_user_event(
					$event,
					array(
						'success'       => 'false',
						'error_message' => $message_type,
					)
				);
				return self::create_error_notice_and_redirect( $query_params );
			}

			$body                    = json_decode( $response['body'] );
			$invite_response_message = $body->success ? 'reinvited-success' : 'failed';
			$query_params            = array(
				'jetpack-sso-invite-user' => $invite_response_message,
				'_wpnonce'                => $nonce,
			);

			if ( ! $body->success ) {
				self::$tracking->record_user_event(
					$event,
					array(
						'success'       => 'false',
						'error_message' => $invite_response_message,
					)
				);
			} else {
				self::$tracking->record_user_event( $event, array( 'success' => 'true' ) );
			}

			return self::create_error_notice_and_redirect( $query_params );
		} else {
			$error        = 'empty-invite';
			$query_params = array(
				'jetpack-sso-invite-user'  => 'failed',
				'jetpack-sso-invite-error' => 'empty-invite',
				'_wpnonce'                 => $nonce,
			);
			self::$tracking->record_user_event(
				$event,
				array(
					'success'       => 'false',
					'error_message' => $error,
				)
			);
			return self::create_error_notice_and_redirect( $query_params );
		}
	}

	/**
	 * Adds 'Revoke invite' and 'Resend invite' link to user table row actions.
	 * Removes 'Reset password' link.
	 *
	 * @param array   $actions - User row actions.
	 * @param WP_User $user_object - User object.
	 */
	public function jetpack_user_table_row_actions( $actions, $user_object ) {
		$user_id            = $user_object->ID;
		$has_pending_invite = self::has_pending_wpcom_invite( $user_id );

		if ( current_user_can( 'promote_users' ) && $has_pending_invite ) {
			$nonce                        = wp_create_nonce( 'jetpack-sso-revoke-user-invite' );
			$actions['sso_revoke_invite'] = sprintf(
				'<a class="jetpack-sso-revoke-invite-action" href="%s">%s</a>',
				add_query_arg(
					array(
						'action'              => 'jetpack_revoke_invite_user_to_wpcom',
						'user_id'             => $user_id,
						'revoke_invite_nonce' => $nonce,
						'invite_id'           => $has_pending_invite,
					),
					admin_url( 'admin-post.php' )
				),
				esc_html__( 'Revoke invite', 'jetpack-connection' )
			);
		}
		if ( current_user_can( 'promote_users' ) && $has_pending_invite ) {
			$nonce                        = wp_create_nonce( 'jetpack-sso-resend-user-invite' );
			$actions['sso_resend_invite'] = sprintf(
				'<a class="jetpack-sso-resend-invite-action" href="%s">%s</a>',
				add_query_arg(
					array(
						'action'              => 'jetpack_resend_invite_user_to_wpcom',
						'user_id'             => $user_id,
						'resend_invite_nonce' => $nonce,
						'invite_id'           => $has_pending_invite,
					),
					admin_url( 'admin-post.php' )
				),
				esc_html__( 'Resend invite', 'jetpack-connection' )
			);
		}

		if (
			current_user_can( 'promote_users' )
			&& (
				$has_pending_invite
				|| ( new Manager() )->is_user_connected( $user_id )
			)
		) {
			unset( $actions['resetpassword'] );
		}

		return $actions;
	}

	/**
	 * Render the invitation email message.
	 */
	public function render_invitation_email_message() {
		// @todo Remove function_exists check (and phan suppression below) when we drop support for WP 6.3.
		if ( ! function_exists( 'wp_admin_notice' ) ) {
			return;
		}
		$message = wp_kses(
			__(
				'We highly recommend inviting users to join WordPress.com and log in securely using <a class="jetpack-sso-admin-create-user-invite-message-link-sso" rel="noopener noreferrer" target="_blank" href="https://jetpack.com/support/sso/">Secure Sign On</a> to ensure maximum security and efficiency.',
				'jetpack-connection'
			),
			array(
				'a' => array(
					'class'  => array(),
					'href'   => array(),
					'rel'    => array(),
					'target' => array(),
				),
			)
		);
		// @phan-suppress-next-line PhanUndeclaredFunction -- Existence of wp_admin_notice (added in WP 6.4) is checked above. @phan-suppress-current-line UnusedPluginSuppression
		wp_admin_notice(
			$message,
			array(
				'id'                 => 'invitation_message',
				'type'               => 'info',
				'dismissible'        => false,
				'additional_classes' => array( 'jetpack-sso-admin-create-user-invite-message' ),
			)
		);
	}

	/**
	 * Render a note that wp.com invites will be automatically revoked.
	 */
	public function render_invitations_notices_for_deleted_users() {
		// @todo Remove function_exists check (and phan suppression below) when we drop support for WP 6.3.
		if ( ! function_exists( 'wp_admin_notice' ) ) {
			return;
		}
		check_admin_referer( 'bulk-users' );

		// When one user is deleted, the param is `user`, when multiple users are deleted, the param is `users`.
		// We start with `users` and fallback to `user`.
		$user_id  = isset( $_GET['user'] ) ? intval( wp_unslash( $_GET['user'] ) ) : null;
		$user_ids = isset( $_GET['users'] ) ? array_map( 'intval', wp_unslash( $_GET['users'] ) ) : array( $user_id );

		$users_with_invites = array_filter(
			$user_ids,
			function ( $user_id ) {
				return $user_id !== null && self::has_pending_wpcom_invite( $user_id );
			}
		);

		$users_with_invites = array_map(
			function ( $user_id ) {
				$user = get_user_by( 'id', $user_id );
				return $user->user_login;
			},
			$users_with_invites
		);

		$invites_count = count( $users_with_invites );
		if ( $invites_count > 0 ) {
			$users_with_invites = implode( ', ', $users_with_invites );
			$message            = wp_kses(
				sprintf(
				/* translators: %s is a comma-separated list of user logins. */
					_n(
						'WordPress.com invitation will be automatically revoked for user: <strong>%s</strong>.',
						'WordPress.com invitations will be automatically revoked for users: <strong>%s</strong>.',
						$invites_count,
						'jetpack-connection'
					),
					$users_with_invites
				),
				array( 'strong' => true )
			);
			// @phan-suppress-next-line PhanUndeclaredFunction -- Existence of wp_admin_notice (added in WP 6.4) is checked above. @phan-suppress-current-line UnusedPluginSuppression
			wp_admin_notice(
				$message,
				array(
					'id'                 => 'invitation_message',
					'type'               => 'info',
					'dismissible'        => false,
					'additional_classes' => array( 'jetpack-sso-admin-create-user-invite-message' ),
				)
			);
		}
	}

	/**
	 * Render WordPress.com invite checkbox for new user registration.
	 *
	 * @param string $type The type of new user form the hook follows.
	 */
	public function render_wpcom_invite_checkbox( $type ) {
		/*
		 * Only check this box by default on WordPress.com sites
		 * that do not use the WooCommerce plugin.
		 */
		$is_checked = ( new Host() )->is_wpcom_platform() && ! class_exists( 'WooCommerce' );

		if ( $type === 'add-new-user' ) {
			?>
			<table class="form-table">
				<tr class="form-field">
					<th scope="row">
						<label for="invite_user_wpcom"><?php esc_html_e( 'Invite user', 'jetpack-connection' ); ?></label>
					</th>
					<td>
						<fieldset>
							<legend class="screen-reader-text">
								<span><?php esc_html_e( 'Invite user', 'jetpack-connection' ); ?></span>
							</legend>
							<label for="invite_user_wpcom">
								<input
									name="invite_user_wpcom"
									type="checkbox"
									id="invite_user_wpcom"
									<?php checked( $is_checked ); ?>
									>
								<?php esc_html_e( 'Invite user to WordPress.com', 'jetpack-connection' ); ?>
							</label>
						</fieldset>
					</td>
				</tr>
			</table>
			<?php
		}
	}

	/**
	 * Render a checkbox to differentiate if a user is external.
	 *
	 * @param string $type The type of new user form the hook follows.
	 */
	public function render_wpcom_external_user_checkbox( $type ) {
		// Only enable this feature on WordPress.com sites.
		if ( ! ( new Host() )->is_wpcom_platform() ) {
			return;
		}

		if ( $type === 'add-new-user' ) {
			?>
			<table class="form-table">
				<tr class="form-field">
					<th scope="row">
						<label for="user_external_contractor"><?php esc_html_e( 'External User', 'jetpack-connection' ); ?></label>
					</th>
					<td>
						<fieldset>
							<legend class="screen-reader-text">
								<span><?php esc_html_e( 'Invite user', 'jetpack-connection' ); ?></span>
							</legend>
							<label for="user_external_contractor">
								<input
									name="user_external_contractor"
									type="checkbox"
									id="user_external_contractor"
									>
								<?php esc_html_e( 'This user is a contractor, freelancer, consultant, or agency.', 'jetpack-connection' ); ?>
							</label>
						</fieldset>
					</td>
				</tr>
			</table>
			<?php
		}
	}

	/**
	 * Render the custom email message form field for new user registration.
	 *
	 * @param string $type The type of new user form the hook follows.
	 */
	public function render_custom_email_message_form_field( $type ) {
		if ( $type === 'add-new-user' ) {
			$valid_nonce          = isset( $_POST['_wpnonce_create-user'] )
					? wp_verify_nonce( sanitize_key( $_POST['_wpnonce_create-user'] ), 'create-user' )
					: false;
			$custom_email_message = ( $valid_nonce && isset( $_POST['custom_email_message'] ) ) ? sanitize_text_field( wp_unslash( $_POST['custom_email_message'] ) ) : '';
			?>
			<table class="form-table" id="custom_email_message_block">
				<tr class="form-field">
					<th scope="row">
						<label for="custom_email_message"><?php esc_html_e( 'Custom Message', 'jetpack-connection' ); ?></label>
					</th>
					<td>
						<label for="custom_email_message">
							<textarea aria-describedby="custom_email_message_description" rows="3" maxlength="500" id="custom_email_message" name="custom_email_message"><?php echo esc_html( $custom_email_message ); ?></textarea>
							<p id="custom_email_message_description">
								<?php
								esc_html_e( 'This user will be invited to WordPress.com. You can include a personalized welcome message with the invitation.', 'jetpack-connection' );
								?>
						</label>
					</td>
				</tr>
			</table>
			<?php
		}
	}

	/**
	 * Conditionally disable the core invitation email.
	 * It should be sent when SSO is disabled or when admins opt-out of WordPress.com invites intentionally.
	 * If the "Send User Notification" checkbox is checked, the core invitation email should be sent.
	 *
	 * @param boolean $send_wp_email Whether the core invitation email should be sent.
	 *
	 * @return boolean Indicating if the core invitation main should be sent.
	 */
	public function should_send_wp_mail_new_user( $send_wp_email ) {
		if ( ! isset( $_POST['invite_user_wpcom'] ) && isset( $_POST['send_user_notification'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			return $send_wp_email;
		}
		return false;
	}

	/**
	 * Send user invitation to WordPress.com if user has no errors.
	 *
	 * @param WP_Error  $errors The WP_Error object.
	 * @param bool      $update Whether the user is being updated or not.
	 * @param \stdClass $user   The User object about to be created.
	 * @return WP_Error The modified or not WP_Error object.
	 */
	public function send_wpcom_mail_user_invite( $errors, $update, $user ) {
		// Only admins should be able to invite new users.
		if ( ! current_user_can( 'create_users' ) ) {
			return $errors;
		}

		if ( $update ) {
			return $errors;
		}

		// check for a valid nonce.
		if (
			! isset( $_POST['_wpnonce_create-user'] )
			|| ! wp_verify_nonce( sanitize_key( $_POST['_wpnonce_create-user'] ), 'create-user' )
		) {
			return $errors;
		}

		// Check if the user is being invited to WordPress.com.
		if ( ! isset( $_POST['invite_user_wpcom'] ) ) {
			return $errors;
		}

		// check if the custom email message is too long.
		if (
			! empty( $_POST['custom_email_message'] )
			&& strlen( sanitize_text_field( wp_unslash( $_POST['custom_email_message'] ) ) ) > 500
		) {
			$errors->add(
				'custom_email_message',
				wp_kses(
					__( '<strong>Error</strong>: The custom message is too long. Please keep it under 500 characters.', 'jetpack-connection' ),
					array(
						'strong' => array(),
					)
				)
			);
		}

		$site_id = Manager::get_site_id( true );
		if ( ! $site_id ) {
			$errors->add(
				'invalid_site_id',
				wp_kses(
					__( '<strong>Error</strong>: Invalid site ID.', 'jetpack-connection' ),
					array(
						'strong' => array(),
					)
				)
			);
		}

		// Bail if there are any errors.
		if ( $errors->has_errors() ) {
			return $errors;
		}

		$new_user_request = array(
			'email_or_username' => sanitize_email( $user->user_email ),
			'role'              => sanitize_key( $user->role ),
		);

		if (
			isset( $_POST['custom_email_message'] )
			&& strlen( sanitize_text_field( wp_unslash( $_POST['custom_email_message'] ) ) ) > 0
		) {
			$new_user_request['message'] = sanitize_text_field( wp_unslash( $_POST['custom_email_message'] ) );
		}

		if ( isset( $_POST['user_external_contractor'] ) ) {
				$new_user_request['is_external'] = true;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/invites/new',
				(int) $site_id
			),
			'2', // Api version
			array(
				'method' => 'POST',
			),
			array(
				'invitees' => array( $new_user_request ),
			)
		);

		$event_name          = 'sso_new_user_invite_sent';
		$custom_message_sent = isset( $new_user_request['message'] ) ? 'true' : 'false';

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			$errors->add(
				'invitation_not_sent',
				wp_kses(
					__( '<strong>Error</strong>: The user invitation email could not be sent, the user account was not created.', 'jetpack-connection' ),
					array(
						'strong' => array(),
					)
				)
			);
			self::$tracking->record_user_event(
				$event_name,
				array(
					'success' => 'false',
					'error'   => wp_remote_retrieve_body( $response ), // Get as much information as possible.
				)
			);
		} else {
			self::$tracking->record_user_event(
				$event_name,
				array(
					'success'             => 'true',
					'custom_message_sent' => $custom_message_sent,
				)
			);
		}

		return $errors;
	}

	/**
	 * Adds a column in the user admin table to display user connection status and actions.
	 *
	 * @param array $columns User list table columns.
	 *
	 * @return array
	 */
	public function jetpack_user_connected_th( $columns ) {
		Assets::register_script(
			'jetpack-sso-users',
			'../../dist/jetpack-sso-users.js',
			__FILE__,
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
				'enqueue'   => true,
				'version'   => Package_Version::PACKAGE_VERSION,
			)
		);

		$columns['user_jetpack'] = sprintf(
			'<span class="jetpack-sso-invitation-tooltip-icon" role="tooltip" aria-label="%3$s: %1$s" tabindex="0">%2$s [?]<span class="jetpack-sso-invitation-tooltip jetpack-sso-th-tooltip">%1$s</span></span>',
			esc_attr__( 'Jetpack SSO allows a seamless and secure experience on WordPress.com. Join millions of WordPress users who trust us to keep their accounts safe.', 'jetpack-connection' ),
			esc_html__( 'SSO Status', 'jetpack-connection' ),
			esc_attr__( 'Tooltip', 'jetpack-connection' )
		);
		return $columns;
	}

	/**
	 * Executed when our WP_User_Query instance is set, and we don't have cached invites.
	 * This function uses the user emails and the 'are-users-invited' endpoint to build the cache.
	 *
	 * @return void
	 */
	private static function rebuild_invite_cache() {
		$blog_id = Manager::get_site_id( true );

		if ( self::$cached_invites === null && self::$user_search !== null ) {

			self::$cached_invites = array();

			$results = self::$user_search->get_results();

			$user_emails = array_reduce(
				$results,
				function ( $current, $item ) {
					if ( ! ( new Manager() )->is_user_connected( $item->ID ) ) {
						$current[] = rawurlencode( $item->user_email );
					} else {
						self::$cached_invites[] = array(
							'email_or_username' => $item->user_email,
							'invited'           => false,
							'invite_code'       => '',
						);
					}
					return $current;
				},
				array()
			);

			if ( ! empty( $user_emails ) ) {
				$url = '/sites/' . $blog_id . '/invites/are-users-invited';

				$response = Client::wpcom_json_api_request_as_user(
					$url,
					'v2',
					array(
						'method' => 'POST',
					),
					array( 'users' => $user_emails ),
					'wpcom'
				);

				if ( 200 === wp_remote_retrieve_response_code( $response ) ) {
					$body = json_decode( $response['body'], true );

					// ensure array_merge happens with the right parameters
					if ( empty( $body ) ) {
						$body = array();
					}

					self::$cached_invites = array_merge( self::$cached_invites, $body );
				}
			}
		}
	}

	/**
	 * Check if there is cached invite for a user email.
	 *
	 * @access private
	 * @static
	 *
	 * @param string $email The user email.
	 *
	 * @return array|void Returns the cached invite if found.
	 */
	public static function get_pending_cached_wpcom_invite( $email ) {
		if ( self::$cached_invites === null ) {
			self::rebuild_invite_cache();
		}

		if ( ! empty( self::$cached_invites ) && is_array( self::$cached_invites ) ) {
			$index = array_search( $email, array_column( self::$cached_invites, 'email_or_username' ), true );
			if ( $index !== false ) {
				return self::$cached_invites[ $index ];
			}
		}
	}

	/**
	 * Check if a given user is invited to the site.
	 *
	 * @access private
	 * @static
	 * @param int $user_id The user ID.
	 *
	 * @return false|string returns the user invite code if the user is invited, false otherwise.
	 */
	private static function has_pending_wpcom_invite( $user_id ) {
		$blog_id       = Manager::get_site_id( true );
		$user          = get_user_by( 'id', $user_id );
		$cached_invite = self::get_pending_cached_wpcom_invite( $user->user_email );

		if ( $cached_invite ) {
			return $cached_invite['invite_code'];
		}

		$url      = '/sites/' . $blog_id . '/invites/is-invited';
		$url      = add_query_arg(
			array(
				'email_or_username' => rawurlencode( $user->user_email ),
			),
			$url
		);
		$response = Client::wpcom_json_api_request_as_user(
			$url,
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		$body_response = wp_remote_retrieve_body( $response );
		if ( empty( $body_response ) ) {
			return false;
		}

		$body = json_decode( $body_response, true );
		if ( ! empty( $body['invite_code'] ) ) {
			return $body['invite_code'];
		}

		return false;
	}

	/**
	 * Delete an external contributor from the site.
	 *
	 * @access private
	 * @static
	 * @param int $user_id The user ID.
	 *
	 * @return bool Returns true if the user was successfully deleted, false otherwise.
	 */
	private static function delete_external_contributor( $user_id ) {
		$blog_id  = Manager::get_site_id( true );
		$url      = '/sites/' . $blog_id . '/external-contributors/remove';
		$response = Client::wpcom_json_api_request_as_user(
			$url,
			'v2',
			array(
				'method' => 'POST',
			),
			array(
				'user_id' => $user_id,
			),
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Show Jetpack SSO user connection status.
	 *
	 * @param string $val HTML for the column.
	 * @param string $col User list table column.
	 * @param int    $user_id User ID.
	 *
	 * @return string
	 */
	public function jetpack_show_connection_status( $val, $col, $user_id ) {
		if ( 'user_jetpack' === $col ) {
			if ( ( new Manager() )->is_user_connected( $user_id ) ) {
				$connection_html = sprintf(
					'<span title="%1$s" class="jetpack-sso-invitation">%2$s</span>',
					esc_attr__( 'This user is connected and can log-in to this site.', 'jetpack-connection' ),
					esc_html__( 'Connected', 'jetpack-connection' )
				);
				return $connection_html;
			} else {
				$has_pending_invite = self::has_pending_wpcom_invite( $user_id );
				if ( $has_pending_invite ) {
					$connection_html = sprintf(
						'<span title="%1$s" class="jetpack-sso-invitation sso-pending-invite">%2$s</span>',
						esc_attr__( 'This user didn&#8217;t accept the invitation to join this site yet.', 'jetpack-connection' ),
						esc_html__( 'Pending invite', 'jetpack-connection' )
					);
					return $connection_html;
				}
				$nonce           = wp_create_nonce( 'jetpack-sso-invite-user' );
				$connection_html = sprintf(
				// Using formmethod and formaction because we can't nest forms and have to submit using the main form.
					'<a href="%1$s" class="jetpack-sso-invitation sso-disconnected-user">%2$s</a><span tabindex="0" role="tooltip" aria-label="%4$s: %3$s" class="sso-disconnected-user-icon dashicons dashicons-warning jetpack-sso-invitation-tooltip-icon">
						<span class="jetpack-sso-invitation-tooltip jetpack-sso-td-tooltip" tabindex="0">%3$s</span>
					</span>',
					add_query_arg(
						array(
							'user_id'      => $user_id,
							'invite_nonce' => $nonce,
							'action'       => 'jetpack_invite_user_to_wpcom',
						),
						admin_url( 'admin-post.php' )
					),
					esc_html__( 'Send invite', 'jetpack-connection' ),
					esc_attr__( 'This user doesn&#8217;t have an SSO connection to WordPress.com. Invite them to the site to increase security and improve their experience.', 'jetpack-connection' ),
					esc_attr__( 'Tooltip', 'jetpack-connection' )
				);
				return $connection_html;
			}
		}
	}

	/**
	 * Creates error notices and redirects the user to the previous page.
	 *
	 * @param array $query_params - query parameters added to redirection URL.
	 */
	public function create_error_notice_and_redirect( $query_params ) {
		$ref = wp_get_referer();
		if ( empty( $ref ) ) {
			$ref = network_admin_url( 'users.php' );
		}

		$url = add_query_arg(
			$query_params,
			$ref
		);
		return wp_safe_redirect( $url );
	}

	/**
	 * Style the Jetpack user rows and columns.
	 */
	public function jetpack_user_table_styles() {
		?>
	<style>
		#the-list tr:has(.sso-disconnected-user) {
			background: #F5F1E1;
		}
		#the-list tr:has(.sso-pending-invite) {
			background: #E9F0F5;
		}
		.fixed .column-user_jetpack {
			width: 100px;
		}
		.jetpack-sso-invitation {
			background: none;
			border: none;
			color: #50575e;
			padding: 0;
			text-align: unset;
		}
		.jetpack-sso-invitation.sso-disconnected-user {
			color: #0073aa;
			cursor: pointer;
			text-decoration: underline;
		}
		.jetpack-sso-invitation.sso-disconnected-user:hover,
		.jetpack-sso-invitation.sso-disconnected-user:focus,
		.jetpack-sso-invitation.sso-disconnected-user:active {
			color: #0096dd;
		}

		.sso-disconnected-user-icon {
			margin-left: 4px;
			cursor: pointer;
			background: gray;
			border-radius: 10px;
		}

		.sso-disconnected-user-icon.dashicons {
			font-size: 1rem;
			height: 1rem;
			width: 1rem;
			background-color: #9D6E00;
			color: #F5F1E1;
		}
		.jetpack-sso-invitation-tooltip-icon{
			position: relative;
			cursor: pointer;
		}
		.jetpack-sso-th-tooltip {
			left: -170px;
		}
		.jetpack-sso-td-tooltip {
			left: -256px;
		}
		.jetpack-sso-invitation-tooltip {
			position: absolute;
			background: #f6f7f7;
			top: -85px;
			width: 250px;
			padding: 7px;
			color: #3c434a;
			font-size: .75rem;
			line-height: 17px;
			text-align: left;
			margin: 0;
			display: none;
			border-radius: 4px;
			font-family: sans-serif;
			box-shadow: 5px 10px 10px rgba(0, 0, 0, 0.1);
		}

	</style>
		<?php
	}
}
