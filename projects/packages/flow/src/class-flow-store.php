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
 * Reads, validates and saves the list of flows.
 *
 * A flow is `{ id, name, enabled, trigger: { type, config }, steps: [ { id, type, config } ] }`.
 */
class Flow_Store {

	const OPTION = 'jetpack_flow_flows';

	/**
	 * All saved flows.
	 *
	 * @return array[]
	 */
	public static function all() {
		$flows = get_option( self::OPTION, array() );
		return is_array( $flows ) ? array_values( $flows ) : array();
	}

	/**
	 * Flows that are enabled and start with the given trigger.
	 *
	 * @param string $trigger_id Trigger ID.
	 * @return array[]
	 */
	public static function enabled_for( $trigger_id ) {
		return array_values(
			array_filter(
				self::all(),
				static function ( $flow ) use ( $trigger_id ) {
					return ! empty( $flow['enabled'] ) && ( $flow['trigger']['type'] ?? '' ) === $trigger_id;
				}
			)
		);
	}

	/**
	 * Replace all flows with a sanitized copy of the input.
	 *
	 * @param mixed $flows Raw flows.
	 * @return array[] The saved flows.
	 */
	public static function save( $flows ) {
		$clean = self::sanitize( $flows );
		update_option( self::OPTION, $clean, false );
		return $clean;
	}

	/**
	 * Drop anything that does not match the catalog.
	 *
	 * @param mixed $flows Raw flows.
	 * @return array[]
	 */
	public static function sanitize( $flows ) {
		if ( ! is_array( $flows ) ) {
			return array();
		}

		$triggers = Catalog::triggers();
		$actions  = Catalog::actions();
		$clean    = array();

		foreach ( $flows as $flow ) {
			if ( ! is_array( $flow ) ) {
				continue;
			}
			$trigger_type = sanitize_key( $flow['trigger']['type'] ?? '' );
			if ( ! isset( $triggers[ $trigger_type ] ) ) {
				continue;
			}

			$steps = array();
			foreach ( (array) ( $flow['steps'] ?? array() ) as $step ) {
				$type = sanitize_key( $step['type'] ?? '' );
				if ( ! isset( $actions[ $type ] ) ) {
					continue;
				}
				$steps[] = array(
					'id'     => self::id_or_new( $step['id'] ?? '' ),
					'type'   => $type,
					'config' => self::sanitize_config( $step['config'] ?? array(), $actions[ $type ]['fields'] ?? array() ),
				);
			}

			$clean[] = array(
				'id'      => self::id_or_new( $flow['id'] ?? '' ),
				'name'    => sanitize_text_field( $flow['name'] ?? '' ),
				'enabled' => ! empty( $flow['enabled'] ),
				'trigger' => array(
					'type'   => $trigger_type,
					'config' => array(),
				),
				'steps'   => $steps,
			);
		}

		return $clean;
	}

	/**
	 * Sanitize an ID, minting one when empty.
	 *
	 * @param mixed $id Raw ID.
	 * @return string
	 */
	private static function id_or_new( $id ) {
		$id = sanitize_key( (string) $id );
		return '' === $id ? wp_generate_uuid4() : $id;
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
