<?php

require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader-skin.php';

class Silent_Upgrader_Skin extends WP_Upgrader_Skin {

	/**
	 * @param array $args
	 */
	public function __construct( $args = array() ) {
		$defaults      = array(
			'url'     => '',
			'nonce'   => '',
			'title'   => '',
			'context' => false,
		);
		$this->options = wp_parse_args( $args, $defaults );
	}

	public function feedback( $string, ...$args ) {

	}

	public function header() {
	}

	public function footer() {
	}

	public function decrement_update_count( $arg ) {
	}
}

