<?php
/**
 * Jetpack Activity Log Abilities Registration.
 *
 * Registers Jetpack Activity Log abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-activity-log
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Activity_Log\Abilities;

use Automattic\Jetpack\Activity_Log\REST_Controller;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;
use WP_REST_Request;

/**
 * Registers Jetpack Activity Log abilities with the WordPress Abilities API.
 *
 * Exposes a single consolidated read (`list-events`) that wraps the
 * `GET /jetpack/v4/activity-log` proxy so AI agents can answer
 * "what happened on my site?" through the standard `wp-abilities/v1`
 * REST surface. Detail-lookup is folded into `list-events` via the
 * optional `event_id` filter — passing it returns a 0- or 1-element
 * array, so a single ability covers both list and detail views.
 *
 * Execution delegates to `rest_do_request()` against the existing
 * `/jetpack/v4/activity-log` route, so abilities inherit the REST
 * controller's permission check, free-tier clamp, and WPCOM proxy
 * path. No duplicate auth surface.
 */
class Activity_Log_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-activity-log';
	const ERROR_PREFIX  = 'jetpack_activity_log_';

	/**
	 * REST route backing the list ability. Same path the admin UI hits.
	 */
	const REST_ROUTE = '/jetpack/v4/activity-log';

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack" is a product name and should not be translated.
			'label'       => 'Jetpack Activity Log',
			'description' => __( 'Abilities for reading Jetpack Activity Log events.', 'jetpack-activity-log' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-activity-log/list-events' => self::spec_list_events(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-activity-log/list-events.
	 *
	 * Consolidated read: list + detail in one ability. Passing `event_id`
	 * filters the response to a 0- or 1-element array; unknown ids return
	 * `[]` rather than an error so callers can chain `list -> detail`
	 * without branching on existence.
	 */
	private static function spec_list_events(): array {
		return array(
			'label'               => __( 'List activity log events', 'jetpack-activity-log' ),
			'description'         => __(
				'List Jetpack Activity Log events with optional filters. Answers "what happened on my site (and when)?" — surfaces published events with actor, summary, and timestamp. Pass `event_id` to fetch a single event by id (returns a 0- or 1-element array, [] when the id is unknown). Each entry: { id, group, action, name, summary, actor: { id, display_name, role }, timestamp, gridicon, object, target }. Filters: `group` (event group slug like "post" / "plugin"), `action` (specific event action slug), `date_from` / `date_to` (ISO8601 timestamps), `page` / `per_page` (pagination, per_page max 100). Read-only. Precondition: the site must be connected to WordPress.com and the current user must be a connected admin; on a free-tier plan results are clamped to the 20 most recent events.',
				'jetpack-activity-log'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'group'     => array(
						'type'        => 'string',
						'description' => __( 'Filter to a single event group (e.g. "post", "plugin", "user").', 'jetpack-activity-log' ),
					),
					'action'    => array(
						'type'        => 'string',
						'description' => __( 'Filter to a single event action slug (e.g. "post__published").', 'jetpack-activity-log' ),
					),
					'date_from' => array(
						'type'        => 'string',
						'description' => __( 'ISO8601 lower bound on event timestamp.', 'jetpack-activity-log' ),
						'format'      => 'date-time',
					),
					'date_to'   => array(
						'type'        => 'string',
						'description' => __( 'ISO8601 upper bound on event timestamp.', 'jetpack-activity-log' ),
						'format'      => 'date-time',
					),
					'page'      => array(
						'type'        => 'integer',
						'description' => __( '1-indexed page number.', 'jetpack-activity-log' ),
						'minimum'     => 1,
						'default'     => 1,
					),
					'per_page'  => array(
						'type'        => 'integer',
						'description' => __( 'Number of events per page (max 100).', 'jetpack-activity-log' ),
						'minimum'     => 1,
						'maximum'     => 100,
						'default'     => 20,
					),
					'event_id'  => array(
						'type'        => 'integer',
						'description' => __( 'Fetch a single event by id. Returns a 0- or 1-element array.', 'jetpack-activity-log' ),
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'  => 'array',
				'items' => array(
					'type'       => 'object',
					'properties' => array(
						'id'        => array( 'type' => array( 'integer', 'string' ) ),
						'group'     => array( 'type' => 'string' ),
						'action'    => array( 'type' => 'string' ),
						'name'      => array( 'type' => 'string' ),
						'summary'   => array( 'type' => 'string' ),
						'actor'     => array( 'type' => array( 'object', 'null' ) ),
						'timestamp' => array( 'type' => array( 'string', 'null' ) ),
						'gridicon'  => array( 'type' => array( 'string', 'null' ) ),
						'object'    => array( 'type' => array( 'object', 'null' ) ),
						'target'    => array( 'type' => array( 'object', 'null' ) ),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'list_events' ),
			'permission_callback' => array( __CLASS__, 'can_view_activity_log' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Permission check: can the current user read the Activity Log?
	 *
	 * Mirrors `REST_Controller::permissions_callback()`: any admin with a
	 * user-level WPCOM connection. The user-level requirement is
	 * load-bearing because the upstream WPCOM endpoint is user-gated.
	 *
	 * @return bool
	 */
	public static function can_view_activity_log(): bool {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}
		return ( new Connection_Manager() )->is_user_connected();
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: list-events.
	 *
	 * Dispatches an internal `GET /jetpack/v4/activity-log` request so the
	 * abilities ride on the existing free-tier clamp and WPCOM proxy. The
	 * upstream activity envelope (`{ current: { orderedItems: [...] } }`)
	 * is reshaped into a flat array of compact entries.
	 *
	 * `event_id`, `action`, and `date_from`/`date_to` are not part of the
	 * upstream `/jetpack/v4/activity-log` query surface — they're applied
	 * client-side after the proxy returns. That keeps the upstream
	 * contract unchanged and matches how the admin UI uses these filters.
	 *
	 * @param array|null $input Ability input.
	 * @return array|WP_Error
	 */
	public static function list_events( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$request = new WP_REST_Request( 'GET', self::REST_ROUTE );
		if ( isset( $input['group'] ) && is_string( $input['group'] ) && '' !== $input['group'] ) {
			// Upstream expects an array of groups; forward a single-element array.
			$request->set_param( 'group', array( $input['group'] ) );
		}
		if ( isset( $input['date_from'] ) && is_string( $input['date_from'] ) && '' !== $input['date_from'] ) {
			$request->set_param( 'after', $input['date_from'] );
		}
		if ( isset( $input['date_to'] ) && is_string( $input['date_to'] ) && '' !== $input['date_to'] ) {
			$request->set_param( 'before', $input['date_to'] );
		}
		if ( isset( $input['page'] ) ) {
			$request->set_param( 'page', (int) $input['page'] );
		}
		if ( isset( $input['per_page'] ) ) {
			// Map per_page -> number (upstream param name) and clamp to the schema range.
			$per_page = max( 1, min( 100, (int) $input['per_page'] ) );
			$request->set_param( 'number', $per_page );
		}

		$response = static::dispatch_list_request( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$items = self::extract_items( $response );

		// Client-side filters that aren't part of the upstream query surface.
		if ( isset( $input['action'] ) && is_string( $input['action'] ) && '' !== $input['action'] ) {
			$items = self::filter_by_action( $items, $input['action'] );
		}
		if ( isset( $input['event_id'] ) ) {
			$items = self::filter_by_event_id( $items, $input['event_id'] );
		}

		return array_map( array( __CLASS__, 'project_event' ), $items );
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Dispatch the proxied list request and unwrap the response.
	 *
	 * Extracted as a protected seam so tests can short-circuit the WPCOM
	 * round-trip without standing up a full Jetpack token fixture.
	 *
	 * @param WP_REST_Request $request Prepared list request.
	 * @return array|WP_Error
	 */
	protected static function dispatch_list_request( WP_REST_Request $request ) {
		if ( ! class_exists( REST_Controller::class ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'rest_controller_missing',
				__( 'The Activity Log REST controller is not available. Ensure the activity-log package is loaded.', 'jetpack-activity-log' )
			);
		}

		$response = REST_Controller::get_activity_log( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		// REST_Controller::get_activity_log() may return either a WP_REST_Response
		// (via rest_ensure_response) or a bare array — unwrap both.
		if ( $response instanceof \WP_REST_Response ) {
			$data = $response->get_data();
		} else {
			$data = $response;
		}

		return is_array( $data ) ? $data : array();
	}

	/**
	 * Pull the array of events out of the upstream activity envelope.
	 *
	 * The WPCOM v2 `/sites/{id}/activity` endpoint nests events under
	 * `current.orderedItems`. Older responses, or responses already
	 * unwrapped by a future controller change, are accepted as a flat
	 * top-level list.
	 *
	 * @param array $response Decoded WPCOM response (or unwrapped list).
	 * @return array
	 */
	private static function extract_items( array $response ): array {
		if ( isset( $response['current']['orderedItems'] ) && is_array( $response['current']['orderedItems'] ) ) {
			return $response['current']['orderedItems'];
		}
		if ( isset( $response['orderedItems'] ) && is_array( $response['orderedItems'] ) ) {
			return $response['orderedItems'];
		}
		// Bare list (already unwrapped, or empty). Empty arrays are list-like by definition.
		if ( array() === $response ) {
			return array();
		}
		$keys     = array_keys( $response );
		$expected = range( 0, count( $response ) - 1 );
		return $keys === $expected ? $response : array();
	}

	/**
	 * Filter the event list to entries whose action slug matches `$action`.
	 *
	 * @param array  $items  Events.
	 * @param string $action Action slug to match (e.g. "post__published").
	 * @return array
	 */
	private static function filter_by_action( array $items, string $action ): array {
		return array_values(
			array_filter(
				$items,
				static function ( $item ) use ( $action ) {
					return is_array( $item ) && isset( $item['name'] ) && (string) $item['name'] === $action;
				}
			)
		);
	}

	/**
	 * Filter the event list to a single event by id.
	 *
	 * Accepts both integer and stringified ids — upstream sometimes
	 * returns activity ids as strings, sometimes as integers, and the
	 * abilities surface accepts integer input. Loose comparison after
	 * coercion to string keeps callers from caring which form they get.
	 *
	 * @param array     $items    Events.
	 * @param int|mixed $event_id Event id to match.
	 * @return array 0- or 1-element array.
	 */
	private static function filter_by_event_id( array $items, $event_id ): array {
		$needle = (string) $event_id;
		foreach ( $items as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$id = isset( $item['activity_id'] ) ? $item['activity_id'] : ( $item['id'] ?? null );
			if ( null !== $id && (string) $id === $needle ) {
				return array( $item );
			}
		}
		return array();
	}

	/**
	 * Project an upstream event into the compact ability response shape.
	 *
	 * The upstream WPCOM payload carries display + provenance metadata the
	 * AI surface doesn't need. We keep the fields agents act on — id,
	 * group, action, name, summary, actor, timestamp, gridicon — plus
	 * `object`/`target` for downstream chaining when present.
	 *
	 * @param mixed $item Raw upstream event entry.
	 * @return array
	 */
	private static function project_event( $item ): array {
		if ( ! is_array( $item ) ) {
			return array();
		}

		$actor = self::project_actor( $item['actor'] ?? null );
		$name  = isset( $item['name'] ) ? (string) $item['name'] : '';

		// The event group (post / plugin / user / …) is the `name` prefix before the
		// double-underscore, e.g. "post__published" → group "post", action "post__published".
		return array(
			'id'        => $item['activity_id'] ?? ( $item['id'] ?? '' ),
			'group'     => self::extract_group( $name ),
			'action'    => $name,
			'name'      => $name,
			'summary'   => isset( $item['summary'] ) ? (string) $item['summary'] : '',
			'actor'     => $actor,
			'timestamp' => isset( $item['published'] ) ? (string) $item['published'] : null,
			'gridicon'  => isset( $item['gridicon'] ) ? (string) $item['gridicon'] : null,
			'object'    => isset( $item['object'] ) && is_array( $item['object'] ) ? $item['object'] : null,
			'target'    => isset( $item['target'] ) && is_array( $item['target'] ) ? $item['target'] : null,
		);
	}

	/**
	 * Project the upstream actor object into the compact ability shape.
	 *
	 * @param mixed $actor Raw upstream actor.
	 * @return array|null
	 */
	private static function project_actor( $actor ): ?array {
		if ( ! is_array( $actor ) ) {
			return null;
		}
		$id = $actor['wpcom_user_id'] ?? ( $actor['external_user_id'] ?? ( $actor['id'] ?? 0 ) );
		return array(
			'id'           => (int) $id,
			'display_name' => isset( $actor['name'] ) ? (string) $actor['name'] : '',
			'role'         => isset( $actor['role'] ) ? (string) $actor['role'] : '',
		);
	}

	/**
	 * Extract the event group slug from a WPCOM event name.
	 *
	 * Event names follow the convention `{group}__{action}` — e.g.
	 * `post__published`, `plugin__activated`, `user__login_success`.
	 * We split on the first double-underscore so a name like
	 * `plugin__update_available` still resolves to group `plugin`.
	 *
	 * @param string $name Upstream event name.
	 * @return string
	 */
	private static function extract_group( string $name ): string {
		if ( '' === $name ) {
			return '';
		}
		$pos = strpos( $name, '__' );
		if ( false === $pos ) {
			return $name;
		}
		return substr( $name, 0, $pos );
	}
}
