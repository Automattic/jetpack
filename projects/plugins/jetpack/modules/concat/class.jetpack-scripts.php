<?php

class JetPack_Scripts extends WP_Scripts {

	/**
	 * Constructor.
	 *
	 * @since 2.6.0
	 */
	public function __construct() {
		parent::__construct();
		global $wp_scripts;
		$wp_scripts = $this;
	}

	/**
	 * Processes the items and dependencies.
	 *
	 * Processes the items passed to it or the queue, and their dependencies.
	 *
	 * @param string|string[]|false $handles Optional. Items to be processed: queue (false),
	 *                                       single item (string), or multiple items (array of strings).
	 *                                       Default false.
	 * @param int|false             $group   Optional. Group level: level (int), no group (false).
	 *
	 * @return string[] Array of handles of items that have been processed.
	 */
	public function do_items( $handles = false, $group = false ) {

		static $hashes = array();
		$instance = Jetpack_Concat::get_instance();
		$items    = false === $handles ? $this->queue : (array) $handles;
		$items    = array_diff( $items, $hashes );

		if ( ! empty( $items ) ) {
			foreach ( $items as $item ) {
				$instance->add_script( $item );
			}

			$path = $instance->get_script_path();
			$hash = $instance->get_script_hash();
			if ( ! file_exists( $path ) ) {
				$instance->build_cache( 'script' );
			}
			wp_register_script( $hash, $instance->get_script_url(), array(), filemtime( $path ), true );
			foreach ( $instance->enqueued_scripts as $script ) {
				$instance->prep_inline_scripts( $script );
			}
			$this->queue = [ $hash ];
			$hashes[]    = $hash;
		}

		return parent::do_items( $handles, $group );
	}

}
