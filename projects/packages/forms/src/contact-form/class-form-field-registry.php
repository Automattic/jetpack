<?php
/**
 * Form Field Registry
 *
 * Provides a unified API for registering custom form field types.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * Registry for custom form field types.
 *
 * Similar to WordPress's register_post_type(), this provides a single function
 * to register all aspects of a custom form field: block registration, validation,
 * rendering, and dashboard integration.
 */
class Form_Field_Registry {

	/**
	 * Registered field types.
	 *
	 * @var array
	 */
	private static $registered_fields = array();

	/**
	 * Whether the hooks have been initialized.
	 *
	 * @var bool
	 */
	private static $hooks_initialized = false;

	/**
	 * Register a custom form field type.
	 *
	 * This function provides a unified API for registering custom form fields,
	 * similar to WordPress's register_post_type(). It handles:
	 * - Block registration (both PHP and asset enqueueing)
	 * - Field type registration
	 * - Validation callbacks
	 * - Frontend rendering
	 * - Response value rendering (email, CSV, API, dashboard)
	 * - Error messages
	 * - Dashboard script registration
	 *
	 * @param string $field_type The field type identifier (e.g., 'color', 'rating').
	 * @param array  $args       {
	 *     Configuration arguments for the field type.
	 *
	 *     @type string   $block_name           Block name. Defaults to 'jetpack/field-{$field_type}'.
	 *     @type array    $block_attributes     Block attributes definition.
	 *     @type callable $render_callback      Block render callback. Receives ($atts, $content, $block).
	 *                                          If not provided, uses default that calls Contact_Form::parse_contact_field().
	 *     @type callable $validate_callback    Validation callback. Receives ($value, $label, $field).
	 *                                          Return true for valid, string error message for invalid.
	 *     @type callable $render_field         Frontend field render callback. Receives ($data).
	 *                                          Return HTML string or null for default rendering.
	 *     @type callable $render_value         Value render callback. Receives ($context, $value, $field).
	 *                                          Context is 'email', 'web', 'ajax', 'csv', 'api'.
	 *                                          Return rendered value or null for default.
	 *     @type array    $error_messages       Associative array of error_key => message.
	 *     @type string   $editor_script        URL to the editor script.
	 *     @type array    $editor_script_deps   Editor script dependencies.
	 *     @type string   $editor_script_ver    Editor script version.
	 *     @type string   $dashboard_script     URL to the dashboard script.
	 *     @type array    $dashboard_script_deps Dashboard script dependencies.
	 *     @type string   $dashboard_script_ver Dashboard script version.
	 * }
	 * @return bool True on success, false on failure.
	 */
	public static function register( $field_type, $args = array() ) {
		if ( empty( $field_type ) || ! is_string( $field_type ) ) {
			_doing_it_wrong(
				__METHOD__,
				esc_html__( 'Field type must be a non-empty string.', 'jetpack-forms' ),
				'1.0.0'
			);
			return false;
		}

		// Sanitize field type to lowercase alphanumeric with hyphens.
		$field_type = sanitize_key( $field_type );

		if ( isset( self::$registered_fields[ $field_type ] ) ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: field type */
					esc_html__( 'Field type "%s" is already registered.', 'jetpack-forms' ),
					esc_html( $field_type )
				),
				'1.0.0'
			);
			return false;
		}

		$defaults = array(
			'block_name'            => 'jetpack/field-' . $field_type,
			'block_attributes'      => array(),
			'render_callback'       => null,
			'validate_callback'     => null,
			'render_field'          => null,
			'render_value'          => null,
			'error_messages'        => array(),
			'editor_script'         => '',
			'editor_script_deps'    => array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ),
			'editor_script_ver'     => '1.0.0',
			'dashboard_script'      => '',
			'dashboard_script_deps' => array( 'wp-hooks', 'wp-element', 'jp-forms-dashboard' ),
			'dashboard_script_ver'  => '1.0.0',
		);

		$args = wp_parse_args( $args, $defaults );

		// Store the field configuration.
		self::$registered_fields[ $field_type ] = $args;

		// Initialize hooks if not already done.
		self::init_hooks();

		// Register the block if Jetpack Forms is active.
		if ( did_action( 'init' ) ) {
			self::register_block( $field_type, $args );
		}

		return true;
	}

	/**
	 * Get a registered field type configuration.
	 *
	 * @param string $field_type The field type identifier.
	 * @return array|null The field configuration or null if not registered.
	 */
	public static function get( $field_type ) {
		return self::$registered_fields[ $field_type ] ?? null;
	}

	/**
	 * Get all registered field types.
	 *
	 * @return array Array of registered field types.
	 */
	public static function get_all() {
		return self::$registered_fields;
	}

	/**
	 * Check if a field type is registered.
	 *
	 * @param string $field_type The field type identifier.
	 * @return bool True if registered, false otherwise.
	 */
	public static function is_registered( $field_type ) {
		return isset( self::$registered_fields[ $field_type ] );
	}

	/**
	 * Get all registered block names.
	 *
	 * @return array Array of block names (e.g., 'jetpack/field-color').
	 */
	public static function get_registered_block_names() {
		$block_names = array();
		foreach ( self::$registered_fields as $args ) {
			$block_names[] = $args['block_name'];
		}
		return $block_names;
	}

	/**
	 * Initialize the filter hooks.
	 */
	private static function init_hooks() {
		if ( self::$hooks_initialized ) {
			return;
		}

		self::$hooks_initialized = true;

		// Register field types.
		add_filter( 'jetpack_forms_field_types', array( __CLASS__, 'filter_field_types' ) );

		// Validation.
		add_filter( 'jetpack_forms_validate_field', array( __CLASS__, 'filter_validate_field' ), 10, 5 );

		// Frontend field rendering.
		add_filter( 'jetpack_forms_render_field', array( __CLASS__, 'filter_render_field' ), 10, 3 );

		// Value rendering.
		add_filter( 'jetpack_forms_render_field_value', array( __CLASS__, 'filter_render_value' ), 10, 5 );

		// Error messages.
		add_filter( 'jetpack_forms_error_types', array( __CLASS__, 'filter_error_types' ) );

		// Block registration on init (for fields registered before init).
		add_action( 'init', array( __CLASS__, 'register_blocks' ), 20 );

		// Editor scripts.
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_assets' ) );

		// Dashboard scripts.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_dashboard_assets' ), 20 );
	}

	/**
	 * Register blocks for all registered field types.
	 *
	 * Hooked to 'init' action.
	 */
	public static function register_blocks() {
		foreach ( self::$registered_fields as $field_type => $args ) {
			self::register_block( $field_type, $args );
		}
	}

	/**
	 * Register a single block for a field type.
	 *
	 * @param string $field_type The field type identifier.
	 * @param array  $args       The field configuration.
	 */
	private static function register_block( $field_type, $args ) {
		// Only register if Jetpack Forms is active.
		if ( ! class_exists( 'Automattic\Jetpack\Forms\ContactForm\Contact_Form' ) ) {
			return;
		}

		$block_name = $args['block_name'];

		// Check if block is already registered.
		if ( \WP_Block_Type_Registry::get_instance()->is_registered( $block_name ) ) {
			return;
		}

		// Determine the render callback.
		$render_callback = $args['render_callback'];
		if ( ! is_callable( $render_callback ) ) {
			// Use default render callback that integrates with the forms system.
			$render_callback = function ( $atts, $content, $block ) use ( $field_type ) {
				return self::default_render_callback( $atts, $content, $block, $field_type );
			};
		}

		// Default block attributes.
		$default_attributes = array(
			'label'             => array(
				'type'    => 'string',
				'default' => ucfirst( $field_type ),
			),
			'required'          => array(
				'type'    => 'boolean',
				'default' => false,
			),
			'requiredText'      => array(
				'type'    => 'string',
				'default' => '(required)',
			),
			'requiredIndicator' => array(
				'type'    => 'boolean',
				'default' => true,
			),
			'width'             => array(
				'type'    => 'number',
				'default' => 100,
			),
			'id'                => array(
				'type' => 'string',
			),
		);

		$block_attributes = array_merge( $default_attributes, $args['block_attributes'] );

		register_block_type(
			$block_name,
			array(
				'api_version'     => 3,
				'render_callback' => $render_callback,
				'attributes'      => $block_attributes,
			)
		);
	}

	/**
	 * Default render callback for custom field blocks.
	 *
	 * Integrates with the Jetpack Forms system by calling Contact_Form::parse_contact_field().
	 *
	 * @param array     $atts       Block attributes.
	 * @param string    $content    Block content.
	 * @param \WP_Block $block      Block instance.
	 * @param string    $field_type The field type.
	 * @return string HTML output.
	 */
	private static function default_render_callback( $atts, $content, $block, $field_type ) {
		// Set the field type.
		$atts['type'] = $field_type;

		// Convert block attribute names to shortcode format.
		if ( isset( $atts['defaultValue'] ) ) {
			$atts['default'] = $atts['defaultValue'];
			unset( $atts['defaultValue'] );
		}

		if ( isset( $atts['className'] ) ) {
			$atts['class'] = $atts['className'];
			unset( $atts['className'] );
		}

		// Call the forms system to parse and render the field.
		return Contact_Form::parse_contact_field( $atts, $content, $block );
	}

	/**
	 * Filter: Add registered field types to the list.
	 *
	 * @param array $types Existing field types.
	 * @return array Modified field types.
	 */
	public static function filter_field_types( $types ) {
		foreach ( self::$registered_fields as $field_type => $args ) {
			if ( ! in_array( $field_type, $types, true ) ) {
				$types[] = $field_type;
			}
		}
		return $types;
	}

	/**
	 * Filter: Validate custom field types.
	 *
	 * @param mixed              $result Current validation result.
	 * @param string             $type   Field type.
	 * @param mixed              $value  Field value.
	 * @param string             $label  Field label.
	 * @param Contact_Form_Field $field  Field instance.
	 * @return mixed Validation result.
	 */
	public static function filter_validate_field( $result, $type, $value, $label, $field ) {
		if ( ! isset( self::$registered_fields[ $type ] ) ) {
			return $result;
		}

		$args = self::$registered_fields[ $type ];

		if ( ! is_callable( $args['validate_callback'] ) ) {
			return $result;
		}

		return call_user_func( $args['validate_callback'], $value, $label, $field );
	}

	/**
	 * Filter: Render custom field HTML.
	 *
	 * @param string|null $html Field HTML.
	 * @param string      $type Field type.
	 * @param array       $data Field data.
	 * @return string|null Rendered HTML.
	 */
	public static function filter_render_field( $html, $type, $data ) {
		if ( ! isset( self::$registered_fields[ $type ] ) ) {
			return $html;
		}

		$args = self::$registered_fields[ $type ];

		if ( ! is_callable( $args['render_field'] ) ) {
			return $html;
		}

		return call_user_func( $args['render_field'], $data );
	}

	/**
	 * Filter: Render field value for different contexts.
	 *
	 * @param mixed          $rendered Rendered value.
	 * @param string         $context  Render context (email, web, ajax, csv, api).
	 * @param string         $type     Field type.
	 * @param mixed          $value    Raw field value.
	 * @param Feedback_Field $field    Field instance.
	 * @return mixed Rendered value.
	 */
	public static function filter_render_value( $rendered, $context, $type, $value, $field ) {
		if ( ! isset( self::$registered_fields[ $type ] ) ) {
			return $rendered;
		}

		$args = self::$registered_fields[ $type ];

		if ( ! is_callable( $args['render_value'] ) ) {
			return $rendered;
		}

		return call_user_func( $args['render_value'], $context, $value, $field );
	}

	/**
	 * Filter: Add custom error messages.
	 *
	 * @param array $error_types Existing error types.
	 * @return array Modified error types.
	 */
	public static function filter_error_types( $error_types ) {
		foreach ( self::$registered_fields as $args ) {
			if ( ! empty( $args['error_messages'] ) && is_array( $args['error_messages'] ) ) {
				$error_types = array_merge( $error_types, $args['error_messages'] );
			}
		}
		return $error_types;
	}

	/**
	 * Enqueue editor scripts for registered fields.
	 */
	public static function enqueue_editor_assets() {
		// Only load if Jetpack Forms is active.
		if ( ! class_exists( 'Automattic\Jetpack\Forms\ContactForm\Contact_Form' ) ) {
			return;
		}

		foreach ( self::$registered_fields as $field_type => $args ) {
			if ( empty( $args['editor_script'] ) ) {
				continue;
			}

			$handle = 'jetpack-forms-field-' . $field_type . '-editor';

			wp_enqueue_script(
				$handle,
				$args['editor_script'],
				$args['editor_script_deps'],
				$args['editor_script_ver'],
				true
			);
		}
	}

	/**
	 * Enqueue dashboard scripts for registered fields.
	 */
	public static function enqueue_dashboard_assets() {
		// Only load if the Jetpack Forms dashboard script is registered.
		if ( ! wp_script_is( 'jp-forms-dashboard', 'registered' ) && ! wp_script_is( 'jp-forms-dashboard', 'enqueued' ) ) {
			return;
		}

		foreach ( self::$registered_fields as $field_type => $args ) {
			if ( empty( $args['dashboard_script'] ) ) {
				continue;
			}

			$handle = 'jetpack-forms-field-' . $field_type . '-dashboard';

			wp_enqueue_script(
				$handle,
				$args['dashboard_script'],
				$args['dashboard_script_deps'],
				$args['dashboard_script_ver'],
				true
			);
		}
	}
}
