<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-functions.php';

class Jetpack_Sync_Module_Import extends Jetpack_Sync_Module {

	/**
	 * Tracks which actions have already been synced for the import
	 * to prevent the same event from being triggered a second time
	 * @var array
	 */
	private $synced_actions = array();

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
	 * A mapping of action types to sync action name.
	 * Keys are the name of the import action.
	 * Values are the resulting sync action.
	 * @var array
	 */
	private static $import_sync_action_map = array(
		'import_start' => 'jetpack_sync_import_start',
		'import_done'  => 'jetpack_sync_import_end',
		'import_end'   => 'jetpack_sync_import_end',
	);

	public function name() {
		return 'import';
	}

	public function init_listeners( $callable ) {
		add_action( 'export_wp', $callable );
		add_action( 'jetpack_sync_import_start', $callable, 10, 2 );
		add_action( 'jetpack_sync_import_end',   $callable, 10, 2 );

		// WordPress
		add_action( 'import_start', array( $this, 'sync_import_action' ) );

		// Movable type, RSS, Livejournal
		add_action( 'import_done',  array( $this, 'sync_import_action' ) );

		// WordPress, Blogger, Livejournal, woo tax rate
		add_action( 'import_end',   array( $this, 'sync_import_action' ) );
	}

	public function set_defaults() {
		$this->synced_actions = array();
	}

	public function sync_import_action( $importer ) {
		$import_action = current_filter();
		// map action to event name
		$sync_action = self::$import_sync_action_map[ $import_action ];

		// Only sync each action once per import
		if ( array_key_exists( $sync_action, $this->synced_actions ) && $this->synced_actions[ $sync_action ] ) {
			return;
		}

		// Mark this action as synced
		$this->synced_actions[ $sync_action ] = true;

		// prefer self-reported $importer value
		if ( ! $importer ) {
			// fall back to inferring by calling class name
			$importer = Jetpack_Sync_Functions::get_calling_importer_class();
		}

		// Get $importer from known_importers
		if ( isset( self::$known_importers[ $importer ] ) ) {
			$importer = self::$known_importers[ $importer ];
		}

		$importer_name = $this->get_importer_name( $importer );

		do_action( $sync_action, $importer, $importer_name );
	}

	private function get_importer_name( $importer ) {
		$importers = get_importers();
		return isset( $importers[ $importer ] ) ? $importers[ $importer ][0] : 'Unknown Importer';
	}
}
