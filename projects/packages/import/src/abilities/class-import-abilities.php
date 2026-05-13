<?php
/**
 * Jetpack Import Abilities Registration.
 *
 * Registers Jetpack Import abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-import
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Import\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;

/**
 * Registers Jetpack Import abilities with the WordPress Abilities API.
 *
 * The Import package is the backend half of the WPCOM Unified Importer — it
 * exposes a set of stateless `/jetpack/v4/import/*` REST endpoints that the
 * remote importer calls to create posts, pages, comments, menus, templates,
 * etc. on the destination site. There is no job queue, no persistent job
 * state, and no agent-actionable list of "imports". The two lifecycle
 * endpoints that *are* agent-meaningful are:
 *
 *   - `/import/start` — returns environment limits the importer needs to plan
 *     batches (max batch size, max execution time, allowed mime types, the
 *     current posts auto-increment ID). Stateless read.
 *   - `/import/end`   — purges the `_jetpack_import_id` tracking meta from
 *     `postmeta`, `commentmeta`, and `termmeta` after an import finishes.
 *     Stateless destructive.
 *
 * Those two endpoints map cleanly to two abilities. The per-entity create
 * endpoints (posts, pages, comments, ...) are deliberately *not* exposed as
 * abilities — they're a private RPC surface for the Unified Importer
 * orchestrator, not something an agent would call directly.
 */
class Import_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-import';
	const ERROR_PREFIX  = 'jetpack_import_';

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
			'label'       => 'Jetpack Import',
			'description' => __( 'Abilities for inspecting the Jetpack Import environment and cleaning up tracking meta after a content import.', 'jetpack-import' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-import/get-config'   => self::spec_get_config(),
			'jetpack-import/cleanup-meta' => self::spec_cleanup_meta(),
		);
	}

	/**
	 * Spec: jetpack-import/get-config.
	 */
	private static function spec_get_config(): array {
		return array(
			'label'               => __( 'Get Jetpack Import configuration', 'jetpack-import' ),
			'description'         => __(
				'Return the environment limits the Jetpack Import package reports to the WPCOM Unified Importer when an import starts. Zero-argument read. Shape: { max_batch_items, max_execution_time, max_input_time, mime_types, posts_max_id, version }. `max_batch_items` is the REST batch ceiling, `max_execution_time` and `max_input_time` are the PHP ini values in seconds (0 when unlimited), `mime_types` is the array of upload-accepted mime types from `get_allowed_mime_types()`, `posts_max_id` is the current `MAX(ID)` of `wp_posts` (the importer uses this as a watermark to distinguish pre-existing vs. imported posts), and `version` is the package version. Requires the `import` capability — same gate as wp-admin/import.php and the underlying REST endpoint.',
				'jetpack-import'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'max_batch_items'    => array( 'type' => 'integer' ),
					'max_execution_time' => array( 'type' => 'integer' ),
					'max_input_time'     => array( 'type' => 'integer' ),
					'mime_types'         => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
					'posts_max_id'       => array( 'type' => 'integer' ),
					'version'            => array( 'type' => 'string' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_config' ),
			'permission_callback' => array( __CLASS__, 'can_import' ),
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

	/**
	 * Spec: jetpack-import/cleanup-meta.
	 */
	private static function spec_cleanup_meta(): array {
		return array(
			'label'               => __( 'Clean up Jetpack Import tracking meta', 'jetpack-import' ),
			'description'         => __(
				'Delete the `_jetpack_import_id` tracking meta the Jetpack Import package writes to `postmeta`, `commentmeta`, and `termmeta` while importing content from a source site. Call this after the WPCOM Unified Importer finishes importing a site — it removes the cross-reference rows that map source IDs to destination IDs and serves no purpose once the import is complete. Idempotent: a second call returns zero counts because there is nothing left to delete. Destructive in the sense that the rows cannot be restored, but the rows are pure tracking metadata — no user content is touched. Shape: { postmeta_count, commentmeta_count, termmeta_count, changed } where each `*_count` is the number of rows deleted from that table (0 when nothing matched, false-equivalent on a DB error from `$wpdb->delete()`), and `changed` is true when any of the three counts is greater than zero. Requires the `import` capability.',
				'jetpack-import'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'postmeta_count'    => array( 'type' => 'integer' ),
					'commentmeta_count' => array( 'type' => 'integer' ),
					'termmeta_count'    => array( 'type' => 'integer' ),
					'changed'           => array( 'type' => 'boolean' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'cleanup_meta' ),
			'permission_callback' => array( __CLASS__, 'can_import' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => false,
					'destructive' => true,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Permission callback. Mirrors the REST controller's
	 * `import_permissions_callback()` exactly — the `import` capability is the
	 * same gate `wp-admin/import.php` uses, and reusing it here means the
	 * abilities can't accidentally widen the surface beyond what the REST
	 * endpoints already expose.
	 *
	 * @return bool
	 */
	public static function can_import(): bool {
		return current_user_can( 'import' );
	}

	/**
	 * Execute: get-config. Zero-arg snapshot of the import environment.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array
	 */
	public static function get_config( $input = null ) {
		unset( $input );

		return array(
			'max_batch_items'    => (int) apply_filters( 'rest_get_max_batch_size', 25 ),
			'max_execution_time' => (int) ini_get( 'max_execution_time' ),
			'max_input_time'     => (int) ini_get( 'max_input_time' ),
			'mime_types'         => array_values( get_allowed_mime_types() ),
			'posts_max_id'       => static::get_posts_max_id(),
			'version'            => \Automattic\Jetpack\Import\Main::PACKAGE_VERSION,
		);
	}

	/**
	 * Execute: cleanup-meta. Removes `_jetpack_import_id` rows across the three
	 * meta tables.
	 *
	 * Mirrors `Endpoints\End::cleanup_database()` so the ability and the REST
	 * route produce identical side effects. `$wpdb->delete()` returns false on
	 * a DB error and an integer otherwise; the spec advertises integers, so
	 * coerce false to 0 and report `changed` based on the post-coercion sum.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array|WP_Error
	 */
	public static function cleanup_meta( $input = null ) {
		unset( $input );

		global $wpdb;

		if ( ! isset( $wpdb ) || ! is_object( $wpdb ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'wpdb_unavailable',
				__( 'The WordPress database connection is not available.', 'jetpack-import' )
			);
		}

		$where = array( 'meta_key' => '_jetpack_import_id' );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$postmeta    = $wpdb->delete( $wpdb->postmeta, $where );
		$commentmeta = $wpdb->delete( $wpdb->commentmeta, $where );
		$termmeta    = $wpdb->delete( $wpdb->termmeta, $where );
		// phpcs:enable

		$postmeta    = false === $postmeta ? 0 : (int) $postmeta;
		$commentmeta = false === $commentmeta ? 0 : (int) $commentmeta;
		$termmeta    = false === $termmeta ? 0 : (int) $termmeta;

		return array(
			'postmeta_count'    => $postmeta,
			'commentmeta_count' => $commentmeta,
			'termmeta_count'    => $termmeta,
			'changed'           => ( $postmeta + $commentmeta + $termmeta ) > 0,
		);
	}

	/**
	 * Read the current `MAX(ID)` of `wp_posts`. Extracted as a protected seam
	 * so tests can stub the lookup without standing up a fixture post.
	 *
	 * @return int
	 */
	protected static function get_posts_max_id(): int {
		global $wpdb;
		if ( ! isset( $wpdb ) || ! is_object( $wpdb ) ) {
			return 0;
		}
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$max_id = $wpdb->get_var( "SELECT MAX(ID) FROM {$wpdb->posts}" );
		// phpcs:enable
		return (int) $max_id;
	}
}
