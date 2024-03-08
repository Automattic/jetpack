<?php
/**
 * The Backup Rest Controller class.
 * Registers the REST routes for Backup.
 *
 * @package automattic/jetpack-backup
 */

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Backup\V0003;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\Sync\Actions as Sync_Actions;
use Automattic\WooCommerce\Internal\DataStores\Orders\OrdersTableDataStore;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;
// phpcs:ignore WordPress.Utils.I18nTextDomainFixer.MissingArgs
use function esc_html__;
use function get_comment;
use function get_comment_meta;
use function get_metadata;
use function get_post;
use function get_post_meta;
use function get_term;
use function get_term_meta;
use function get_user_by;
use function get_user_meta;
use function is_wp_error;
use function register_rest_route;
use function rest_authorization_required_code;
use function rest_ensure_response;
use function wp_remote_retrieve_response_code;

/**
 * Registers the REST routes for Backup.
 */
class REST_Controller {
	/**
	 * Registers the REST routes for Backup.
	 *
	 * @access public
	 * @static
	 */
	public static function register_rest_routes() {
		// Install a Helper Script to assist Jetpack Backup fetch data.
		register_rest_route(
			'jetpack/v4',
			'/backup-helper-script',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => __CLASS__ . '::install_backup_helper_script',
				'permission_callback' => __CLASS__ . '::backup_permissions_callback',
				'args'                => array(
					'helper' => array(
						'description' => __( 'base64 encoded Backup Helper Script body.', 'jetpack-backup-pkg' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
			)
		);

		// Delete a Backup Helper Script.
		register_rest_route(
			'jetpack/v4',
			'/backup-helper-script',
			array(
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => __CLASS__ . '::delete_backup_helper_script',
				'permission_callback' => __CLASS__ . '::backup_permissions_callback',
				'args'                => array(
					'path' => array(
						'description' => __( 'Path to Backup Helper Script', 'jetpack-backup-pkg' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
			)
		);

		// Fetch a backup of a database object, along with all of its metadata.
		register_rest_route(
			'jetpack/v4',
			'/database-object/backup',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::fetch_database_object_backup',
				'permission_callback' => __CLASS__ . '::backup_permissions_callback',
				'args'                => array(
					'object_type' => array(
						'description'       => __( 'Type of object to fetch from the database', 'jetpack-backup-pkg' ),
						'required'          => true,
						'validate_callback' => function ( $value ) {
							if ( ! is_string( $value ) ) {
								return new WP_Error(
									'rest_invalid_param',
									__( 'The object_type argument must be a non-empty string.', 'jetpack-backup-pkg' ),
									array( 'status' => 400 )
								);
							}

							$allowed_object_types = array_keys( self::get_allowed_object_types() );

							if ( ! in_array( $value, $allowed_object_types, true ) ) {
								return new WP_Error(
									'rest_invalid_param',
									sprintf(
										/* translators: %s: comma-separated list of allowed object types */
										__( 'The object_type argument should be one of %s', 'jetpack-backup-pkg' ),
										implode( ', ', $allowed_object_types )
									),
									array( 'status' => 400 )
								);
							}

							return true;
						},
					),
					'object_id'   => array(
						'description' => __( 'ID of the database object to fetch', 'jetpack-backup-pkg' ),
						'type'        => 'integer',
						'required'    => true,
					),
				),
			)
		);

		// Fetch a backup of an option.
		register_rest_route(
			'jetpack/v4',
			'/options/backup',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::fetch_options_backup',
				'permission_callback' => __CLASS__ . '::backup_permissions_callback',
				'args'                => array(
					'name' => array(
						'description'       => __( 'One or more option names to include in the backup', 'jetpack-backup-pkg' ),
						'validate_callback' => function ( $value ) {
							$is_valid = is_array( $value ) || is_string( $value );
							if ( ! $is_valid ) {
								return new WP_Error( 'rest_invalid_param', __( 'The name argument should be an option name or an array of option names', 'jetpack-backup-pkg' ), array( 'status' => 400 ) );
							}

							return true;
						},
						'required'          => true,
					),
				),
			)
		);

		// Fetch a backup of a comment, along with all of its metadata.
		register_rest_route(
			'jetpack/v4',
			'/comments/(?P<id>\d+)/backup',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::fetch_comment_backup',
				'permission_callback' => __CLASS__ . '::backup_permissions_callback',
			)
		);

		// Fetch a backup of a post, along with all of its metadata.
		register_rest_route(
			'jetpack/v4',
			'/posts/(?P<id>\d+)/backup',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::fetch_post_backup',
				'permission_callback' => __CLASS__ . '::backup_permissions_callback',
			)
		);

		// Fetch a backup of a term, along with all of its metadata.
		register_rest_route(
			'jetpack/v4',
			'/terms/(?P<id>\d+)/backup',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::fetch_term_backup',
				'permission_callback' => __CLASS__ . '::backup_permissions_callback',
			)
		);

		// Fetch a backup of a user, along with all of its metadata.
		register_rest_route(
			'jetpack/v4',
			'/users/(?P<id>\d+)/backup',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::fetch_user_backup',
				'permission_callback' => __CLASS__ . '::backup_permissions_callback',
			)
		);

		// Get backup undo event
		register_rest_route(
			'jetpack/v4',
			'/site/backup/undo-event',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_undo_event',
				'permission_callback' => __NAMESPACE__ . '\Jetpack_Backup::backups_permissions_callback',
			)
		);

		// Fetch a backup of a wc_order along with all of its data.
		register_rest_route(
			'jetpack/v4',
			'/orders/(?P<id>\d+)/backup',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::fetch_wc_orders_backup',
				'permission_callback' => __CLASS__ . '::backup_permissions_callback',
			)
		);

		// Fetch backup preflight status
		register_rest_route(
			'jetpack/v4',
			'/site/backup/preflight',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_preflight',
				'permission_callback' => __NAMESPACE__ . '\Jetpack_Backup::backups_permissions_callback',
			)
		);
	}

	/**
	 * The Backup endpoints should only be available via site-level authentication.
	 * This means that the corresponding endpoints can only be accessible from WPCOM.
	 *
	 * @access public
	 * @static
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public static function backup_permissions_callback() {
		if ( Rest_Authentication::is_signed_with_blog_token() ) {
			return true;
		}

		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-backup-pkg'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Install the Backup Helper Script.
	 *
	 * @access public
	 * @static
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array|WP_Error Array with installation info on success:
	 *
	 *   'path'    (string) Helper script installation path on the filesystem.
	 *   'url'     (string) URL to the helper script.
	 *   'abspath' (string) WordPress root.
	 *
	 *   or an instance of WP_Error on failure.
	 */
	public static function install_backup_helper_script( $request ) {
		$helper_script = $request->get_param( 'helper' );

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		$helper_script = base64_decode( $helper_script );
		if ( ! $helper_script ) {
			return new WP_Error( 'invalid_args', __( 'Helper script body must be base64 encoded', 'jetpack-backup-pkg' ), 400 );
		}

		$installation_info = Helper_Script_Manager::install_helper_script( $helper_script );
		Helper_Script_Manager::cleanup_expired_helper_scripts();

		return rest_ensure_response( $installation_info );
	}

	/**
	 * Delete a Backup Helper Script.
	 *
	 * @access public
	 * @static
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array|WP_Error An array with 'success' key, or an instance of WP_Error on failure.
	 */
	public static function delete_backup_helper_script( $request ) {
		$path_to_helper_script = $request->get_param( 'path' );

		$delete_result = Helper_Script_Manager::delete_helper_script( $path_to_helper_script );
		Helper_Script_Manager::cleanup_expired_helper_scripts();

		if ( is_wp_error( $delete_result ) ) {
			return $delete_result;
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Fetch a backup of a database object, along with all of its metadata.
	 *
	 * @access public
	 * @static
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array
	 */
	public static function fetch_database_object_backup( $request ) {
		global $wpdb;

		// Disable Sync as this is a read-only operation and triggered by sync activity.
		Sync_Actions::mark_sync_read_only();

		$allowed_object_types = self::get_allowed_object_types();
		// Safe to do this as we have already validated the object_type key exists in self::get_allowed_object_types().
		$object_type = $allowed_object_types[ $request->get_param( 'object_type' ) ];
		$object_id   = $request->get_param( 'object_id' );
		$table       = $wpdb->prefix . $object_type['table'];
		$id_field    = $object_type['id_field'];

		// Fetch the requested object.
		$object = $wpdb->get_row(
			$wpdb->prepare(
				'SELECT * FROM `' . $table . '` WHERE `' . $id_field . '` = %d', // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				$object_id
			)
		);

		if ( empty( $object ) ) {
			return new WP_Error( 'object_not_found', __( 'Object not found', 'jetpack-backup-pkg' ), array( 'status' => 404 ) );
		}

		$result = array( 'object' => $object );

		// Fetch associated metadata (if this object type has any).
		if ( ! empty( $object_type['meta_type'] ) ) {
			$result['meta'] = get_metadata( $object_type['meta_type'], $object_id );
		}

		// If there is a child linked table (eg: woocommerce_tax_rate_locations), fetch linked records.
		if ( ! empty( $object_type['child_table'] ) ) {
			$child_table    = $wpdb->prefix . $object_type['child_table'];
			$child_id_field = $object_type['child_id_field'];

			$result['children'] = $wpdb->get_results(
				$wpdb->prepare(
					'SELECT * FROM `' . $child_table . '` where `' . $child_id_field . '` = %d', // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
					$object_id
				)
			);
		}

		return $result;
	}

	/**
	 * Fetch a backup of an option.
	 *
	 * @access public
	 * @static
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array
	 */
	public static function fetch_options_backup( $request ) {
		// Disable Sync as this is a read-only operation and triggered by sync activity.
		Sync_Actions::mark_sync_read_only();

		$option_names = (array) $request->get_param( 'name' );

		$options = array_map( self::class . '::get_option_row', $option_names );
		return array( 'options' => $options );
	}

	/**
	 * Fetch a backup of a comment, along with all of its metadata.
	 *
	 * @access public
	 * @static
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array
	 */
	public static function fetch_comment_backup( $request ) {
		// Disable Sync as this is a read-only operation and triggered by sync activity.
		Sync_Actions::mark_sync_read_only();

		$comment_id = $request['id'];
		$comment    = get_comment( $comment_id );

		if ( empty( $comment ) ) {
			return new WP_Error( 'comment_not_found', __( 'Comment not found', 'jetpack-backup-pkg' ), array( 'status' => 404 ) );
		}

		$allowed_keys = array(
			'comment_ID',
			'comment_post_ID',
			'comment_author',
			'comment_author_email',
			'comment_author_url',
			'comment_author_IP',
			'comment_date',
			'comment_date_gmt',
			'comment_content',
			'comment_karma',
			'comment_approved',
			'comment_agent',
			'comment_type',
			'comment_parent',
			'user_id',
		);

		$comment = array_intersect_key( $comment->to_array(), array_flip( $allowed_keys ) );

		$comment_meta = get_comment_meta( $comment['comment_ID'] );

		return array(
			'comment' => $comment,
			'meta'    => is_array( $comment_meta ) ? $comment_meta : array(),
		);
	}

	/**
	 * Fetch a backup of a post, along with all of its metadata.
	 *
	 * @access public
	 * @static
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array
	 */
	public static function fetch_post_backup( $request ) {
		global $wpdb;

		// Disable Sync as this is a read-only operation and triggered by sync activity.
		Sync_Actions::mark_sync_read_only();

		$post_id = $request['id'];
		$post    = get_post( $post_id );

		if ( empty( $post ) ) {
			return new WP_Error( 'post_not_found', __( 'Post not found', 'jetpack-backup-pkg' ), array( 'status' => 404 ) );
		}

		// Fetch terms associated with this post object.
		$terms = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT term_taxonomy_id, term_order FROM {$wpdb->term_relationships} WHERE object_id = %d;",
				$post->ID
			)
		);

		return array(
			'post'  => (array) $post,
			'meta'  => get_post_meta( $post->ID ),
			'terms' => (array) $terms,
		);
	}

	/**
	 * Fetch a backup of a term, along with all of its metadata.
	 *
	 * @access public
	 * @static
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array
	 */
	public static function fetch_term_backup( $request ) {
		// Disable Sync as this is a read-only operation and triggered by sync activity.
		Sync_Actions::mark_sync_read_only();

		$term_id = $request['id'];
		$term    = get_term( $term_id );

		if ( empty( $term ) ) {
			return new WP_Error( 'term_not_found', __( 'Term not found', 'jetpack-backup-pkg' ), array( 'status' => 404 ) );
		}

		return array(
			'term' => (array) $term,
			'meta' => get_term_meta( $term_id ),
		);
	}

	/**
	 * Fetch a backup of a user, along with all of its metadata.
	 *
	 * @access public
	 * @static
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @return array
	 */
	public static function fetch_user_backup( $request ) {
		// Disable Sync as this is a read-only operation and triggered by sync activity.
		Sync_Actions::mark_sync_read_only();

		$user_id = $request['id'];
		$user    = get_user_by( 'id', $user_id );

		if ( empty( $user ) ) {
			return new WP_Error( 'user_not_found', __( 'User not found', 'jetpack-backup-pkg' ), array( 'status' => 404 ) );
		}

		return array(
			'user' => $user->to_array(),
			'meta' => get_user_meta( $user->ID ),
		);
	}

	/**
	 * Get allowed object types for the '/database-object/backup' endpoint.
	 *
	 * @access private
	 * @static
	 *
	 * @return array
	 */
	private static function get_allowed_object_types() {
		return array(
			'woocommerce_attribute'                       => array(
				'table'    => 'woocommerce_attribute_taxonomies',
				'id_field' => 'attribute_id',
			),
			'woocommerce_downloadable_product_permission' => array(
				'table'    => 'woocommerce_downloadable_product_permissions',
				'id_field' => 'permission_id',
			),
			'woocommerce_order_item'                      => array(
				'table'     => 'woocommerce_order_items',
				'id_field'  => 'order_item_id',
				'meta_type' => 'order_item',
			),
			'woocommerce_payment_token'                   => array(
				'table'     => 'woocommerce_payment_tokens',
				'id_field'  => 'token_id',
				'meta_type' => 'payment_token',
			),
			'woocommerce_tax_rate'                        => array(
				'table'          => 'woocommerce_tax_rates',
				'id_field'       => 'tax_rate_id',
				'child_table'    => 'woocommerce_tax_rate_locations',
				'child_id_field' => 'tax_rate_id',
			),
			'woocommerce_webhook'                         => array(
				'table'    => 'wc_webhooks',
				'id_field' => 'webhook_id',
			),
		);
	}

	/**
	 * This will fetch the last rewindable event from the Activity Log and
	 * the last rewind_id prior to that.
	 */
	public static function get_site_backup_undo_event() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/activity?force=wpcom',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$body = json_decode( $response['body'], true );

		if ( ! isset( $body['current'] ) ) {
			return null;
		}

		if ( ! isset( $body['current']['orderedItems'] ) ) {
			return null;
		}

		// Preparing the response structure
		$undo_event = array(
			'last_rewindable_event' => null,
			'undo_backup_id'        => null,
		);

		// List of events that will not be considered to be undo.
		// Basically we should not `undo` a full backup event, but we could
		// use them to undo any other action like plugin updates.
		$last_event_exceptions = array(
			'rewind__backup_only_complete_full',
			'rewind__backup_only_complete_initial',
			'rewind__backup_only_complete',
			'rewind__backup_complete_full',
			'rewind__backup_complete_initial',
			'rewind__backup_complete',
		);

		// Looping through the events to find the last rewindable event and the last backup_id.
		// The idea is to find the last rewindable event and then the last rewind_id before that.
		$found_last_event = false;
		foreach ( $body['current']['orderedItems'] as $event ) {
			if ( $event['is_rewindable'] ) {
				if ( ! $found_last_event && ! in_array( $event['name'], $last_event_exceptions, true ) ) {
					$undo_event['last_rewindable_event'] = $event;
					$found_last_event                    = true;
				} elseif ( $found_last_event ) {
					$undo_event['undo_backup_id'] = $event['rewind_id'];
					break;
				}
			}
		}

		// Ensure that we have a rewindable event and a backup_id to undo.
		if ( $undo_event['last_rewindable_event'] === null || $undo_event['undo_backup_id'] === null ) {
			return null;
		}

		return rest_ensure_response( $undo_event );
	}

	/**
	 * Fetch a backup of a order, along with all of its data.
	 *
	 * @access public
	 * @static
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return array
	 */
	public static function fetch_wc_orders_backup( $request ) {
		global $wpdb;

		// Disable Sync as this is a read-only operation and triggered by sync activity.
		Sync_Actions::mark_sync_read_only();

		$order_id = $request['id'];

		$order                  = array();
		$order_addresses        = array();
		$order_operational_data = array();
		$order_meta             = array();

		if ( ! class_exists( OrdersTableDataStore::class ) ) {
			return new WP_Error( 'order_not_allowed', __( 'Not allowed to get the order with current configuration', 'jetpack-backup-pkg' ), array( 'status' => 403 ) );
		}

		if ( method_exists( OrdersTableDataStore::class, 'get_orders_table_name' ) ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared
			$order = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM `' . OrdersTableDataStore::get_orders_table_name() . '` WHERE id = %s', $order_id ) );
		}

		if ( empty( $order ) ) {
			// No order in HPOS
			return new WP_Error( 'order_not_found', __( 'Order not found ', 'jetpack-backup-pkg' ), array( 'status' => 404 ) );
		}

		if ( method_exists( OrdersTableDataStore::class, 'get_addresses_table_name' ) ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared
			$order_addresses = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM `' . OrdersTableDataStore::get_addresses_table_name() . '` WHERE order_id = %s', $order_id ) );
		}

		if ( method_exists( OrdersTableDataStore::class, 'get_operational_data_table_name' ) ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared
			$order_operational_data = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM `' . OrdersTableDataStore::get_operational_data_table_name() . '` WHERE order_id = %s', $order_id ) );
		}

		if ( method_exists( OrdersTableDataStore::class, 'get_meta_table_name' ) ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared
			$order_meta = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM `' . OrdersTableDataStore::get_meta_table_name() . '` WHERE order_id = %s', $order_id ) );
		}

		return array(
			'order'                  => (array) $order,
			'order_addresses'        => (array) $order_addresses,
			'order_operational_data' => (array) $order_operational_data,
			'order_meta'             => (array) $order_meta,
		);
	}

	/**
	 * Fetch backup preflight status
	 *
	 * @return array
	 */
	public static function get_site_backup_preflight() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/rewind/preflight?force=wpcom',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'wp_error_fetch_preflight',
				$response->get_error_message(),
				array( 'status' => 500 )
			);
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			return new WP_Error(
				'http_error_fetch_preflight',
				wp_remote_retrieve_response_message( $response ),
				array( 'status' => $response_code )
			);
		}

		$body = json_decode( $response['body'], true );
		return rest_ensure_response( $body );
	}

	/**
	 * Fetch option row by option name.
	 *
	 * @access private
	 * @static
	 *
	 * @param string $name The option name.
	 * @return object|null Database query result as object format specified or null on failure.
	 */
	private static function get_option_row( $name ) {
		global $wpdb;
		return $wpdb->get_row( $wpdb->prepare( "select * from `{$wpdb->options}` where option_name = %s", $name ) );
	}
}
