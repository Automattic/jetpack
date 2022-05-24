<?php // phpcs:ignore WordPress.Files.FileName

require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader-skin.php';

class Silent_Upgrader_Skin extends WP_Upgrader_Skin {
	/**
	 * Can the theme be overwritten.
	 *
	 * @var bool|string
	 */
	public $overwrite;

	/**
	 * Constructor
	 *
	 * @param array $args Options.
	 */
	public function __construct( $args = array() ) {
		$defaults      = array(
			'url'       => '',
			'nonce'     => '',
			'title'     => '',
			'context'   => false,
			'overwrite' => '',
		);
		$this->options = wp_parse_args( $args, $defaults );
	}

	public function feedback( $string, ...$args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

	}

	public function header() {
	}

	public function footer() {
	}

	public function decrement_update_count( $arg ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	}
}

