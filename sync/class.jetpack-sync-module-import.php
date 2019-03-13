<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-functions.php';

class Jetpack_Sync_Module_Import extends Jetpack_Sync_Module {

	private $import_end = false;

	public function name() {
		return 'import';
	}

	public function init_listeners( $callable ) {
		add_action( 'export_wp', $callable );
		add_action( 'jetpack_sync_import_end', $callable, 10, 2 );

		// Movable type, RSS, Livejournal
		add_action( 'import_done', array( $this, 'sync_import_done' ) );

		// WordPress, Blogger, Livejournal, woo tax rate
		add_action( 'import_end', array( $this, 'sync_import_end' ) );
	}

	public function set_defaults() {
		$this->import_end = false;
	}

	public function sync_import_done( $importer ) {
		// We already ran an send the import
		if ( $this->import_end ) {
			return;
		}

		$importer_name = $this->get_importer_name( $importer );

		/**
		 * Sync Event that tells that the import is finished
		 *
		 * @since 5.0.0
		 *
		 * $param string $importer
		 */
		do_action( 'jetpack_sync_import_end', $importer, $importer_name );
		$this->import_end = true;
	}

	public function sync_import_end() {
		// We already ran an send the import
		if ( $this->import_end ) {
			return;
		}

		$this->import_end = true;
		$importer_class   = Jetpack_Sync_Functions::get_calling_importer_class();

		switch( $importer_class ) {
			case 'Blogger_Importer':
				$importer = 'blogger';
				break;

			case 'WC_Tax_Rate_Importer':
				$importer = 'woo-tax-rate';
				break;

			case 'WP_Import':
				// phpcs:ignore WordPress.WP.CapitalPDangit
				$importer = 'wordpress';
				break;

			default:
				$importer = 'unknown';
				break;
		}

		$importer_name = $this->get_importer_name( $importer );

		/** This filter is already documented in sync/class.jetpack-sync-module-posts.php */
		do_action( 'jetpack_sync_import_end', $importer, $importer_name );
	}

	private function get_importer_name( $importer ) {
		$importers = get_importers();
		return isset( $importers[ $importer ] ) ? $importers[ $importer ][0] : 'Unknown Importer';
	}

}
