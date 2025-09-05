<?php //phpcs:ignore

namespace Automattic\WpcomMcp;

use WP\MCP\Core\McpAdapter;

/**
 * WpcomMcp class.
 */
class WpcomMcp {

	/**
	 * The instance of the WpcomMcp class.
	 *
	 * @var WpcomMcp|null
	 */
	private static ?WpcomMcp $instance = null;

	/**
	 * The plugin directory.
	 *
	 * @var string
	 */
	private string $plugin_dir;

	/**
	 * The MCP adapter instance.
	 *
	 * @var McpAdapter|null
	 */
	private ?McpAdapter $mcp_adapter = null;

	/**
	 * Get the instance of the WpcomMcp class.
	 *
	 * @return WpcomMcp
	 */
	public static function instance(): WpcomMcp {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Get the instance of the WpcomMcp class.
	 *
	 * @return WpcomMcp|null
	 */
	public static function get_instance(): ?WpcomMcp {
		return self::instance();
	}

	/**
	 * Reset the singleton instance (for testing purposes only).
	 *
	 * @return void
	 */
	public static function reset_instance(): void {
		self::$instance = null;
	}

	/**
	 * Set the plugin directory.
	 *
	 * @param string $plugin_dir The plugin directory.
	 *
	 * @return WpcomMcp
	 */
	public function set_plugin_dir( string $plugin_dir ): WpcomMcp {
		$this->plugin_dir = $plugin_dir;

		return $this;
	}

	/**
	 * Register the plugin.
	 *
	 * @return WpcomMcp
	 */
	public function register(): WpcomMcp {
		spl_autoload_register( array( $this, 'autoload' ) );
		$this->mcp_adapter = McpAdapter::instance();

		return $this;
	}

	/**
	 * Get the MCP adapter instance.
	 *
	 * @return McpAdapter
	 */
	public function get_mcp_adapter(): McpAdapter {
		if ( null === $this->mcp_adapter ) {
			$this->mcp_adapter = McpAdapter::instance();
		}

		return $this->mcp_adapter;
	}

	/**
	 * Autoloader for SDK classes.
	 *
	 * @param string $class_name class name to autoload.
	 *
	 * @return void
	 */
	private function autoload( string $class_name ): void {
		// Check if it's one of our classes.
		if ( ! str_starts_with( $class_name, 'Automattic\\WpcomMcp\\' ) ) {
			return;
		}

		// Convert class name to file path.
		$class_file = str_replace( '\\', DIRECTORY_SEPARATOR, $class_name );
		$class_file = str_replace( 'Automattic' . DIRECTORY_SEPARATOR . 'WpcomMcp' . DIRECTORY_SEPARATOR, '', $class_file );

		// Include the class file.
		$file_path = $this->plugin_dir . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . $class_file . '.php';
		require_once $file_path;
	}
}
