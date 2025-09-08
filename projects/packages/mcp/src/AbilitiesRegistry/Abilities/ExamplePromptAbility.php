<?php //phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Abilities;

use Exception;
use WP_Error;

/**
 * Sample Prompt Ability Class
 *
 * Handles the analyze_website_performance prompt functionality.
 */
class ExamplePromptAbility {

	/**
	 * Constructor - registers the ability.
	 */
	public function __construct() {
		wp_register_ability(
			'wpcom-mcp/sample-prompt',
			$this->get_config()
		);
	}

	/**
	 * Get the ability configuration array.
	 *
	 * @return array The ability configuration.
	 */
	public function get_config(): array {
		return array(
			'label'               => 'Analyze Website Performance',
			'description'         => 'Analyze website performance data and provide optimization recommendations',
			'input_schema'        => array(),
			'output_schema'       => array(),
			'execute_callback'    => array( $this, 'execute' ),
			'permission_callback' => array( $this, 'check_permission' ),
			'meta'                => array(
				'arguments' => array(
					array(
						'name'        => 'time_period',
						'description' => 'Time period to analyze (e.g., "last 7 days", "last month")',
						'required'    => true,
					),
				),
				'messages'  => array(
					array(
						'role'    => 'user',
						'content' => array(
							'type' => 'text',
							'text' => 'Analyze the website performance for {{time_period}}. Provide detailed insights and actionable recommendations for improving performance.',
						),
					),
				),
			),
		);
	}

	/**
	 * Execute the sample prompt ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return array|WP_Error The prompt result or error.
	 */
	public function execute( array $input = array() ) {
		try {
			// For prompt abilities, we typically return the prompt configuration
			// rather than executing business logic, as the actual execution
			// is handled by the MCP prompt system.
			$time_period = $input['time_period'] ?? '';

			if ( empty( $time_period ) ) {
				return new WP_Error(
					'missing_time_period',
					'Time period is required for performance analysis',
					array( 'status' => 400 )
				);
			}

			// Get the messages array with replacements.
			$config   = $this->get_config();
			$messages = $config['meta']['messages'];

			// Replace placeholders in the messages.
			foreach ( $messages as &$message ) {
				if ( isset( $message['content']['text'] ) ) {
					$message['content']['text'] = str_replace( '{{time_period}}', $time_period, $message['content']['text'] );
				}
			}

			// Return structured data that can be used by the prompt system.
			return array(
				'description' => $config['description'],
				'messages'    => $messages,
			);

		} catch ( Exception $e ) {
			return new WP_Error(
				'prompt_error',
				'An error occurred while preparing the prompt: ' . $e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Check permission for the sample prompt ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool {
		// Suppress unused variable warning - parameter required by interface.
		unset( $input );

		$current_user = wp_get_current_user();

		// User must be logged in to use prompts.
		if ( ! $current_user || ! $current_user->exists() ) {
			return false;
		}

		// Additional permission checks could be added here
		// For example, checking if user has specific capabilities:
		// return current_user_can( 'manage_options' );.

		return true;
	}
}
