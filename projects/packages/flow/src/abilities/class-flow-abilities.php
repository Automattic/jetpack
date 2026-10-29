<?php
/**
 * Jetpack Flow Abilities Registration.
 *
 * Lets AI agents learn what Flow can connect, and list, create, edit and
 * delete flows through the WordPress Abilities API.
 *
 * @package automattic/jetpack-flow
 */

namespace Automattic\Jetpack\Flow\Abilities;

use Automattic\Jetpack\Flow\Catalog;
use Automattic\Jetpack\Flow\Flow;
use Automattic\Jetpack\Flow\Flow_Store;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the Flow abilities:
 *
 * - `jetpack-flow/get-flow-catalog` — the triggers and actions a flow can use.
 * - `jetpack-flow/get-flows` — saved flows, filterable, one of them by ID.
 * - `jetpack-flow/save-flow` — create a flow, or change an existing one.
 * - `jetpack-flow/delete-flow` — permanently remove a flow.
 */
class Flow_Abilities extends Registrar {

	const PER_PAGE_DEFAULT = 20;
	const PER_PAGE_MAX     = 100;

	/**
	 * Return the ability category slug.
	 *
	 * @return string
	 */
	public static function get_category_slug(): string {
		return 'jetpack-flow';
	}

	/**
	 * Return the ability category definition.
	 *
	 * @return array
	 */
	public static function get_category_definition(): array {
		return array(
			'label'       => __( 'Jetpack Flow', 'jetpack-flow-pkg' ),
			'description' => __( 'Automations that do something when something happens on the site.', 'jetpack-flow-pkg' ),
		);
	}

	/**
	 * Return the abilities this Registrar exposes, keyed by slug.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function get_abilities(): array {
		$flow_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'          => array( 'type' => 'integer' ),
				'name'        => array( 'type' => 'string' ),
				'enabled'     => array( 'type' => 'boolean' ),
				'triggers'    => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'id'    => array( 'type' => 'string' ),
							'label' => array( 'type' => 'string' ),
						),
					),
				),
				'steps'       => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'id'     => array( 'type' => 'string' ),
							'type'   => array( 'type' => 'string' ),
							'label'  => array( 'type' => 'string' ),
							'config' => array( 'type' => 'object' ),
						),
					),
				),
				'has_webhook' => array( 'type' => 'boolean' ),
				'modified'    => array( 'type' => 'string' ),
			),
		);

		$annotations = static function ( $readonly, $destructive, $idempotent ) {
			return array(
				'readonly'    => $readonly,
				'destructive' => $destructive,
				'idempotent'  => $idempotent,
			);
		};

		$meta = static function ( $annotations ) {
			return array(
				'annotations'  => $annotations,
				'show_in_rest' => true,
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool',
				),
			);
		};

		return array(
			'jetpack-flow/get-flow-catalog' => array(
				'label'               => __( 'Get Flow triggers and actions', 'jetpack-flow-pkg' ),
				'description'         => __(
					'Learn what Flow can do. A flow is "when any of these triggers happens, run these actions in order". Returns the available triggers (with the {{tokens}} each one provides) and actions (with their configurable fields, the tokens they output, and the plugin they require). Use the returned IDs when calling jetpack-flow/save-flow; text fields in action config may contain {{token}} placeholders. Filter with kind, product or search. Read-only.',
					'jetpack-flow-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'kind'    => array(
							'type'        => 'string',
							'enum'        => array( 'all', 'triggers', 'actions' ),
							'description' => 'Which list to return. Defaults to "all".',
						),
						'product' => array(
							'type'        => 'string',
							'description' => 'Only items of this product, for example "mailpoet" or "woocommerce".',
						),
						'search'  => array(
							'type'        => 'string',
							'description' => 'Case-insensitive text to find in an item ID, label or description.',
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'triggers' => array(
							'type'  => 'array',
							'items' => array( 'type' => 'object' ),
						),
						'actions'  => array(
							'type'  => 'array',
							'items' => array( 'type' => 'object' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_flow_catalog' ),
				'permission_callback' => array( __CLASS__, 'can_manage' ),
				'meta'                => $meta( $annotations( true, false, true ) ),
			),
			'jetpack-flow/get-flows'        => array(
				'label'               => __( 'Get flows', 'jetpack-flow-pkg' ),
				'description'         => __(
					'List the flows saved on this site, newest first, or fetch one by ID. Each flow has an ID, a name, whether it is enabled, its triggers (any one starts it) and its steps (actions run in order, each with its config). Filter by id, enabled, trigger, action or search; an unknown id returns an empty list. Paginated with page and per_page. Use jetpack-flow/get-flow-catalog to look up trigger and action IDs. Read-only.',
					'jetpack-flow-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'id'       => array(
							'type'        => 'integer',
							'minimum'     => 1,
							'description' => 'Return only the flow with this ID.',
						),
						'enabled'  => array(
							'type'        => 'boolean',
							'description' => 'Only enabled (true) or only disabled (false) flows.',
						),
						'trigger'  => array(
							'type'        => 'string',
							'description' => 'Only flows that use this trigger ID.',
						),
						'action'   => array(
							'type'        => 'string',
							'description' => 'Only flows that use this action ID.',
						),
						'search'   => array(
							'type'        => 'string',
							'description' => 'Case-insensitive text to find in the flow name.',
						),
						'page'     => array(
							'type'    => 'integer',
							'minimum' => 1,
							'default' => 1,
						),
						'per_page' => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => self::PER_PAGE_MAX,
							'default' => self::PER_PAGE_DEFAULT,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'flows'       => array(
							'type'  => 'array',
							'items' => $flow_schema,
						),
						'total'       => array( 'type' => 'integer' ),
						'page'        => array( 'type' => 'integer' ),
						'per_page'    => array( 'type' => 'integer' ),
						'total_pages' => array( 'type' => 'integer' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_flows' ),
				'permission_callback' => array( __CLASS__, 'can_manage' ),
				'meta'                => $meta( $annotations( true, false, true ) ),
			),
			'jetpack-flow/save-flow'        => array(
				'label'               => __( 'Create or edit a flow', 'jetpack-flow-pkg' ),
				'description'         => __(
					'Create a flow, or change an existing one by passing its id. Creating needs at least one trigger; a new flow with no name is named automatically and is disabled unless enabled is true. When editing, any field you leave out keeps its current value, and a steps list replaces all the steps, so send every step you want to keep (steps with an id keep it). Set enabled to turn a flow on or off. Returns the saved flow in the same shape as jetpack-flow/get-flows. Look up trigger and action IDs, and the config field names of each action, with jetpack-flow/get-flow-catalog.',
					'jetpack-flow-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'id'       => array(
							'type'        => 'integer',
							'minimum'     => 1,
							'description' => 'ID of the flow to edit. Leave out to create a new flow.',
						),
						'name'     => array(
							'type'        => 'string',
							'description' => 'A short description of the flow.',
						),
						'enabled'  => array(
							'type'        => 'boolean',
							'description' => 'Whether the flow runs.',
						),
						'triggers' => array(
							'type'        => 'array',
							'minItems'    => 1,
							'items'       => array( 'type' => 'string' ),
							'description' => 'Trigger IDs. The flow starts when any one of them happens.',
						),
						'steps'    => array(
							'type'        => 'array',
							'items'       => array(
								'type'                 => 'object',
								'properties'           => array(
									'type'   => array(
										'type'        => 'string',
										'description' => 'Action ID.',
									),
									'config' => array(
										'type'        => 'object',
										'description' => 'Values for the action fields, keyed by field name.',
									),
									'id'     => array(
										'type'        => 'string',
										'description' => 'ID of an existing step to keep.',
									),
								),
								'required'             => array( 'type' ),
								'additionalProperties' => false,
							),
							'description' => 'Actions to run in order.',
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => $flow_schema,
				'execute_callback'    => array( __CLASS__, 'save_flow' ),
				'permission_callback' => array( __CLASS__, 'can_manage' ),
				'meta'                => $meta( $annotations( false, false, false ) ),
			),
			'jetpack-flow/delete-flow'      => array(
				'label'               => __( 'Delete a flow', 'jetpack-flow-pkg' ),
				'description'         => __(
					'Permanently delete a flow by ID. This cannot be undone; to stop a flow without losing it, call jetpack-flow/save-flow with enabled set to false instead. Returns the ID and name of the deleted flow, or an error if no flow has that ID. Find IDs with jetpack-flow/get-flows.',
					'jetpack-flow-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'id' => array(
							'type'    => 'integer',
							'minimum' => 1,
						),
					),
					'required'             => array( 'id' ),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'deleted' => array( 'type' => 'boolean' ),
						'id'      => array( 'type' => 'integer' ),
						'name'    => array( 'type' => 'string' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'delete_flow' ),
				'permission_callback' => array( __CLASS__, 'can_manage' ),
				'meta'                => $meta( $annotations( false, true, false ) ),
			),
		);
	}

	/**
	 * Whether the current user may manage flows.
	 *
	 * @return bool
	 */
	public static function can_manage(): bool {
		return Flow::current_user_can_manage();
	}

	/**
	 * Triggers and actions a flow can use.
	 *
	 * @param array|null $input Optional kind, product and search filters.
	 * @return array
	 */
	public static function get_flow_catalog( $input = null ) {
		$input  = is_array( $input ) ? $input : array();
		$kind   = $input['kind'] ?? 'all';
		$search = isset( $input['search'] ) ? strtolower( (string) $input['search'] ) : '';

		$catalog = Catalog::for_rest();
		$keep    = static function ( $item ) use ( $input, $search ) {
			if ( ! empty( $input['product'] ) && ( $item['product'] ?? '' ) !== $input['product'] ) {
				return false;
			}
			return '' === $search || false !== strpos( strtolower( $item['id'] . ' ' . $item['label'] . ' ' . ( $item['description'] ?? '' ) ), $search );
		};
		$shape   = static function ( $item ) use ( $catalog ) {
			$plugin = $item['requires'] ?? '';
			return array(
				'id'          => $item['id'],
				'label'       => $item['label'],
				'description' => $item['description'] ?? '',
				'product'     => $item['product'] ?? '',
				'requires'    => $plugin,
				'plugin_ok'   => '' === $plugin || 'active' === ( $catalog['plugins'][ $plugin ]['status'] ?? '' ),
				'tokens'      => $item['tokens'] ?? array(),
				'outputs'     => $item['outputs'] ?? array(),
				'fields'      => array_map(
					static function ( $field ) {
						return array(
							'name'     => $field['name'],
							'label'    => $field['label'],
							'type'     => $field['type'],
							'required' => ! empty( $field['required'] ),
							'default'  => $field['default'] ?? '',
							'options'  => isset( $field['options'] ) ? wp_list_pluck( $field['options'], 'value' ) : array(),
						);
					},
					$item['fields'] ?? array()
				),
			);
		};

		$result = array(
			'triggers' => array(),
			'actions'  => array(),
		);
		foreach ( array( 'triggers', 'actions' ) as $list ) {
			if ( 'all' === $kind || $list === $kind ) {
				$result[ $list ] = array_values( array_map( $shape, array_filter( $catalog[ $list ], $keep ) ) );
			}
		}
		return $result;
	}

	/**
	 * Saved flows, filtered and paginated.
	 *
	 * @param array|null $input Filters and pagination.
	 * @return array
	 */
	public static function get_flows( $input = null ) {
		$input    = is_array( $input ) ? $input : array();
		$page     = max( 1, (int) ( $input['page'] ?? 1 ) );
		$per_page = min( self::PER_PAGE_MAX, max( 1, (int) ( $input['per_page'] ?? self::PER_PAGE_DEFAULT ) ) );
		$search   = isset( $input['search'] ) ? strtolower( (string) $input['search'] ) : '';

		$flows = array_filter(
			Flow_Store::all(),
			static function ( $flow ) use ( $input, $search ) {
				if ( isset( $input['id'] ) && (int) $input['id'] !== $flow['id'] ) {
					return false;
				}
				if ( isset( $input['enabled'] ) && (bool) $input['enabled'] !== $flow['enabled'] ) {
					return false;
				}
				if ( ! empty( $input['trigger'] ) && ! in_array( $input['trigger'], $flow['triggers'], true ) ) {
					return false;
				}
				if ( ! empty( $input['action'] ) && ! in_array( $input['action'], wp_list_pluck( $flow['steps'], 'type' ), true ) ) {
					return false;
				}
				return '' === $search || false !== strpos( strtolower( $flow['name'] ), $search );
			}
		);

		$total = count( $flows );
		return array(
			'flows'       => array_map( array( __CLASS__, 'shape_flow' ), array_slice( array_values( $flows ), ( $page - 1 ) * $per_page, $per_page ) ),
			'total'       => $total,
			'page'        => $page,
			'per_page'    => $per_page,
			'total_pages' => (int) ceil( $total / $per_page ),
		);
	}

	/**
	 * Create a flow, or change an existing one.
	 *
	 * @param array|null $input Flow fields; `id` selects the flow to edit.
	 * @return array|WP_Error
	 */
	public static function save_flow( $input = null ) {
		$input = is_array( $input ) ? $input : array();
		$id    = isset( $input['id'] ) ? (int) $input['id'] : null;

		$current = null;
		if ( $id ) {
			$current = Flow_Store::get( $id );
			if ( ! $current ) {
				return self::not_found();
			}
		}

		$flow = array(
			'name'     => $input['name'] ?? ( $current['name'] ?? '' ),
			'enabled'  => $input['enabled'] ?? ( $current['enabled'] ?? false ),
			'triggers' => $input['triggers'] ?? ( $current['triggers'] ?? array() ),
			'steps'    => $input['steps'] ?? ( $current['steps'] ?? array() ),
		);

		$error = self::validate( $flow );
		if ( $error ) {
			return $error;
		}

		$saved = Flow_Store::save( $flow, $id );
		return is_wp_error( $saved ) ? $saved : self::shape_flow( $saved );
	}

	/**
	 * Permanently delete a flow.
	 *
	 * @param array|null $input Needs `id`.
	 * @return array|WP_Error
	 */
	public static function delete_flow( $input = null ) {
		$id = is_array( $input ) && isset( $input['id'] ) ? (int) $input['id'] : 0;

		$flow = $id ? Flow_Store::get( $id ) : null;
		if ( ! $flow ) {
			return self::not_found();
		}
		if ( ! Flow_Store::delete( $id ) ) {
			return new WP_Error( 'jetpack_flow_delete_failed', __( 'The flow could not be deleted. Try again.', 'jetpack-flow-pkg' ) );
		}

		return array(
			'deleted' => true,
			'id'      => $id,
			'name'    => $flow['name'],
		);
	}

	/**
	 * Check trigger and action IDs and config field names against the catalog.
	 *
	 * @param array $flow Flow to save.
	 * @return WP_Error|null
	 */
	private static function validate( $flow ) {
		if ( ! $flow['triggers'] ) {
			return new WP_Error( 'jetpack_flow_missing_triggers', __( 'A flow needs at least one trigger. Call jetpack-flow/get-flow-catalog to list trigger IDs.', 'jetpack-flow-pkg' ) );
		}

		$triggers = Catalog::triggers();
		foreach ( $flow['triggers'] as $trigger_id ) {
			if ( ! isset( $triggers[ $trigger_id ] ) ) {
				/* translators: %s: trigger ID */
				return new WP_Error( 'jetpack_flow_invalid_trigger', sprintf( __( 'Unknown trigger "%s". Call jetpack-flow/get-flow-catalog with kind "triggers" to list trigger IDs.', 'jetpack-flow-pkg' ), $trigger_id ) );
			}
		}

		$actions = Catalog::actions();
		foreach ( $flow['steps'] as $step ) {
			$type = (string) ( $step['type'] ?? '' );
			if ( ! isset( $actions[ $type ] ) ) {
				/* translators: %s: action ID */
				return new WP_Error( 'jetpack_flow_invalid_action', sprintf( __( 'Unknown action "%s". Call jetpack-flow/get-flow-catalog with kind "actions" to list action IDs.', 'jetpack-flow-pkg' ), $type ) );
			}
			$allowed = wp_list_pluck( $actions[ $type ]['fields'] ?? array(), 'name' );
			$unknown = array_diff( array_keys( (array) ( $step['config'] ?? array() ) ), $allowed );
			if ( $unknown ) {
				return new WP_Error(
					'jetpack_flow_invalid_config',
					sprintf(
						/* translators: 1: action ID, 2: unknown field names, 3: valid field names */
						__( 'Action "%1$s" has no field %2$s. Its fields are: %3$s.', 'jetpack-flow-pkg' ),
						$type,
						implode( ', ', $unknown ),
						$allowed ? implode( ', ', $allowed ) : __( 'none', 'jetpack-flow-pkg' )
					)
				);
			}
		}
		return null;
	}

	/**
	 * A flow in the shape agents get back.
	 *
	 * @param array $flow Flow from the store.
	 * @return array
	 */
	private static function shape_flow( $flow ) {
		$triggers = Catalog::triggers();
		$actions  = Catalog::actions();

		return array(
			'id'          => $flow['id'],
			'name'        => $flow['name'],
			'enabled'     => $flow['enabled'],
			'triggers'    => array_map(
				static function ( $trigger_id ) use ( $triggers ) {
					return array(
						'id'    => $trigger_id,
						'label' => $triggers[ $trigger_id ]['label'] ?? $trigger_id,
					);
				},
				$flow['triggers']
			),
			'steps'       => array_map(
				static function ( $step ) use ( $actions ) {
					return array(
						'id'     => $step['id'],
						'type'   => $step['type'],
						'label'  => $actions[ $step['type'] ]['label'] ?? $step['type'],
						'config' => (object) $step['config'],
					);
				},
				$flow['steps']
			),
			'has_webhook' => ! empty( $flow['inbound_url'] ),
			'modified'    => (string) ( $flow['modified'] ?? '' ),
		);
	}

	/**
	 * Error for an ID that matches no flow.
	 *
	 * @return WP_Error
	 */
	private static function not_found() {
		return new WP_Error( 'jetpack_flow_not_found', __( 'No flow has that ID. Call jetpack-flow/get-flows to list flows and their IDs.', 'jetpack-flow-pkg' ), array( 'status' => 404 ) );
	}
}
