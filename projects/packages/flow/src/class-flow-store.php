<?php
/**
 * Storage for saved flows.
 *
 * @package automattic/jetpack-flow
 */

namespace Automattic\Jetpack\Flow;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Reads, validates and saves flows as `jetpack_flow` posts.
 *
 * A flow is `{ id, name, enabled, trigger: { type, config }, steps: [ { id, type, config } ] }`.
 */
class Flow_Store {

	/**
	 * All flows, newest first.
	 *
	 * @return array[]
	 */
	public static function all() {
		$posts = get_posts(
			array(
				'post_type'        => Flow_Post_Type::POST_TYPE,
				'post_status'      => array( 'publish', 'draft' ),
				'posts_per_page'   => 100,
				'orderby'          => 'date',
				'order'            => 'DESC',
				'suppress_filters' => true,
			)
		);
		return array_values( array_filter( array_map( array( __CLASS__, 'from_post' ), $posts ) ) );
	}

	/**
	 * One flow by ID.
	 *
	 * @param int $id Post ID.
	 * @return array|null
	 */
	public static function get( $id ) {
		$post = get_post( (int) $id );
		return $post && Flow_Post_Type::POST_TYPE === $post->post_type ? self::from_post( $post ) : null;
	}

	/**
	 * Enabled flows that start with the given trigger.
	 *
	 * @param string $trigger_id Trigger ID.
	 * @return array[]
	 */
	public static function enabled_for( $trigger_id ) {
		$posts = get_posts(
			array(
				'post_type'        => Flow_Post_Type::POST_TYPE,
				'post_status'      => 'publish',
				'posts_per_page'   => 100,
				'meta_key'         => Flow_Post_Type::META_TRIGGER, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value'       => $trigger_id, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'suppress_filters' => true,
			)
		);
		return array_values( array_filter( array_map( array( __CLASS__, 'from_post' ), $posts ) ) );
	}

	/**
	 * Create or update a flow from user input.
	 *
	 * @param array    $input Raw flow.
	 * @param int|null $id    Existing flow ID, or null to create.
	 * @return array|\WP_Error The saved flow.
	 */
	public static function save( $input, $id = null ) {
		$clean = self::sanitize_one( $input );
		if ( ! $clean ) {
			return new \WP_Error( 'invalid_flow', __( 'A flow needs a known trigger.', 'jetpack-flow-pkg' ), array( 'status' => 400 ) );
		}

		$name = $clean['name'];
		if ( '' === $name && ! $id ) {
			$name = Planner::suggest_name( $clean );
		}
		if ( '' === $name ) {
			$name = Catalog::triggers()[ $clean['trigger']['type'] ]['label'];
		}

		$post = array(
			'post_type'   => Flow_Post_Type::POST_TYPE,
			'post_title'  => $name,
			'post_status' => $clean['enabled'] ? 'publish' : 'draft',
		);
		if ( $id ) {
			if ( ! self::get( $id ) ) {
				return new \WP_Error( 'not_found', __( 'Flow not found.', 'jetpack-flow-pkg' ), array( 'status' => 404 ) );
			}
			$post['ID'] = (int) $id;
		}

		$saved = wp_insert_post( wp_slash( $post ), true );
		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		update_post_meta(
			$saved,
			Flow_Post_Type::META_DEFINITION,
			wp_slash(
				wp_json_encode(
					array(
						'trigger' => $clean['trigger'],
						'steps'   => $clean['steps'],
					),
					JSON_UNESCAPED_SLASHES
				)
			)
		);
		update_post_meta( $saved, Flow_Post_Type::META_TRIGGER, $clean['trigger']['type'] );

		return self::get( $saved );
	}

	/**
	 * Turn a flow on or off.
	 *
	 * @param int  $id      Post ID.
	 * @param bool $enabled Whether it should run.
	 * @return array|\WP_Error
	 */
	public static function set_enabled( $id, $enabled ) {
		if ( ! self::get( $id ) ) {
			return new \WP_Error( 'not_found', __( 'Flow not found.', 'jetpack-flow-pkg' ), array( 'status' => 404 ) );
		}
		wp_update_post(
			array(
				'ID'          => (int) $id,
				'post_status' => $enabled ? 'publish' : 'draft',
			)
		);
		return self::get( $id );
	}

	/**
	 * Permanently delete a flow.
	 *
	 * @param int $id Post ID.
	 * @return bool
	 */
	public static function delete( $id ) {
		return self::get( $id ) && (bool) wp_delete_post( (int) $id, true );
	}

	/**
	 * Convert a post to the flow shape.
	 *
	 * @param \WP_Post $post Flow post.
	 * @return array|null
	 */
	private static function from_post( $post ) {
		$definition = json_decode( (string) get_post_meta( $post->ID, Flow_Post_Type::META_DEFINITION, true ), true );
		if ( ! is_array( $definition ) || empty( $definition['trigger']['type'] ) ) {
			return null;
		}

		return array(
			'id'       => $post->ID,
			'name'     => $post->post_title,
			'enabled'  => 'publish' === $post->post_status,
			'modified' => get_post_modified_time( 'c', true, $post ),
			'trigger'  => $definition['trigger'],
			'steps'    => (array) ( $definition['steps'] ?? array() ),
		);
	}

	/**
	 * Drop anything that does not match the catalog.
	 *
	 * @param mixed $flow Raw flow.
	 * @return array|null Null when the trigger is unknown.
	 */
	public static function sanitize_one( $flow ) {
		if ( ! is_array( $flow ) ) {
			return null;
		}

		$triggers     = Catalog::triggers();
		$actions      = Catalog::actions();
		$trigger_type = sanitize_key( $flow['trigger']['type'] ?? '' );
		if ( ! isset( $triggers[ $trigger_type ] ) ) {
			return null;
		}

		$steps = array();
		foreach ( (array) ( $flow['steps'] ?? array() ) as $step ) {
			$type = sanitize_key( $step['type'] ?? '' );
			if ( ! isset( $actions[ $type ] ) ) {
				continue;
			}
			$step_id = sanitize_key( (string) ( $step['id'] ?? '' ) );
			$steps[] = array(
				'id'     => '' === $step_id ? wp_generate_uuid4() : $step_id,
				'type'   => $type,
				'config' => self::sanitize_config( $step['config'] ?? array(), $actions[ $type ]['fields'] ?? array() ),
			);
		}

		return array(
			'name'    => sanitize_text_field( $flow['name'] ?? '' ),
			'enabled' => ! empty( $flow['enabled'] ),
			'trigger' => array(
				'type'   => $trigger_type,
				'config' => array(),
			),
			'steps'   => $steps,
		);
	}

	/**
	 * Keep only the declared fields, sanitized by type.
	 *
	 * @param mixed $config Raw config.
	 * @param array $fields Field definitions.
	 * @return array
	 */
	private static function sanitize_config( $config, $fields ) {
		$config = is_array( $config ) ? $config : array();
		$clean  = array();
		foreach ( $fields as $field ) {
			$name  = $field['name'];
			$value = isset( $config[ $name ] ) ? (string) $config[ $name ] : (string) ( $field['default'] ?? '' );
			switch ( $field['type'] ) {
				case 'url':
					$clean[ $name ] = esc_url_raw( $value );
					break;
				case 'textarea':
					$clean[ $name ] = sanitize_textarea_field( $value );
					break;
				default:
					// Text may hold {{tokens}}, so it cannot go through sanitize_email().
					$clean[ $name ] = sanitize_text_field( $value );
			}
		}
		return $clean;
	}

	/**
	 * Secret used to authenticate inbound events, created on first use.
	 *
	 * @return string
	 */
	public static function inbound_token() {
		$token = get_option( 'jetpack_flow_inbound_token' );
		if ( ! $token ) {
			$token = wp_generate_password( 32, false );
			update_option( 'jetpack_flow_inbound_token', $token, false );
		}
		return $token;
	}
}
