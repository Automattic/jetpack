<?php
/**
 * WordPress Ability Tool for Neuron AI.
 *
 * @package automattic/jetpack-ai-poc
 */

use NeuronAI\Tools\Tool;
use NeuronAI\Tools\ToolProperty;
use NeuronAI\Tools\PropertyType;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_AI_POC_Ability_Tool
 *
 * Wraps a WordPress Ability as a Neuron AI Tool.
 */
class Jetpack_AI_POC_Ability_Tool extends Tool {

	/**
	 * The WordPress Ability object.
	 *
	 * @var WP_Ability
	 */
	private $ability;

	/**
	 * Constructor.
	 *
	 * @param WP_Ability $ability WordPress Ability object.
	 */
	public function __construct( $ability ) {
		$this->ability = $ability;

		parent::__construct(
			str_replace( '/', '_', $ability->get_name() ),
			$ability->get_description()
		);
	}

	/**
	 * Define the tool's input properties from the WordPress Ability's input schema.
	 *
	 * @return array
	 */
	protected function properties(): array {
		$input_schema = $this->ability->get_input_schema();
		$properties   = array();

		if ( ! isset( $input_schema['properties'] ) || ! is_array( $input_schema['properties'] ) ) {
			return $properties;
		}

		$required = isset( $input_schema['required'] ) ? $input_schema['required'] : array();

		foreach ( $input_schema['properties'] as $name => $prop_schema ) {
			$type        = isset( $prop_schema['type'] ) ? $this->map_json_schema_type_to_neuron( $prop_schema['type'] ) : PropertyType::STRING;
			$description = isset( $prop_schema['description'] ) ? $prop_schema['description'] : '';
			$enum        = isset( $prop_schema['enum'] ) ? $prop_schema['enum'] : array();
			$is_required = in_array( $name, $required, true );

			$property = new ToolProperty(
				name: $name,
				type: $type,
				description: $description,
				required: $is_required,
				enum: $enum
			);

			$properties[] = $property;
		}

		return $properties;
	}

	/**
	 * Map JSON Schema type to Neuron PropertyType.
	 *
	 * @param string $json_type JSON Schema type.
	 * @return PropertyType
	 */
	private function map_json_schema_type_to_neuron( $json_type ) {
		return match ( $json_type ) {
			'string' => PropertyType::STRING,
			'number', 'integer' => PropertyType::NUMBER,
			'boolean' => PropertyType::BOOLEAN,
			'array' => PropertyType::ARRAY,
			'object' => PropertyType::OBJECT,
			default => PropertyType::STRING,
		};
	}

	/**
	 * Execute the WordPress Ability.
	 *
	 * This method is called by Neuron AI when the tool is invoked.
	 * It receives the tool inputs as named parameters.
	 *
	 * @param mixed ...$parameters Tool input parameters.
	 * @return string Result of the ability execution.
	 */
	public function __invoke( ...$parameters ): string {
		// Execute the WordPress Ability with the provided parameters.
		$result = $this->ability->execute( $parameters );

		// Handle WP_Error.
		if ( is_wp_error( $result ) ) {
			return wp_json_encode(
				array(
					'success' => false,
					'error'   => $result->get_error_message(),
				)
			);
		}

		// Return the result as JSON.
		return is_string( $result ) ? $result : wp_json_encode( $result );
	}
}
