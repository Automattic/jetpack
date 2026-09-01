<?php
/**
 * Posts new form responses to Slack.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\Dashboard\Dashboard;

/**
 * Sends a Block Kit message to a Slack incoming webhook when a form receives a response.
 *
 * The webhook URL is the credential: anyone holding it can post to the channel it was created
 * for. It is stored per form, in the form's block attributes, which means it is readable by
 * anyone who can edit the form. That is the same exposure the existing webhooks feature has,
 * but it is why the URL is pinned to Slack's own host — a value that cannot be pointed
 * anywhere else cannot be used to reach the site's own network, and cannot quietly become an
 * exfiltration target for response data.
 */
class Slack {

	/**
	 * The only URLs accepted as a Slack webhook.
	 *
	 * Slack issues incoming webhooks on exactly this path. Pinning to it makes the field
	 * unusable for anything but Slack, which rules out SSRF without needing to reason about
	 * address ranges and DNS rebinding the way a general-purpose webhook must.
	 */
	private const WEBHOOK_URL_PATTERN = '#^https://hooks\.slack\.com/services/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+$#';

	/**
	 * Slack rejects a header longer than this.
	 */
	private const HEADER_LIMIT = 150;

	/**
	 * Slack rejects a section field longer than this.
	 */
	private const FIELD_LIMIT = 2000;

	/**
	 * Slack rejects a section body longer than this.
	 */
	private const SECTION_LIMIT = 3000;

	/**
	 * A value at or below this length is shown in the two-column grid; longer values get a
	 * block of their own so they are not truncated into uselessness.
	 */
	private const SHORT_VALUE_LENGTH = 60;

	/**
	 * Slack renders at most this many fields in one section.
	 */
	private const MAX_GRID_FIELDS = 10;

	/**
	 * Whether a string is a usable Slack incoming webhook URL.
	 *
	 * @param mixed $url The candidate URL.
	 * @return bool
	 */
	public static function is_valid_webhook_url( $url ) {
		return is_string( $url ) && (bool) preg_match( self::WEBHOOK_URL_PATTERN, trim( $url ) );
	}

	/**
	 * Post a new response to Slack.
	 *
	 * Registered as the `on_submission` callback for the Slack integration.
	 *
	 * @param array $context Submission context supplied by Integration_Dispatcher.
	 * @return void
	 */
	public static function send( array $context ) {
		$settings = isset( $context['settings'] ) ? $context['settings'] : array();
		$url      = isset( $settings['webhookUrl'] ) ? trim( (string) $settings['webhookUrl'] ) : '';

		// A form can be enabled while the URL is missing or has been edited into something
		// invalid. Nothing is sent, and nothing is logged that would leak the value.
		if ( ! self::is_valid_webhook_url( $url ) ) {
			return;
		}

		$payload = self::build_payload( $context );

		$response = wp_remote_post(
			$url,
			array(
				'timeout'     => 10,
				'redirection' => 0,
				'headers'     => array( 'Content-Type' => 'application/json' ),
				'body'        => wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			)
		);

		self::record_result( $context['post_id'], $response );
	}

	/**
	 * Build the Block Kit message for a response.
	 *
	 * @param array $context Submission context.
	 * @return array The Slack message payload.
	 */
	private static function build_payload( array $context ) {
		$settings   = $context['settings'];
		$feedback   = $context['feedback'];
		$form       = $context['form'];
		$post_id    = $context['post_id'];
		$form_title = self::get_form_title( $form );

		$response_url = Dashboard::get_single_response_admin_url( $post_id );

		/* translators: %s is the title of the form that received a response. */
		$heading = sprintf( __( 'New response: %s', 'jetpack-forms' ), $form_title );

		$blocks = array(
			array(
				'type' => 'header',
				'text' => array(
					'type' => 'plain_text',
					'text' => self::truncate( $heading, self::HEADER_LIMIT ),
				),
			),
		);

		// Sending the response itself is opt-out per form: form responses routinely carry
		// personal data, and copying it into Slack puts it under different retention and
		// access rules than the site's own.
		$include_content = ! isset( $settings['includeContent'] ) || (bool) $settings['includeContent'];

		if ( $include_content ) {
			$blocks = array_merge( $blocks, self::build_field_blocks( $feedback ) );
		}

		$blocks[] = array(
			'type'     => 'actions',
			'elements' => array(
				array(
					'type'  => 'button',
					'text'  => array(
						'type' => 'plain_text',
						'text' => __( 'View response', 'jetpack-forms' ),
					),
					'url'   => $response_url,
					'style' => 'primary',
				),
			),
		);

		$blocks[] = array(
			'type'     => 'context',
			'elements' => array(
				array(
					'type' => 'mrkdwn',
					'text' => sprintf(
						'%s · %s',
						self::escape( wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ) ),
						self::escape( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ) ) )
					),
				),
			),
		);

		return array(
			// Shown in notifications and by clients that cannot render blocks.
			'text'   => self::truncate( $heading, self::SECTION_LIMIT ),
			'blocks' => $blocks,
		);
	}

	/**
	 * Turn a response's answers into Block Kit blocks.
	 *
	 * Short answers are grouped into a two-column grid; anything longer gets its own block so
	 * it stays readable.
	 *
	 * @param object $feedback The Feedback object for the response.
	 * @return array Block Kit blocks.
	 */
	private static function build_field_blocks( $feedback ) {
		$blocks = array();
		$grid   = array();

		foreach ( (array) $feedback->get_compiled_fields( 'email', 'label|value' ) as $field ) {
			$label = isset( $field['label'] ) ? (string) $field['label'] : '';
			$value = isset( $field['value'] ) ? $field['value'] : '';

			if ( is_array( $value ) ) {
				$value = implode( ', ', array_map( 'strval', $value ) );
			}

			$value = trim( (string) $value );

			if ( '' === $value ) {
				continue;
			}

			$rendered = sprintf( "*%s*\n%s", self::escape( $label ), self::escape( $value ) );

			if ( mb_strlen( $value ) <= self::SHORT_VALUE_LENGTH && count( $grid ) < self::MAX_GRID_FIELDS ) {
				$grid[] = array(
					'type' => 'mrkdwn',
					'text' => self::truncate( $rendered, self::FIELD_LIMIT ),
				);
				continue;
			}

			$blocks[] = array(
				'type' => 'section',
				'text' => array(
					'type' => 'mrkdwn',
					'text' => self::truncate( $rendered, self::SECTION_LIMIT ),
				),
			);
		}

		if ( $grid ) {
			// The grid renders before the long-form answers, matching the order fields are
			// usually laid out: short identifying answers first, then the message body.
			array_unshift(
				$blocks,
				array(
					'type'   => 'section',
					'fields' => $grid,
				)
			);
		}

		return $blocks;
	}

	/**
	 * The title to show for a form.
	 *
	 * @param object $form The Contact_Form the response belongs to.
	 * @return string
	 */
	private static function get_form_title( $form ) {
		$title = isset( $form->attributes['formTitle'] ) ? trim( (string) $form->attributes['formTitle'] ) : '';

		if ( '' !== $title ) {
			return $title;
		}

		return __( 'Untitled form', 'jetpack-forms' );
	}

	/**
	 * Escape the three characters Slack treats as markup.
	 *
	 * @param string $text Raw text.
	 * @return string
	 */
	private static function escape( $text ) {
		return str_replace( array( '&', '<', '>' ), array( '&amp;', '&lt;', '&gt;' ), (string) $text );
	}

	/**
	 * Shorten text to fit one of Slack's limits.
	 *
	 * @param string $text  Text to shorten.
	 * @param int    $limit Maximum length Slack accepts.
	 * @return string
	 */
	private static function truncate( $text, $limit ) {
		if ( mb_strlen( $text ) <= $limit ) {
			return $text;
		}

		return mb_substr( $text, 0, $limit - 1 ) . '…';
	}

	/**
	 * Record whether the message went out, for stats and for debugging a silent integration.
	 *
	 * @param int            $post_id  Feedback post ID.
	 * @param array|WP_Error $response The result of the request to Slack.
	 * @return void
	 */
	private static function record_result( $post_id, $response ) {
		if ( is_wp_error( $response ) ) {
			update_post_meta( $post_id, '_jetpack_forms_slack_error', sanitize_text_field( $response->get_error_message() ) );
			/** This action is documented in src/service/class-form-webhooks.php */
			do_action( 'jetpack_bump_stats_extras', 'jetpack_forms_slack_request', 'error' );
			return;
		}

		$code = wp_remote_retrieve_response_code( $response );

		if ( $code >= 200 && $code < 300 ) {
			delete_post_meta( $post_id, '_jetpack_forms_slack_error' );
			/** This action is documented in src/service/class-form-webhooks.php */
			do_action( 'jetpack_bump_stats_extras', 'jetpack_forms_slack_request', 'success' );
			return;
		}

		// Slack answers a bad or revoked webhook with a short plain-text reason such as
		// "no_service" or "invalid_payload", which is what someone debugging needs to see.
		update_post_meta(
			$post_id,
			'_jetpack_forms_slack_error',
			sanitize_text_field( sprintf( 'HTTP %d: %s', $code, wp_remote_retrieve_body( $response ) ) )
		);
		/** This action is documented in src/service/class-form-webhooks.php */
		do_action( 'jetpack_bump_stats_extras', 'jetpack_forms_slack_request', 'failed' );
	}
}
