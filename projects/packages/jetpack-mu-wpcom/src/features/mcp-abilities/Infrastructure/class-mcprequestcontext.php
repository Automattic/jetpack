<?php
/**
 * MCP Request Context for storing current request data.
 *
 * @package McpAdapter
 */

declare( strict_types=1 );

namespace Automattic\WpcomMcp\Infrastructure;

/**
 * Class McpRequestContext
 *
 * Singleton class to store the current MCP request data for access
 * throughout the request lifecycle, particularly in observability handlers.
 */
class McpRequestContext {

	/**
	 * The singleton instance.
	 *
	 * @var McpRequestContext|null
	 */
	private static ?McpRequestContext $instance = null;

	/**
	 * The current request body data.
	 *
	 * @var array|null
	 */
	private ?array $request_body = null;

	/**
	 * The current request method.
	 *
	 * @var string|null
	 */
	private ?string $request_method = null;

	/**
	 * Private constructor to prevent direct instantiation.
	 */
	private function __construct() {}

	/**
	 * Get the singleton instance.
	 *
	 * @return McpRequestContext
	 */
	public static function get_instance(): McpRequestContext {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Set the current request data.
	 *
	 * @param array  $request_body The parsed request body.
	 * @param string $request_method The request method.
	 *
	 * @return void
	 */
	public function set_request_data( array $request_body, string $request_method ): void {
		$this->request_body   = $request_body;
		$this->request_method = $request_method;
	}

	/**
	 * Get the current request body.
	 *
	 * @return array|null
	 */
	public function get_request_body(): ?array {
		return $this->request_body;
	}

	/**
	 * Get the current request method.
	 *
	 * @return string|null
	 */
	public function get_request_method(): ?string {
		return $this->request_method;
	}

	/**
	 * Clear the current request data.
	 *
	 * @return void
	 */
	public function clear(): void {
		$this->request_body   = null;
		$this->request_method = null;
	}

	/**
	 * Get the request body as a compact JSON string.
	 *
	 * @return string|null
	 */
	public function get_request_body_json(): ?string {
		if ( null === $this->request_body ) {
			return null;
		}

		return wp_json_encode( $this->request_body, JSON_UNESCAPED_SLASHES );
	}
}
