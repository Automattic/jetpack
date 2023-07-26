<?php

class JetPack_Styles extends WP_Styles {

	/**
	 * Constructor.
	 *
	 * @since 2.6.0
	 */
	public function __construct() {
		parent::__construct();
		global $wp_styles;
		$wp_styles = $this;
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
				$instance->add_style( $item );
			}

			$path = $instance->get_style_path();
			$hash = $instance->get_style_hash();
			if ( ! file_exists( $path ) ) {
				$instance->build_cache( 'style' );
			}

			wp_register_style( $hash, $instance->get_style_url(), array(), filemtime( $path ) );
			foreach ( $instance->enqueued_styles as $style ) {
				$instance->prep_inline_styles( $style );
			}
			$this->queue[] = $hash;
			$hashes[]      = $hash;
		}

		return parent::do_items( $handles, $group );
	}

}
