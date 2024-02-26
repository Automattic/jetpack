<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Roles;

if ( ! class_exists( 'Jetpack_SSO_User_Admin' ) ) :
	require_once JETPACK__PLUGIN_DIR . 'modules/sso/class.jetpack-sso-helpers.php';
	/**
	 * Jetpack sso user admin class.
	 */
	class Jetpack_SSO_User_Admin {

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
		 * Constructor function.
		 */
		public function __construct() {
			add_action( 'delete_user', array( 'Jetpack_SSO_Helpers', 'delete_connection_for_user' ) );
			// If the user has no errors on creation, send an invite to WordPress.com.
			add_filter( 'user_profile_update_errors', array( $this, 'send_wpcom_mail_user_invite' ), 10, 3 );
			add_filter( 'wp_send_new_user_notification_to_user', array( $this, 'should_send_wp_mail_new_user' ) );
			add_action( 'user_new_form', array( $this, 'render_invitation_email_message' ) );
			add_action( 'user_new_form', array( $this, 'render_wpcom_invite_checkbox' ), 1 );
			add_action( 'user_new_form', array( $this, 'render_custom_email_message_form_field' ), 1 );
			add_action( 'delete_user_form', array( $this, 'render_invitations_notices_for_deleted_users' ) );
			add_action( 'delete_user', array( $this, 'revoke_user_invite' ) );
			add_filter( 'manage_users_columns', array( $this, 'jetpack_user_connected_th' ) );
			add_action( 'manage_users_custom_column', array( $this, 'jetpack_show_connection_status' ), 10, 3 );
			add_action( 'user_row_actions', array( $this, 'jetpack_user_table_row_actions' ), 10, 2 );
			add_action( 'admin_notices', array( $this, 'handle_invitation_results' ) );
			add_action( 'admin_post_jetpack_invite_user_to_wpcom', array( $this, 'invite_user_to_wpcom' ) );
			add_action( 'admin_post_jetpack_revoke_invite_user_to_wpcom', array( $this, 'handle_request_revoke_invite' ) );
			add_action( 'admin_print_styles-users.php', array( $this, 'jetpack_user_table_styles' ) );
			add_action( 'admin_print_styles-user-new.php', array( $this, 'jetpack_user_new_form_styles' ) );
			add_filter( 'users_list_table_query_args', array( $this, 'set_user_query' ), 100, 1 );
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
					return self::revoke_wpcom_invite( $has_pending_invite );
				}
			} catch ( Exception $e ) {
				return false;
			}
		}

		/**
		 * Renders invitations errors/success messages in users.php.
		 */
		public function handle_invitation_results() {
			$valid_nonce = isset( $_GET['_wpnonce'] ) ? wp_verify_nonce( $_GET['_wpnonce'], 'jetpack-sso-invite-user' ) : false; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- WP core doesn't pre-sanitize nonces either.

			if ( ! $valid_nonce || ! isset( $_GET['jetpack-sso-invite-user'] ) ) {
				return;
			}
			if ( $_GET['jetpack-sso-invite-user'] === 'success' ) {
				return wp_admin_notice( __( 'User was invited successfully!', 'jetpack' ), array( 'type' => 'success' ) );
			}

			if ( $_GET['jetpack-sso-invite-user'] === 'successful-revoke' ) {
				return wp_admin_notice( __( 'User invite revoked successfully.', 'jetpack' ), array( 'type' => 'success' ) );
			}

			if ( $_GET['jetpack-sso-invite-user'] === 'failed' && isset( $_GET['jetpack-sso-invite-error'] ) ) {
				switch ( $_GET['jetpack-sso-invite-error'] ) {
					case 'invalid-user':
						return wp_admin_notice( __( 'Tried to invite a user that doesn&#8217;t exist.', 'jetpack' ), array( 'type' => 'error' ) );
					case 'invalid-email':
						return wp_admin_notice( __( 'Tried to invite a user that doesn&#8217;t have an email address.', 'jetpack' ), array( 'type' => 'error' ) );
					case 'invalid-user-permissions':
						return wp_admin_notice( __( 'You don&#8217;t have permission to invite users.', 'jetpack' ), array( 'type' => 'error' ) );
					case 'invalid-user-revoke':
						return wp_admin_notice( __( 'Tried to revoke an invite for a user that doesn&#8217;t exist.', 'jetpack' ), array( 'type' => 'error' ) );
					case 'invalid-invite-revoke':
						return wp_admin_notice( __( 'Tried to revoke an invite that doesn&#8217;t exist.', 'jetpack' ), array( 'type' => 'error' ) );
					case 'invalid-revoke-permissions':
						return wp_admin_notice( __( 'You don&#8217;t have permission to revoke invites.', 'jetpack' ), array( 'type' => 'error' ) );
					default:
						return wp_admin_notice( __( 'An error has occurred when inviting the user to the site.', 'jetpack' ), array( 'type' => 'error' ) );
				}
			}
		}

		/**
		 * Invites a user to connect to WordPress.com to allow them to log in via SSO.
		 */
		public function invite_user_to_wpcom() {
			check_admin_referer( 'jetpack-sso-invite-user', 'invite_nonce' );
			$nonce = wp_create_nonce( 'jetpack-sso-invite-user' );

			if ( ! current_user_can( 'create_users' ) ) {
				$query_params = array(
					'jetpack-sso-invite-user'  => 'failed',
					'jetpack-sso-invite-error' => 'invalid-user-permissions',
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

					return self::create_error_notice_and_redirect( $query_params );
				}

				$blog_id   = Jetpack_Options::get_option( 'id' );
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

				if ( is_wp_error( $response ) ) {
					$query_params = array(
						'jetpack-sso-invite-user'  => 'failed',
						'jetpack-sso-invite-error' => 'invalid_request',
						'_wpnonce'                 => $nonce,
					);
					return self::create_error_notice_and_redirect( $query_params );
				}

				// access the first item since we're inviting one user.
				$body = json_decode( $response['body'] )[0];

				$query_params = array(
					'jetpack-sso-invite-user' => $body->success ? 'success' : 'failed',
					'_wpnonce'                => $nonce,
				);

				if ( ! $body->success && $body->errors ) {
					$response_error                           = array_keys( (array) $body->errors );
					$query_params['jetpack-sso-invite-error'] = $response_error[0];
				}

				return self::create_error_notice_and_redirect( $query_params );
			} else {
				$query_params = array(
					'jetpack-sso-invite-user'  => 'failed',
					'jetpack-sso-invite-error' => 'invalid-user',
					'_wpnonce'                 => $nonce,
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
		public function revoke_wpcom_invite( $invite_id ) {
			$blog_id = Jetpack_Options::get_option( 'id' );

			$url      = '/sites/' . $blog_id . '/invites/delete';
			$response = Client::wpcom_json_api_request_as_user(
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

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			return array(
				'body'        => json_decode( $response['body'] ),
				'status_code' => json_decode( $response['response']['code'] ),
			);
		}

		/**
		 * Handles logic to revoke user invite.
		 */
		public function handle_request_revoke_invite() {
			check_admin_referer( 'jetpack-sso-revoke-user-invite', 'revoke_invite_nonce' );
			$nonce = wp_create_nonce( 'jetpack-sso-invite-user' );

			if ( ! current_user_can( 'promote_users' ) ) {
				$query_params = array(
					'jetpack-sso-invite-user'  => 'failed',
					'jetpack-sso-invite-error' => 'invalid-revoke-permissions',
					'_wpnonce'                 => $nonce,
				);

				return self::create_error_notice_and_redirect( $query_params );
			} elseif ( isset( $_GET['user_id'] ) ) {
				$user_id = intval( wp_unslash( $_GET['user_id'] ) );
				$user    = get_user_by( 'id', $user_id );

				if ( ! $user ) {

					$query_params = array(
						'jetpack-sso-invite-user'  => 'failed',
						'jetpack-sso-invite-error' => 'invalid-user-revoke',
						'_wpnonce'                 => $nonce,
					);

					return self::create_error_notice_and_redirect( $query_params );
				}

				if ( ! isset( $_GET['invite_id'] ) ) {
					$query_params = array(
						'jetpack-sso-invite-user'  => 'failed',
						'jetpack-sso-invite-error' => 'invalid-invite-revoke',
						'_wpnonce'                 => $nonce,
					);
					return self::create_error_notice_and_redirect( $query_params );
				}

				$invite_id = sanitize_text_field( wp_unslash( $_GET['invite_id'] ) );
				$response  = self::revoke_wpcom_invite( $invite_id );

				if ( is_wp_error( $response ) ) {
					$query_params = array(
						'jetpack-sso-invite-user'  => 'failed',
						'jetpack-sso-invite-error' => '', // general error message
						'_wpnonce'                 => $nonce,
					);
					return self::create_error_notice_and_redirect( $query_params );
				}

				$body         = $response['body'];
				$query_params = array(
					'jetpack-sso-invite-user' => $body->deleted ? 'successful-revoke' : 'failed',
					'_wpnonce'                => $nonce,
				);
				if ( ! $body->deleted ) { // no invite was deleted, probably it does not exist
					$query_params['jetpack-sso-invite-error'] = 'invalid-invite-revoke';
				}
				return self::create_error_notice_and_redirect( $query_params );
			} else {
				$query_params = array(
					'jetpack-sso-invite-user'  => 'failed',
					'jetpack-sso-invite-error' => 'invalid-user-revoke',
					'_wpnonce'                 => $nonce,
				);
				return self::create_error_notice_and_redirect( $query_params );
			}
			wp_die();
		}

		/**
		 * Adds 'Revoke invite' link to user table row actions.
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
					esc_html__( 'Revoke invite', 'jetpack' )
				);
			}

			unset( $actions['resetpassword'] );

			return $actions;
		}

		/**
		 * Render the invitation email message.
		 */
		public function render_invitation_email_message() {
			$message = wp_kses(
				__(
					'New users will receive an invite to join WordPress.com, so they can log in securely using <a class="jetpack-sso-admin-create-user-invite-message-link-sso" rel="noopener noreferrer" target="_blank" href="https://jetpack.com/support/sso/">Secure Sign On</a>.',
					'jetpack'
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
							'jetpack'
						),
						$users_with_invites
					),
					array( 'strong' => true )
				);
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
			if ( $type === 'add-new-user' ) {
				?>
				<table class="form-table">
					<tr class="form-field">
						<th scope="row">
							<label for="invite_user_wpcom"><?php esc_html_e( 'Invite user:', 'jetpack' ); ?></label>
						</th>
						<td>
							<fieldset>
								<legend class="screen-reader-text">
									<span><?php esc_html_e( 'Invite user', 'jetpack' ); ?></span>
								</legend>
								<label for="invite_user_wpcom">
									<input name="invite_user_wpcom" type="checkbox" id="invite_user_wpcom" checked>
									<?php esc_html_e( 'Invite user to WordPress.com', 'jetpack' ); ?>
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
				$valid_nonce          = isset( $_POST['_wpnonce_create-user'] ) ? wp_verify_nonce( $_POST['_wpnonce_create-user'], 'create-user' ) : false; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- WP core doesn't pre-sanitize nonces either.
				$custom_email_message = ( $valid_nonce && isset( $_POST['custom_email_message'] ) ) ? sanitize_text_field( wp_unslash( $_POST['custom_email_message'] ) ) : '';
				?>
			<table class="form-table">
				<tr class="form-field">
					<th scope="row">
						<label for="custom_email_message"><?php esc_html_e( 'Custom Message', 'jetpack' ); ?></label>
					</th>
					<td>
						<label for="custom_email_message">
							<textarea aria-describedby="custom_email_message_description" rows="3" maxlength="500" id="custom_email_message" name="custom_email_message"><?php echo esc_html( $custom_email_message ); ?></textarea>
							<p id="custom_email_message_description">
								<?php
								esc_html_e( 'This user will be invited to WordPress.com. You can include a personalized welcome message with the invitation.', 'jetpack' );
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
		 *
		 * @return boolean Indicating if the core invitation main should be sent.
		 */
		public function should_send_wp_mail_new_user() {
			return empty( $_POST['invite_user_wpcom'] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		}

		/**
		 * Send user invitation to WordPress.com if user has no errors.
		 *
		 * @param WP_Error $errors The WP_Error object.
		 * @param bool     $update Whether the user is being updated or not.
		 * @param stdClass $user   The User object about to be created.
		 * @return WP_Error The modified or not WP_Error object.
		 */
		public function send_wpcom_mail_user_invite( $errors, $update, $user ) {
			if ( ! $update ) {
				$valid_nonce = isset( $_POST['_wpnonce_create-user'] ) ? wp_verify_nonce( $_POST['_wpnonce_create-user'], 'create-user' ) : false; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- WP core doesn't pre-sanitize nonces either.

				if ( $this->should_send_wp_mail_new_user() ) {
					return $errors;
				}

				if ( $valid_nonce && ! empty( $_POST['custom_email_message'] ) && strlen( sanitize_text_field( wp_unslash( $_POST['custom_email_message'] ) ) ) > 500 ) {
					$errors->add( 'custom_email_message', __( '<strong>Error</strong>: The custom message is too long. Please keep it under 500 characters.', 'jetpack' ) );
				}

				if ( $errors->has_errors() ) {
					return $errors;
				}

				$email   = $user->user_email;
				$role    = $user->role;
				$blog_id = Jetpack_Options::get_option( 'id' );
				$url     = '/sites/' . $blog_id . '/invites/new';

				$new_user_request = array(
					'email_or_username' => $email,
					'role'              => $role,
				);

				if ( $valid_nonce && isset( $_POST['custom_email_message'] ) && strlen( sanitize_text_field( wp_unslash( $_POST['custom_email_message'] ) ) > 0 ) ) {
					$new_user_request['message'] = sanitize_text_field( wp_unslash( $_POST['custom_email_message'] ) );
				}

				$response = Client::wpcom_json_api_request_as_user(
					$url,
					'2', // Api version
					array(
						'method' => 'POST',
					),
					array(
						'invitees' => array( $new_user_request ),
					)
				);

				if ( is_wp_error( $response ) ) {
					$errors->add( 'invitation_not_sent', __( '<strong>Error</strong>: The user invitation email could not be sent, the user account was not created.', 'jetpack' ) );
				}
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
			$columns['user_jetpack'] = sprintf(
				'<span title="%1$s">%2$s [?]</span>',
				esc_attr__( 'Jetpack SSO allows a seamless and secure experience on WordPress.com. Join millions of WordPress users who trust us to keep their accounts safe.', 'jetpack' ),
				esc_html__( 'SSO Status', 'jetpack' )
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
			$blog_id = Jetpack_Options::get_option( 'id' );

			if ( self::$cached_invites === null && self::$user_search !== null ) {

				self::$cached_invites = array();

				$results = self::$user_search->get_results();

				$user_emails = array_reduce(
					$results,
					function ( $current, $item ) {
						if ( ! Jetpack::connection()->is_user_connected( $item->ID ) ) {
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

					if ( ! is_wp_error( $response ) && 200 === $response['response']['code'] ) {
						$body                 = json_decode( $response['body'], true );
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

			if ( ! empty( self::$cached_invites ) ) {
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
		 * @return {false|string} returns the user invite code if the user is invited, false otherwise.
		 */
		private static function has_pending_wpcom_invite( $user_id ) {
			$blog_id       = Jetpack_Options::get_option( 'id' );
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

			if ( is_wp_error( $response ) ) {
				return false;
			}

			if ( 200 !== $response['response']['code'] ) {
				return false;
			}

			return json_decode( $response['body'], true )['invite_code'];
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
				if ( Jetpack::connection()->is_user_connected( $user_id ) ) {
					$connection_html = sprintf(
						'<span title="%1$s" class="jetpack-sso-invitation">%2$s</span>',
						esc_attr__( 'This user is connected and can log-in to this site.', 'jetpack' ),
						esc_html__( 'Connected', 'jetpack' )
					);
					return $connection_html;
				} else {
					$has_pending_invite = self::has_pending_wpcom_invite( $user_id );
					if ( $has_pending_invite ) {
						$connection_html = sprintf(
							'<span title="%1$s" class="jetpack-sso-invitation sso-pending-invite">%2$s</span>',
							esc_attr__( 'This user didn&#8217;t accept the invitation to join this site yet.', 'jetpack' ),
							esc_html__( 'Pending invite', 'jetpack' )
						);
						return $connection_html;
					}
					$nonce           = wp_create_nonce( 'jetpack-sso-invite-user' );
					$connection_html = sprintf(
					// Using formmethod and formaction because we can't nest forms and have to submit using the main form.
						'<a href="%1$s" class="jetpack-sso-invitation sso-disconnected-user">%2$s</a><span title="%3$s" class="sso-disconnected-user-icon dashicons dashicons-warning"></span>',
						add_query_arg(
							array(
								'user_id'      => $user_id,
								'invite_nonce' => $nonce,
								'action'       => 'jetpack_invite_user_to_wpcom',
							),
							admin_url( 'admin-post.php' )
						),
						esc_html__( 'Send invite', 'jetpack' ),
						esc_attr__( 'This user doesn&#8217;t have an SSO connection to WordPress.com. Invite them to the site to increase security and improve their experience.', 'jetpack' )
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

		</style>
			<?php
		}

		/**
		 * Enqueue style for the Jetpack user new form.
		 */
		public function jetpack_user_new_form_styles() {
			// Enqueue the CSS for the admin create user page.
			wp_enqueue_style( 'jetpack-sso-admin-create-user', plugins_url( 'modules/sso/jetpack-sso-admin-create-user.css', JETPACK__PLUGIN_FILE ), array(), time() );
		}
	}
endif;
