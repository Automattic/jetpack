<?php
/**
 * Viewer history in a versioned table of the site.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Self-hosted storage: `{prefix}videopress_viewer_history`, unique on viewer and GUID, indexed
 * by viewer and last activity. The table belongs to the site's prefix, so the site is implied.
 */
class Table_History_Store implements History_Store {

	const TABLE          = 'videopress_viewer_history';
	const SCHEMA_VERSION = 1;
	const VERSION_OPTION = 'videopress_viewer_history_schema';

	/**
	 * The table name.
	 *
	 * @return string
	 */
	public static function table() {
		global $wpdb;
		return $wpdb->prefix . self::TABLE;
	}

	/**
	 * Whether the table exists yet; it is created on the first write.
	 *
	 * @return bool
	 */
	public static function is_installed() {
		return (int) get_option( self::VERSION_OPTION, 0 ) >= self::SCHEMA_VERSION;
	}

	/**
	 * Create or upgrade the table when its schema version is behind.
	 *
	 * @return void
	 */
	public static function maybe_install() {
		if ( self::is_installed() ) {
			return;
		}
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$table   = self::table();
		$charset = $wpdb->get_charset_collate();
		dbDelta(
			"CREATE TABLE {$table} (
				user_id bigint(20) unsigned NOT NULL,
				guid varchar(8) NOT NULL,
				position_ms int(10) unsigned NOT NULL DEFAULT 0,
				duration_ms int(10) unsigned NOT NULL DEFAULT 0,
				watched_ms int(10) unsigned NOT NULL DEFAULT 0,
				intervals text NOT NULL,
				completed tinyint(1) NOT NULL DEFAULT 0,
				manual varchar(10) NOT NULL DEFAULT '',
				legacy_seen tinyint(1) NOT NULL DEFAULT 0,
				generation int(10) unsigned NOT NULL DEFAULT 0,
				session varchar(40) NOT NULL DEFAULT '',
				seq int(10) unsigned NOT NULL DEFAULT 0,
				deleted tinyint(1) NOT NULL DEFAULT 0,
				updated bigint(20) unsigned NOT NULL DEFAULT 0,
				schema_version smallint(5) unsigned NOT NULL DEFAULT 1,
				PRIMARY KEY  (user_id,guid),
				KEY user_updated (user_id,updated,guid),
				KEY updated (updated)
			) {$charset};"
		);
		update_option( self::VERSION_OPTION, self::SCHEMA_VERSION, false );
	}

	/**
	 * A database row as a history row.
	 *
	 * @param array|null $row Database row.
	 * @return array|null
	 */
	private static function hydrate( $row ) {
		if ( ! is_array( $row ) ) {
			return null;
		}
		$intervals = json_decode( (string) $row['intervals'], true );
		return array(
			'user_id'     => (int) $row['user_id'],
			'guid'        => (string) $row['guid'],
			'position_ms' => (int) $row['position_ms'],
			'duration_ms' => (int) $row['duration_ms'],
			'watched_ms'  => (int) $row['watched_ms'],
			'intervals'   => is_array( $intervals ) ? $intervals : array(),
			'completed'   => (bool) $row['completed'],
			'manual'      => (string) $row['manual'],
			'legacy_seen' => (bool) $row['legacy_seen'],
			'generation'  => (int) $row['generation'],
			'session'     => (string) $row['session'],
			'seq'         => (int) $row['seq'],
			'deleted'     => (bool) $row['deleted'],
			'updated'     => (int) $row['updated'],
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param int    $user_id Viewer.
	 * @param string $guid    VideoPress GUID.
	 * @return array|null
	 */
	public function get( $user_id, $guid ) {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return null;
		}
		$table = self::table();
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery -- Table name is not user input; rows change on every playback.
		return self::hydrate( $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE user_id = %d AND guid = %s", $user_id, $guid ), ARRAY_A ) );
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param int      $user_id Viewer.
	 * @param string[] $guids   GUIDs.
	 * @return array<string, array>
	 */
	public function get_many( $user_id, array $guids ) {
		global $wpdb;
		$guids = array_values( array_unique( array_filter( $guids, 'is_string' ) ) );
		if ( ! $guids || ! self::is_installed() ) {
			return array();
		}
		$table        = self::table();
		$placeholders = implode( ',', array_fill( 0, count( $guids ), '%s' ) );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders, WordPress.DB.DirectDatabaseQuery -- Placeholders built above.
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$table} WHERE user_id = %d AND deleted = 0 AND guid IN ({$placeholders})", array_merge( array( $user_id ), $guids ) ), ARRAY_A );
		$out  = array();
		foreach ( (array) $rows as $row ) {
			$row = self::hydrate( $row );
			if ( $row ) {
				$out[ $row['guid'] ] = $row;
			}
		}
		return $out;
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param array $row Row.
	 * @return bool
	 */
	public function save( array $row ) {
		global $wpdb;
		self::maybe_install();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Rows change on every playback; not cacheable.
		return false !== $wpdb->replace(
			self::table(),
			array(
				'user_id'        => (int) $row['user_id'],
				'guid'           => (string) $row['guid'],
				'position_ms'    => (int) $row['position_ms'],
				'duration_ms'    => (int) $row['duration_ms'],
				'watched_ms'     => (int) $row['watched_ms'],
				'intervals'      => (string) wp_json_encode( array_values( $row['intervals'] ), JSON_UNESCAPED_SLASHES ),
				'completed'      => $row['completed'] ? 1 : 0,
				'manual'         => (string) $row['manual'],
				'legacy_seen'    => $row['legacy_seen'] ? 1 : 0,
				'generation'     => (int) $row['generation'],
				'session'        => (string) $row['session'],
				'seq'            => (int) $row['seq'],
				'deleted'        => $row['deleted'] ? 1 : 0,
				'updated'        => (int) $row['updated'],
				'schema_version' => self::SCHEMA_VERSION,
			),
			array( '%d', '%s', '%d', '%d', '%d', '%s', '%d', '%s', '%d', '%d', '%s', '%d', '%d', '%d', '%d' )
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param int        $user_id Viewer.
	 * @param int        $limit   Most rows.
	 * @param array|null $after   Cursor.
	 * @return array[]
	 */
	public function list_recent( $user_id, $limit, $after = null ) {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return array();
		}
		$table = self::table();
		if ( is_array( $after ) && 2 === count( $after ) ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery -- Table name is not user input.
			$sql = $wpdb->prepare( "SELECT * FROM {$table} WHERE user_id = %d AND deleted = 0 AND ( updated < %d OR ( updated = %d AND guid > %s ) ) ORDER BY updated DESC, guid ASC LIMIT %d", $user_id, $after[0], $after[0], $after[1], $limit );
		} else {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery -- Table name is not user input.
			$sql = $wpdb->prepare( "SELECT * FROM {$table} WHERE user_id = %d AND deleted = 0 ORDER BY updated DESC, guid ASC LIMIT %d", $user_id, $limit );
		}
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery -- Prepared above.
		return array_map( array( __CLASS__, 'hydrate' ), (array) $wpdb->get_results( $sql, ARRAY_A ) );
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param int $user_id Viewer.
	 * @return int
	 */
	public function delete_all( $user_id ) {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return 0;
		}
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- Erasure.
		return (int) $wpdb->delete( self::table(), array( 'user_id' => (int) $user_id ), array( '%d' ) );
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param int $before           Unix time for rows.
	 * @param int $tombstone_before Unix time for tombstones.
	 * @return int
	 */
	public function purge( $before, $tombstone_before ) {
		global $wpdb;
		if ( ! self::is_installed() ) {
			return 0;
		}
		$table = self::table();
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery -- Retention purge.
		return (int) $wpdb->query( $wpdb->prepare( "DELETE FROM {$table} WHERE updated < %d OR ( deleted = 1 AND updated < %d )", $before, $tombstone_before ) );
	}
}
