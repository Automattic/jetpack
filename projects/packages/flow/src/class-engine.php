<?php
/**
 * Listens for triggers and runs the matching flows.
 *
 * @package automattic/jetpack-flow
 */

namespace Automattic\Jetpack\Flow;

use Automattic\Jetpack\Flow\Integrations\Form_Webhooks;
use Automattic\Jetpack\Flow\Integrations\Google_Drive;
use Automattic\Jetpack\Flow\Integrations\MailPoet_Integration;
use Automattic\Jetpack\Flow\Integrations\Post_To_Url;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Trigger listeners, payload building and action execution.
 */
class Engine {

	/**
	 * Hook up every trigger that has a WordPress action.
	 *
	 * @return void
	 */
	public static function init() {
		foreach ( Catalog::triggers() as $id => $trigger ) {
			if ( empty( $trigger['hook'] ) ) {
				continue;
			}
			add_action(
				$trigger['hook'],
				static function ( ...$args ) use ( $id ) {
					$payload = self::payload( $id, $args );
					if ( null !== $payload ) {
						self::fire( $id, $payload );
					}
				},
				(int) ( $trigger['priority'] ?? 10 ),
				(int) ( $trigger['args'] ?? 1 )
			);
		}

		add_filter( 'set_site_transient_update_plugins', array( __CLASS__, 'detect_plugin_updates' ) );
		add_filter( 'set_site_transient_update_core', array( __CLASS__, 'detect_core_update' ) );

		add_action( 'jetpack_flow_event', array( __CLASS__, 'fire' ), 10, 2 );

		add_action( 'init', array( __CLASS__, 'schedule' ) );
		add_action(
			'jetpack_flow_daily',
			static function () {
				self::fire( 'schedule_daily', array( 'date' => wp_date( get_option( 'date_format' ) ) ) );
			}
		);
	}

	/**
	 * Fire once for each plugin update WordPress has not told us about yet.
	 *
	 * @param mixed $value The update_plugins transient value being saved.
	 * @return mixed Unchanged.
	 */
	public static function detect_plugin_updates( $value ) {
		if ( ! is_object( $value ) || empty( $value->response ) ) {
			return $value;
		}

		$seen  = (array) get_option( 'jetpack_flow_seen_plugin_updates', array() );
		$fresh = array();
		foreach ( $value->response as $file => $update ) {
			$version = (string) ( $update->new_version ?? '' );
			if ( ( $seen[ $file ] ?? '' ) !== $version ) {
				$fresh[ $file ] = $version;
			}
		}
		if ( $fresh ) {
			update_option( 'jetpack_flow_seen_plugin_updates', array_merge( $seen, $fresh ), false );
			foreach ( $fresh as $file => $version ) {
				self::fire(
					'plugin_update_available',
					array(
						'plugin'  => $file,
						'version' => $version,
					)
				);
			}
		}
		return $value;
	}

	/**
	 * Fire once per new WordPress version.
	 *
	 * @param mixed $value The update_core transient value being saved.
	 * @return mixed Unchanged.
	 */
	public static function detect_core_update( $value ) {
		$offer = is_object( $value ) && ! empty( $value->updates[0] ) ? $value->updates[0] : null;
		if ( ! $offer || 'upgrade' !== ( $offer->response ?? '' ) ) {
			return $value;
		}

		$version = (string) ( $offer->current ?? '' );
		if ( '' !== $version && get_option( 'jetpack_flow_seen_core_update' ) !== $version ) {
			update_option( 'jetpack_flow_seen_core_update', $version, false );
			self::fire( 'wp_update_available', array( 'version' => $version ) );
		}
		return $value;
	}

	/**
	 * Schedule the daily trigger once.
	 *
	 * @return void
	 */
	public static function schedule() {
		if ( ! wp_next_scheduled( 'jetpack_flow_daily' ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'jetpack_flow_daily' );
		}
	}

	/**
	 * Run every enabled flow that starts with this trigger.
	 *
	 * @param string $trigger_id Trigger ID.
	 * @param array  $payload    Values available to {{tokens}}.
	 * @return void
	 */
	public static function fire( $trigger_id, $payload = array() ) {
		$flows = Flow_Store::enabled_for( $trigger_id );
		if ( ! $flows ) {
			return;
		}

		$payload = array_merge(
			array(
				'site_name' => get_bloginfo( 'name' ),
				'site_url'  => home_url(),
			),
			is_array( $payload ) ? $payload : array()
		);

		foreach ( $flows as $flow ) {
			foreach ( $flow['steps'] as $step ) {
				$result = self::run_action( $step['type'], $step['config'], $payload );
				if ( is_wp_error( $result ) ) {
					/**
					 * Fires when a Flow action fails.
					 *
					 * @since $$next-version$$
					 *
					 * @param \WP_Error $result  The error.
					 * @param array     $flow    The flow.
					 * @param array     $step    The failing step.
					 */
					do_action( 'jetpack_flow_action_failed', $result, $flow, $step );
				}
			}
		}
	}

	/**
	 * Replace {{token}} placeholders with payload values.
	 *
	 * @param string $template Text with tokens.
	 * @param array  $payload  Values.
	 * @return string
	 */
	public static function render( $template, $payload ) {
		return (string) preg_replace_callback(
			'/\{\{\s*([a-z0-9_]+)\s*\}\}/i',
			static function ( $matches ) use ( $payload ) {
				$value = $payload[ $matches[1] ] ?? '';
				return is_scalar( $value ) ? (string) $value : '';
			},
			(string) $template
		);
	}

	/**
	 * Execute one action.
	 *
	 * @param string $type    Action ID.
	 * @param array  $config  Action config, tokens not yet replaced.
	 * @param array  $payload Trigger payload.
	 * @return true|\WP_Error
	 */
	public static function run_action( $type, $config, $payload ) {
		$c = array();
		foreach ( (array) $config as $key => $value ) {
			$c[ $key ] = self::render( $value, $payload );
		}

		switch ( $type ) {
			case 'email_user':
				return self::email( $c, $payload );

			case 'webhook':
				$response = Form_Webhooks::deliver( $c['url'] ?? '', $payload, $c['method'] ?? 'POST', $c['format'] ?? 'json' );
				return self::http_result( $response );

			case 'post_to_url':
				if ( ! wp_http_validate_url( $c['url'] ?? '' ) ) {
					return new \WP_Error( 'invalid_url', __( 'Invalid URL.', 'jetpack-flow-pkg' ) );
				}
				return self::http_result( Post_To_Url::send( $c['url'], $payload, $c['format'] ?? 'json' ) );

			case 'mailpoet_subscribe':
				return MailPoet_Integration::subscribe( $c['email'] ?? '', $c['first_name'] ?? '', '', null, self::blank_to_null( $c['list_name'] ?? '' ) )
					? true
					: new \WP_Error( 'mailpoet_failed', __( 'Could not add the subscriber to MailPoet.', 'jetpack-flow-pkg' ) );

			case 'newsletter_subscribe':
				if ( ! class_exists( 'Jetpack_Subscriptions' ) ) {
					return new \WP_Error( 'jetpack_missing', __( 'Jetpack Subscriptions is not available.', 'jetpack-flow-pkg' ) );
				}
				$result = \Jetpack_Subscriptions::subscribe( $c['email'] ?? '', 0, false, array( 'source' => 'jetpack-flow' ) );
				return is_wp_error( $result ) ? $result : true;

			case 'social_share':
				$request = new \WP_REST_Request( 'POST', '/wpcom/v2/publicize/share-post/' . (int) ( $c['post_id'] ?? 0 ) );
				$request->set_body_params( array( 'message' => $c['message'] ?? '' ) );
				$response = rest_do_request( $request );
				return $response->is_error() ? $response->as_error() : true;

			case 'podcast_create_episode':
				$category = class_exists( '\Automattic\Jetpack\Podcast\Feed\Customize_Feed' ) ? \Automattic\Jetpack\Podcast\Feed\Customize_Feed::resolve_category_id() : 0;
				$content  = $c['description'] ?? '';
				if ( ! empty( $c['audio_url'] ) ) {
					$content .= "\n\n<!-- wp:audio -->\n<figure class=\"wp-block-audio\"><audio controls src=\"" . esc_url( $c['audio_url'] ) . "\"></audio></figure>\n<!-- /wp:audio -->";
				}
				$id = wp_insert_post(
					array(
						'post_title'    => $c['title'] ?? '',
						'post_content'  => $content,
						'post_status'   => 'publish' === ( $c['status'] ?? '' ) ? 'publish' : 'draft',
						'post_category' => $category > 0 ? array( $category ) : array(),
					),
					true
				);
				return is_wp_error( $id ) ? $id : true;

			case 'run_ability':
				$ability = function_exists( 'wp_get_ability' ) ? wp_get_ability( $c['ability'] ?? '' ) : null;
				if ( ! $ability ) {
					return new \WP_Error( 'unknown_ability', __( 'That ability is not available.', 'jetpack-flow-pkg' ) );
				}
				$input  = '' === trim( $c['input'] ?? '' ) ? null : json_decode( $c['input'], true );
				$result = $ability->execute( $input );
				return is_wp_error( $result ) ? $result : true;

			case 'google_sheet':
				$rows = array( array_keys( $payload ), array_map( 'strval', array_map( static fn( $v ) => is_scalar( $v ) ? $v : '', array_values( $payload ) ) ) );
				$res  = Google_Drive::create_sheet( get_current_user_id() > 0 ? get_current_user_id() : self::first_admin_id(), $c['title'] ?? 'Jetpack Flow', $rows );
				return is_wp_error( $res ) ? $res : ( $res ? true : new \WP_Error( 'sheet_failed', __( 'Could not create the sheet.', 'jetpack-flow-pkg' ) ) );

			case 'crm_add_contact':
				if ( ! function_exists( 'zeroBS_integration_addOrUpdateCustomer' ) ) {
					return new \WP_Error( 'crm_missing', __( 'Jetpack CRM is not active.', 'jetpack-flow-pkg' ) );
				}
				$contact = array(
					'email' => $c['email'] ?? '',
					'fname' => $c['first_name'] ?? '',
				);
				// @phan-suppress-next-line PhanUndeclaredFunction -- Provided by Jetpack CRM.
				zeroBS_integration_addOrUpdateCustomer( 'jetpack_flow', $contact['email'], $contact );
				return true;

			case 'create_draft':
				$id = wp_insert_post(
					array(
						'post_title'   => $c['title'] ?? '',
						'post_content' => $c['content'] ?? '',
						'post_status'  => 'draft',
					),
					true
				);
				return is_wp_error( $id ) ? $id : true;
		}

		/**
		 * Runs an action registered through the `jetpack_flow_actions` filter.
		 *
		 * @since $$next-version$$
		 *
		 * @param true|\WP_Error $result  Result, defaults to an unknown-action error.
		 * @param array          $c       Config with tokens replaced.
		 * @param array          $payload Trigger payload.
		 */
		return apply_filters( "jetpack_flow_run_action_{$type}", new \WP_Error( 'unknown_action', __( 'Unknown action.', 'jetpack-flow-pkg' ) ), $c, $payload );
	}

	/**
	 * Send the email action.
	 *
	 * @param array $c       Config with tokens replaced.
	 * @param array $payload Trigger payload.
	 * @return true|\WP_Error
	 */
	private static function email( $c, $payload ) {
		$to = array();
		switch ( $c['recipient_type'] ?? 'user' ) {
			case 'user':
				$user = get_userdata( (int) ( $c['user_id'] ?? 0 ) );
				if ( $user ) {
					$to[] = $user->user_email;
				}
				break;
			case 'role':
				foreach ( get_users( array( 'role' => sanitize_key( $c['role'] ?? '' ) ) ) as $user ) {
					$to[] = $user->user_email;
				}
				break;
			case 'trigger_email':
				$to[] = $payload['email'] ?? '';
				break;
			default:
				$to[] = $c['email'] ?? '';
		}

		$to = array_values( array_unique( array_filter( $to, 'is_email' ) ) );
		if ( ! $to ) {
			return new \WP_Error( 'no_recipient', __( 'No valid recipient for the email.', 'jetpack-flow-pkg' ) );
		}

		// Individual sends keep recipients from seeing each other.
		$sent = true;
		foreach ( $to as $address ) {
			$sent = wp_mail( $address, wp_strip_all_tags( $c['subject'] ?? '' ), $c['message'] ?? '' ) && $sent;
		}
		return $sent ? true : new \WP_Error( 'mail_failed', __( 'The email could not be sent.', 'jetpack-flow-pkg' ) );
	}

	/**
	 * Normalize an HTTP response into true or WP_Error.
	 *
	 * @param array|\WP_Error $response Response.
	 * @return true|\WP_Error
	 */
	private static function http_result( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		$code = wp_remote_retrieve_response_code( $response );
		return $code >= 200 && $code < 300 ? true : new \WP_Error( 'http_error', sprintf( /* translators: %d: HTTP status code. */ __( 'Request failed with status %d.', 'jetpack-flow-pkg' ), $code ) );
	}

	/**
	 * Empty strings become null.
	 *
	 * @param string $value Value.
	 * @return string|null
	 */
	private static function blank_to_null( $value ) {
		return '' === $value ? null : $value;
	}

	/**
	 * First administrator, for actions that need a user when run from cron.
	 *
	 * @return int
	 */
	private static function first_admin_id() {
		$admins = get_users(
			array(
				'role'   => 'administrator',
				'number' => 1,
				'fields' => 'ID',
			)
		);
		return (int) ( $admins[0] ?? 0 );
	}

	/**
	 * Turn hook arguments into token values; null skips the event.
	 *
	 * @param string $id   Trigger ID.
	 * @param array  $args Hook arguments.
	 * @return array|null
	 */
	public static function payload( $id, $args ) {
		switch ( $id ) {
			case 'form_submitted':
			case 'form_spam_caught':
				list( $post_id, , $is_spam ) = array_pad( $args, 3, null );
				if ( ( 'form_spam_caught' === $id ) !== (bool) $is_spam || ! class_exists( '\Automattic\Jetpack\Forms\ContactForm\Feedback' ) ) {
					return null;
				}
				$feedback = \Automattic\Jetpack\Forms\ContactForm\Feedback::get( $post_id );
				if ( ! $feedback ) {
					return null;
				}
				return array_merge(
					array(
						'name'       => $feedback->get_author_name(),
						'email'      => $feedback->get_author_email(),
						'message'    => (string) $feedback->get_field_value_by_label( 'Message' ),
						'form_title' => $feedback->get_entry_title(),
						'entry_url'  => get_permalink( $post_id ),
					),
					(array) $feedback->get_compiled_fields( 'webhook', 'id-value' )
				);

			case 'newsletter_subscribed':
				if ( 'success' !== ( $args[0] ?? '' ) && true !== ( $args[0] ?? null ) ) {
					return null;
				}
				// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Read-only echo of the submission that just succeeded.
				$email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
				return array( 'email' => $email );

			case 'payment_received':
			case 'woo_product_purchased':
			case 'woo_new_order':
				$order = function_exists( 'wc_get_order' ) ? wc_get_order( $args[0] ?? 0 ) : null;
				if ( ! $order ) {
					return null;
				}
				$products = array();
				foreach ( $order->get_items() as $item ) {
					$products[] = $item->get_name();
				}
				return array(
					'order_id'    => $order->get_id(),
					'order_total' => $order->get_total(),
					'currency'    => $order->get_currency(),
					'email'       => $order->get_billing_email(),
					'name'        => trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() ),
					'products'    => implode( ', ', $products ),
				);

			case 'post_published':
			case 'page_published':
			case 'podcast_episode_published':
				list( $new, $old, $post ) = array_pad( $args, 3, null );
				if ( 'publish' !== $new || 'publish' === $old || ! $post ) {
					return null;
				}
				if ( 'page_published' === $id ? 'page' !== $post->post_type : 'post' !== $post->post_type ) {
					return null;
				}
				if ( 'podcast_episode_published' === $id ) {
					$category = class_exists( '\Automattic\Jetpack\Podcast\Feed\Customize_Feed' ) ? \Automattic\Jetpack\Podcast\Feed\Customize_Feed::resolve_category_id() : 0;
					if ( $category <= 0 || ! has_category( $category, $post ) ) {
						return null;
					}
				}
				$author = get_userdata( $post->post_author );
				return array(
					'post_id'      => $post->ID,
					'post_title'   => get_the_title( $post ),
					'post_url'     => get_permalink( $post ),
					'author_name'  => $author ? $author->display_name : '',
					'author_email' => $author ? $author->user_email : '',
				);

			case 'comment_posted':
			case 'comment_held_for_spam':
			case 'comment_spam_caught':
				$comment = get_comment( $args[0] ?? 0 );
				if ( ! $comment ) {
					return null;
				}
				$is_spam = 'spam' === ( $args[1] ?? '' );
				if ( ( 'comment_posted' === $id ) === $is_spam ) {
					return null;
				}
				if ( 'comment_spam_caught' === $id && 'true' !== get_comment_meta( $comment->comment_ID, 'akismet_result', true ) ) {
					return null;
				}
				return array(
					'name'       => $comment->comment_author,
					'email'      => $comment->comment_author_email,
					'message'    => $comment->comment_content,
					'post_title' => get_the_title( $comment->comment_post_ID ),
					'post_url'   => get_permalink( $comment->comment_post_ID ),
				);

			case 'user_registered':
				$user = get_userdata( $args[0] ?? 0 );
				if ( ! $user ) {
					return null;
				}
				return array(
					'user_id'  => $user->ID,
					'name'     => $user->display_name,
					'email'    => $user->user_email,
					'username' => $user->user_login,
				);

			case 'crm_contact_created':
				return array( 'contact_id' => (int) ( $args[0] ?? 0 ) );
		}

		return array();
	}
}
