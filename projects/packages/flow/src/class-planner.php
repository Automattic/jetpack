<?php
/**
 * Turns a plain-language description into flows.
 *
 * @package automattic/jetpack-flow
 */

namespace Automattic\Jetpack\Flow;

use Automattic\Jetpack\Connection\Client;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Asks an AI service to map a request onto the catalog, with a keyword fallback.
 */
class Planner {

	/**
	 * Build flows from a description.
	 *
	 * @param string $prompt What the customer wants to happen.
	 * @return array { flows: array[], source: string }
	 */
	public static function plan( $prompt ) {
		$prompt = trim( wp_strip_all_tags( $prompt ) );
		$text   = self::ask_ai( $prompt );

		if ( is_string( $text ) ) {
			$flows = self::parse( $text );
			if ( $flows ) {
				return array(
					'flows'  => $flows,
					'source' => 'ai',
				);
			}
		}

		return array(
			'flows'  => self::keyword_plan( $prompt ),
			'source' => 'keywords',
		);
	}

	/**
	 * System prompt describing the catalog and the expected JSON.
	 *
	 * @return string
	 */
	private static function instructions() {
		$catalog = array(
			'triggers' => array(),
			'actions'  => array(),
		);
		foreach ( Catalog::triggers() as $id => $t ) {
			$catalog['triggers'][ $id ] = array(
				'label'  => $t['label'],
				'tokens' => $t['tokens'] ?? array(),
			);
		}
		foreach ( Catalog::actions() as $id => $a ) {
			$catalog['actions'][ $id ] = array(
				'label'  => $a['label'],
				'fields' => wp_list_pluck( $a['fields'], 'name' ),
			);
		}

		return 'You design automations for a WordPress site in the form "when X happens, do Y". '
			. 'Use ONLY the trigger and action IDs in this catalog: ' . wp_json_encode( $catalog, JSON_UNESCAPED_SLASHES ) . '. '
			. 'Reply with JSON only, no prose, with exactly ONE flow: {"flows":[{"name":"short title","trigger":"trigger_id","steps":[{"type":"action_id","config":{"field":"value"}}]}]}. '
			. 'In config text you may use {{token}} placeholders from the chosen trigger\'s tokens. '
			. 'Leave user_id empty and write sensible subject and message text.';
	}

	/**
	 * Call core's AI client, then Jetpack AI.
	 *
	 * @param string $prompt User request.
	 * @return string|null Raw model text.
	 */
	private static function ask_ai( $prompt ) {
		if ( function_exists( 'wp_ai_client_prompt' ) ) {
			try {
				$builder = wp_ai_client_prompt( $prompt );
				if ( method_exists( $builder, 'using_system_instruction' ) ) {
					$builder = $builder->using_system_instruction( self::instructions() );
				}
				$text = $builder->generate_text();
				if ( is_string( $text ) && '' !== $text ) {
					return $text;
				}
			} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
				// Fall through to Jetpack AI.
			}
		}

		if ( class_exists( Client::class ) && method_exists( Client::class, 'wpcom_json_api_request_as_user' ) ) {
			$response = Client::wpcom_json_api_request_as_user(
				'/jetpack-ai-query',
				'2',
				array(
					'method'  => 'POST',
					'timeout' => 45,
					'headers' => array( 'content-type' => 'application/json' ),
				),
				wp_json_encode(
					array(
						'messages' => array(
							array(
								'role'    => 'jetpack-ai-system',
								'content' => self::instructions(),
							),
							array(
								'role'    => 'user',
								'content' => $prompt,
							),
						),
						'feature'  => 'jetpack-flow-pkg',
						'stream'   => false,
					),
					JSON_UNESCAPED_SLASHES
				),
				'wpcom'
			);
			if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
				$body = json_decode( wp_remote_retrieve_body( $response ), true );
				return $body['choices'][0]['message']['content'] ?? null;
			}
		}

		return null;
	}

	/**
	 * Parse and validate the model reply.
	 *
	 * @param string $text Model reply.
	 * @return array[] Flows in storage shape.
	 */
	private static function parse( $text ) {
		if ( ! preg_match( '/\{.*\}/s', $text, $m ) ) {
			return array();
		}
		$data = json_decode( $m[0], true );
		if ( ! is_array( $data['flows'] ?? null ) ) {
			return array();
		}

		// One flow at a time: the dashboard edits a single flow.
		$flow = $data['flows'][0] ?? null;
		if ( ! is_array( $flow ) ) {
			return array();
		}

		$clean = Flow_Store::sanitize_one(
			array(
				'name'    => $flow['name'] ?? '',
				'enabled' => false,
				'trigger' => array( 'type' => $flow['trigger'] ?? '' ),
				'steps'   => $flow['steps'] ?? array(),
			)
		);
		return $clean ? array( $clean ) : array();
	}

	/**
	 * Offline fallback: match words in the request to catalog entries.
	 *
	 * @param string $prompt User request.
	 * @return array[]
	 */
	private static function keyword_plan( $prompt ) {
		$p = strtolower( $prompt );

		$trigger_words = array(
			'form_spam_caught'          => array( 'form spam' ),
			'comment_spam_caught'       => array( 'akismet', 'comment spam', 'held for spam' ),
			'sensei_course_completed'   => array( 'completes a course', 'course complete', 'finishes a course' ),
			'sensei_course_enrolled'    => array( 'enrol', 'sensei', 'course' ),
			'podcast_episode_published' => array( 'podcast', 'episode' ),
			'plugin_update_available'   => array( 'plugin update' ),
			'wp_update_available'       => array( 'wordpress update', 'core update' ),
			'page_published'            => array( 'new page' ),
			'site_down'                 => array( 'down', 'outage', 'offline', 'monitor' ),
			'stats_spike'               => array( 'spike', 'traffic', 'stats', 'viral' ),
			'newsletter_subscribed'     => array( 'subscri', 'newsletter' ),
			'woo_product_purchased'     => array( 'purchase', 'bought', 'product', 'order' ),
			'payment_received'          => array( 'payment', 'paid' ),
			'post_published'            => array( 'new post', 'publish' ),
			'comment_posted'            => array( 'comment' ),
			'user_registered'           => array( 'register', 'sign up', 'signup', 'new user' ),
			'form_submitted'            => array( 'form', 'contact' ),
			'schedule_daily'            => array( 'every day', 'daily' ),
		);
		$trigger       = '';
		foreach ( $trigger_words as $id => $words ) {
			foreach ( $words as $word ) {
				if ( false !== strpos( $p, $word ) ) {
					$trigger = $id;
					break 2;
				}
			}
		}
		if ( ! $trigger ) {
			return array();
		}

		$steps = array();
		if ( preg_match( '/mailpoet/', $p ) ) {
			$steps[] = array(
				'type'   => 'mailpoet_subscribe',
				'config' => array( 'email' => '{{email}}' ),
			);
		}
		if ( preg_match( '/webhook|zapier|url/', $p ) ) {
			$steps[] = array( 'type' => 'webhook' );
		}
		if ( preg_match( '/sheet/', $p ) ) {
			$steps[] = array(
				'type'   => 'google_sheet',
				'config' => array( 'title' => '{{site_name}}' ),
			);
		}
		if ( ! $steps || preg_match( '/email|mail|notify|tell|alert/', $p ) ) {
			$steps[] = array(
				'type'   => 'email_user',
				'config' => array(
					'recipient_type' => 'role',
					'role'           => 'administrator',
					'subject'        => '{{site_name}}: ' . Catalog::triggers()[ $trigger ]['label'],
					'message'        => $prompt,
				),
			);
		}

		$clean = Flow_Store::sanitize_one(
			array(
				'name'    => Catalog::triggers()[ $trigger ]['label'],
				'enabled' => false,
				'trigger' => array( 'type' => $trigger ),
				'steps'   => $steps,
			)
		);
		return $clean ? array( $clean ) : array();
	}
}
