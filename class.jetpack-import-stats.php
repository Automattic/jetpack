<?php

require_once dirname( __FILE__ ) . '/sync/class.jetpack-sync-functions.php';

class Jetpack_Import_Stats {
	/**
	 * A mapping of known importers to friendly names.
	 * Keys are the class name of the known importer.
	 * Values are the friendly name.
	 * @var array
	 */
	private static $known_importers = array(
		'Blogger_Importer' => 'blogger',
		'LJ_API_Import' => 'livejournal',
		'MT_Import' => 'mt',
		'RSS_Import' => 'rss',
		'WC_Tax_Rate_Importer' => 'woo-tax-rate',
		'WP_Import' => 'wordpress',
	);

	/**
	 * A mapping of action types to event name.
	 * Keys are the name of the action.
	 * Values are the event name recorded for that action.
	 * @var array
	 */
	private static $action_event_name_map = array(
		'import_start' => 'jetpack_import_start',
		'import_done'  => 'jetpack_import_done',
		'import_end'   => 'jetpack_import_done',
	);

	public static function init() {
		// Only handle import actions for sites that have agreed to TOS 
		if ( Jetpack::jetpack_tos_agreed() ) {
			add_action( 'import_start', array( 'Jetpack_Import_Stats', 'log_import_progress' ) );
			add_action( 'import_done',  array( 'Jetpack_Import_Stats', 'log_import_progress' ) );
			add_action( 'import_end',   array( 'Jetpack_Import_Stats', 'log_import_progress' ) );
		}
	}

	public static function log_import_progress( $importer ) {
		// prefer self-reported importer-names
		if ( ! $importer ) {
			// fall back to inferring by calling class name
			$importer = Jetpack_Sync_Functions::get_calling_importer_class();
		}
		
		// Give known importers a "friendly" name
		if ( isset( self::$known_importers[ $importer ] ) ) {
			$importer = self::$known_importers[ $importer ];
		}
		$action = current_filter();
		// map action to event name
		$event_name = self::$action_event_name_map[ $action ];
		
		$current_user = wp_get_current_user();

		// Record event to Tracks
		jetpack_tracks_record_event( $current_user, $event_name, array(
			'importer' => $importer,
		) );
	}
}

add_action( 'init', array( 'Jetpack_Import_Stats', 'init' ) );
