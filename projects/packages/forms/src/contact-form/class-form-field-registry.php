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
	 *     @type array    $supports             Feature support flags. {
	 *         @type bool $label                Enable label support with automatic syncing. Default false.
	 *                                          When true, automatically:
	 *                                          - Adds jetpack/label as valid inner block
	 *                                          - Sets up context for label syncing
	 *                                          - Handles label rendering with styles on frontend
	 *     }
	 *     @type callable $render_callback      Block render callback. Receives ($atts, $content, $block).
	 *                                          If not provided, uses default that calls Contact_Form::parse_contact_field().
	 *     @type callable $validate_callback    Validation callback. Receives ($value, $label, $field).
	 *                                          Return true for valid, string error message for invalid.
	 *     @type callable $render_field         Frontend field render callback. Receives ($data).
	 *                                          Return HTML string or null for default rendering.
	 *                                          $data always includes 'wrapper_attrs' with interactivity attributes
	 *                                          that should be added to the field's wrapper div for validation errors.
	 *                                          $data includes 'error_html' with pre-rendered error message container.
	 *                                          When supports.label is true, $data includes 'label_html' with
	 *                                          pre-rendered label markup including styles.
	 *     @type callable $render_value         Value render callback. Receives ($context, $value, $field).
	 *                                          Context is 'email', 'web', 'ajax', 'csv', 'api'.
	 *                                          Return rendered value or null for default.
	 *     @type array    $error_messages       Associative array of error_key => message.
	 *     @type string   $editor_script        URL to the editor script.
	 *     @type array    $editor_script_deps   Editor script dependencies.
	 *     @type string   $editor_script_ver    Editor script version.
	 *     @type string   $editor_style         URL to the editor stylesheet.
	 *     @type array    $editor_style_deps    Editor style dependencies.
	 *     @type string   $editor_style_ver     Editor style version.
	 *     @type string   $dashboard_script     URL to the dashboard script.
	 *     @type array    $dashboard_script_deps Dashboard script dependencies.
	 *     @type string   $dashboard_script_ver Dashboard script version.
	 *     @type string   $dashboard_style      URL to the dashboard stylesheet.
	 *     @type array    $dashboard_style_deps Dashboard style dependencies.
	 *     @type string   $dashboard_style_ver  Dashboard style version.
	 *     @type string   $view_script          URL to the frontend view script (ES module for Interactivity API).
	 *     @type array    $view_script_deps     View script module dependencies.
	 *     @type string   $view_script_ver      View script version.
	 *     @type string   $view_style           URL to the frontend stylesheet.
	 *     @type array    $view_style_deps      View style dependencies.
	 *     @type string   $view_style_ver       View style version.
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
			'supports'              => array(),
			'render_callback'       => null,
			'validate_callback'     => null,
			'render_field'          => null,
			'render_value'          => null,
			'error_messages'        => array(),
			// Editor scripts.
			'editor_script'         => '',
			'editor_script_deps'    => array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ),
			'editor_script_ver'     => '1.0.0',
			// Editor styles.
			'editor_style'          => '',
			'editor_style_deps'     => array(),
			'editor_style_ver'      => '1.0.0',
			// Dashboard scripts.
			'dashboard_script'      => '',
			'dashboard_script_deps' => array( 'wp-hooks', 'wp-element', 'jp-forms-dashboard' ),
			'dashboard_script_ver'  => '1.0.0',
			// Dashboard styles.
			'dashboard_style'       => '',
			'dashboard_style_deps'  => array(),
			'dashboard_style_ver'   => '1.0.0',
			// View/frontend scripts.
			'view_script'           => '',
			'view_script_deps'      => array( '@wordpress/interactivity', 'jp-forms-view' ),
			'view_script_ver'       => '1.0.0',
			// View/frontend styles.
			'view_style'            => '',
			'view_style_deps'       => array(),
			'view_style_ver'        => '1.0.0',
		);

		$args = wp_parse_args( $args, $defaults );

		// Parse supports with defaults.
		$supports_defaults = array(
			'label' => false,
		);
		$args['supports']  = wp_parse_args( $args['supports'], $supports_defaults );

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

		// Add label parent blocks filter for fields with label support.
		add_filter( 'jetpack.forms.label.parentBlocks', array( __CLASS__, 'filter_label_parent_blocks' ) );
	}

	/**
	 * Filter: Add custom field blocks as valid parents for the label block.
	 *
	 * @param array $parents Existing parent blocks.
	 * @return array Modified parent blocks.
	 */
	public static function filter_label_parent_blocks( $parents ) {
		foreach ( self::$registered_fields as $args ) {
			if ( ! empty( $args['supports']['label'] ) ) {
				$parents[] = $args['block_name'];
			}
		}
		return $parents;
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

		// Add label support attributes if enabled.
		if ( ! empty( $args['supports']['label'] ) ) {
			$default_attributes['shareFieldAttributes'] = array(
				'type'    => 'boolean',
				'default' => true,
			);
		}

		$block_attributes = array_merge( $default_attributes, $args['block_attributes'] );

		// Build block registration args.
		$block_args = array(
			'api_version'     => 3,
			'render_callback' => $render_callback,
			'attributes'      => $block_attributes,
		);

		// Add label support configuration.
		if ( ! empty( $args['supports']['label'] ) ) {
			$block_args['provides_context'] = array(
				'jetpack/field-required'         => 'required',
				'jetpack/field-share-attributes' => 'shareFieldAttributes',
			);
			$block_args['supports']         = array(
				'reusable'                               => false,
				'html'                                   => false,
				'__experimentalExposeControlsToChildren' => true,
			);
		}

		register_block_type( $block_name, $block_args );
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

		// Extract attributes from inner blocks (label, input, etc.).
		if ( $block && ! empty( $block->parsed_block['innerBlocks'] ) ) {
			foreach ( $block->parsed_block['innerBlocks'] as $inner_block ) {
				$block_name = $inner_block['blockName'] ?? '';

				// Extract label from jetpack/label inner block.
				if ( 'jetpack/label' === $block_name ) {
					$atts['label']        = $inner_block['attrs']['label'] ?? $inner_block['attrs']['defaultLabel'] ?? '';
					$atts['requiredText'] = $inner_block['attrs']['requiredText'] ?? null;

					// Check if required indicator should be shown.
					if ( isset( $inner_block['attrs']['requiredIndicator'] ) ) {
						$atts['requiredIndicator'] = $inner_block['attrs']['requiredIndicator'];
					}

					// Extract label style attributes using WordPress block support functions.
					$label_attrs          = Contact_Form_Plugin::get_label_block_support_classes_and_styles( $inner_block['attrs'] );
					$atts['labelclasses'] = 'wp-block-jetpack-label';
					if ( ! empty( $label_attrs['class'] ) ) {
						$atts['labelclasses'] .= ' ' . $label_attrs['class'];
					}
					if ( ! empty( $label_attrs['style'] ) ) {
						$atts['labelstyles'] = $label_attrs['style'];
					}
				}
			}
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

		// Enqueue the view script if provided (ES module for Interactivity API).
		if ( ! empty( $args['view_script'] ) ) {
			wp_enqueue_script_module(
				'jetpack-forms-field-' . $type . '-view',
				$args['view_script'],
				$args['view_script_deps'],
				$args['view_script_ver']
			);
		}

		// Enqueue the view style if provided.
		if ( ! empty( $args['view_style'] ) ) {
			wp_enqueue_style(
				'jetpack-forms-field-' . $type . '-view',
				$args['view_style'],
				$args['view_style_deps'],
				$args['view_style_ver']
			);
		}

		// Add error state first (needed for label rendering).
		if ( isset( $data['field'] ) ) {
			$data['is_error']   = $data['field']->is_error();
			$data['error_html'] = self::render_error_html( $data, $type );
		}

		// If label support is enabled, add pre-rendered label HTML to data.
		if ( ! empty( $args['supports']['label'] ) && isset( $data['field'] ) ) {
			$data['label_html'] = self::render_label_html( $data );
		}

		if ( ! is_callable( $args['render_field'] ) ) {
			return $html;
		}

		return call_user_func( $args['render_field'], $data );
	}

	/**
	 * Render error HTML for validation errors.
	 *
	 * This generates the error message container that displays validation errors.
	 * Uses the WordPress Interactivity API for dynamic error state.
	 *
	 * @param array  $data       Field data including 'field' instance.
	 * @param string $field_type The field type.
	 * @return string Rendered error HTML.
	 */
	private static function render_error_html( $data, $field_type ) {
		$id = esc_attr( $data['id'] );

		return '
			<div id="' . $id . '-' . esc_attr( $field_type ) . '-error" class="contact-form__input-error" data-wp-class--has-errors="state.fieldHasErrors">
				<span class="contact-form__warning-icon" aria-hidden="true">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M8.50015 11.6402H7.50015V10.6402H8.50015V11.6402Z" />
						<path d="M7.50015 9.64018H8.50015V6.30684H7.50015V9.64018Z" />
						<path fill-rule="evenodd" clip-rule="evenodd" d="M6.98331 3.0947C7.42933 2.30177 8.57096 2.30177 9.01698 3.09469L13.8771 11.7349C14.3145 12.5126 13.7525 13.4735 12.8602 13.4735H3.14004C2.24774 13.4735 1.68575 12.5126 2.12321 11.7349L6.98331 3.0947ZM8.14541 3.58496C8.08169 3.47168 7.9186 3.47168 7.85488 3.58496L2.99478 12.2251C2.93229 12.3362 3.01257 12.4735 3.14004 12.4735H12.8602C12.9877 12.4735 13.068 12.3362 13.0055 12.2251L8.14541 3.58496Z" />
					</svg>
				</span>
				<span data-wp-text="state.errorMessage" id="' . $id . '-' . esc_attr( $field_type ) . '-error-message"></span>
			</div>';
	}

	/**
	 * Render label HTML with proper classes and styles.
	 *
	 * This generates the label HTML including all styling from the inner jetpack/label block.
	 * Developers using supports.label can use $data['label_html'] in their render_field callback.
	 *
	 * @param array $data Field data including 'field' instance.
	 * @return string Rendered label HTML.
	 */
	private static function render_label_html( $data ) {
		$field_instance = $data['field'];
		$label          = esc_html( $data['label'] );
		$id             = esc_attr( $data['id'] );
		$required       = $data['required'];
		$is_error       = ! empty( $data['is_error'] );

		// Build label classes.
		$label_classes = 'grunion-field-label';
		if ( $is_error ) {
			$label_classes .= ' form-error';
		}
		if ( ! empty( $field_instance->label_classes ) ) {
			$label_classes .= ' ' . esc_attr( $field_instance->label_classes );
		}

		// Build label styles.
		$label_style_attr = '';
		if ( ! empty( $field_instance->label_styles ) ) {
			$label_style_attr = ' style="' . esc_attr( $field_instance->label_styles ) . '"';
		}

		// Build required indicator.
		$required_markup = '';
		if ( $required ) {
			$required_text = $field_instance->get_attribute( 'requiredtext' );
			if ( empty( $required_text ) ) {
				$required_text = __( '(required)', 'jetpack-forms' );
			}
			$show_required_text = $field_instance->get_attribute( 'requiredindicator' );
			if ( $show_required_text ) {
				$required_markup = '<span class="required">' . esc_html( $required_text ) . '</span>';
			}
		}

		return sprintf(
			'<label class="%s" for="%s"%s>%s%s</label>',
			esc_attr( $label_classes ),
			$id,
			$label_style_attr,
			$label,
			$required_markup
		);
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

		// Collect blocks with label support and all custom field blocks.
		$label_support_blocks = array();
		$custom_field_blocks  = array();

		foreach ( self::$registered_fields as $field_type => $args ) {
			// Track all custom field blocks for ID control injection.
			$custom_field_blocks[] = $args['block_name'];

			// Track blocks with label support.
			if ( ! empty( $args['supports']['label'] ) ) {
				$label_support_blocks[] = $args['block_name'];
			}

			// Enqueue editor script if provided.
			if ( ! empty( $args['editor_script'] ) ) {
				wp_enqueue_script(
					'jetpack-forms-field-' . $field_type . '-editor',
					$args['editor_script'],
					$args['editor_script_deps'],
					$args['editor_script_ver'],
					true
				);
			}

			// Enqueue editor style if provided.
			if ( ! empty( $args['editor_style'] ) ) {
				wp_enqueue_style(
					'jetpack-forms-field-' . $field_type . '-editor',
					$args['editor_style'],
					$args['editor_style_deps'],
					$args['editor_style_ver']
				);
			}
		}

		// Add inline script to register label parent blocks filter.
		if ( ! empty( $label_support_blocks ) ) {
			self::enqueue_label_support_script( $label_support_blocks );
		}

		// Add inline script to inject ID control for custom field blocks.
		if ( ! empty( $custom_field_blocks ) ) {
			self::enqueue_field_id_control_script( $custom_field_blocks );
		}
	}

	/**
	 * Enqueue inline script to add label parent blocks filter.
	 *
	 * @param array $block_names Array of block names with label support.
	 */
	private static function enqueue_label_support_script( $block_names ) {
		// We need to add this filter before the label block is registered.
		// Use wp-hooks as dependency since we need addFilter.
		$script = sprintf(
			'(function() {
				var blocks = %s;
				if (window.wp && window.wp.hooks && window.wp.hooks.addFilter) {
					window.wp.hooks.addFilter(
						"jetpack.forms.label.parentBlocks",
						"jetpack-forms-field-registry/label-parents",
						function(parents) {
							return parents.concat(blocks);
						}
					);
				}
			})();',
			wp_json_encode( $block_names, JSON_UNESCAPED_SLASHES )
		);

		wp_add_inline_script( 'wp-hooks', $script, 'after' );
	}

	/**
	 * Enqueue inline script to add ID control to custom field blocks.
	 *
	 * This automatically injects the Name/ID field in the Advanced panel
	 * for all custom form fields registered via register_jetpack_form_field().
	 *
	 * @param array $block_names Array of block names to add ID control to.
	 */
	private static function enqueue_field_id_control_script( $block_names ) {
		$script = sprintf(
			'(function() {
				var customFieldBlocks = %s;
				var reservedAttributes = ["accept","action","autocomplete","enctype","method","name","novalidate","target","type","value"];
				var wp = window.wp;

				if (!wp || !wp.hooks || !wp.element || !wp.blockEditor || !wp.components || !wp.i18n) {
					return;
				}

				var addFilter = wp.hooks.addFilter;
				var createElement = wp.element.createElement;
				var Fragment = wp.element.Fragment;
				var useState = wp.element.useState;
				var useCallback = wp.element.useCallback;
				var InspectorAdvancedControls = wp.blockEditor.InspectorAdvancedControls;
				var TextControl = wp.components.TextControl;
				var __ = wp.i18n.__;

				// Higher Order Component to add ID control
				var withFieldIdControl = function(BlockEdit) {
					return function(props) {
						if (customFieldBlocks.indexOf(props.name) === -1) {
							return createElement(BlockEdit, props);
						}

						var id = props.attributes.id || "";
						var setAttributes = props.setAttributes;

						var errorState = useState("");
						var idError = errorState[0];
						var setIdError = errorState[1];

						var setId = useCallback(function(value) {
							var newValue = value.replace(/[^a-zA-Z0-9_-]/g, "");

							// Check for reserved attribute names
							var isReserved = reservedAttributes.some(function(attr) {
								return attr.toLowerCase() === newValue.toLowerCase();
							});

							if (isReserved) {
								setIdError(__("This is a reserved word. Please use a different name.", "jetpack-forms"));
								return;
							}

							setIdError("");
							setAttributes({ id: newValue });
						}, [setAttributes]);

						return createElement(
							Fragment,
							null,
							createElement(BlockEdit, props),
							createElement(
								InspectorAdvancedControls,
								null,
								createElement(TextControl, {
									label: __("Name/ID", "jetpack-forms"),
									value: id,
									onChange: setId,
									help: idError || __("Customize the input\'s name/ID. Only alphanumeric, dash and underscore characters are allowed", "jetpack-forms"),
									className: idError ? "jetpack-forms-field-controls__input-error" : "",
									__nextHasNoMarginBottom: true,
									__next40pxDefaultSize: true
								})
							)
						);
					};
				};

				addFilter(
					"editor.BlockEdit",
					"jetpack-forms-field-registry/field-id-control",
					withFieldIdControl
				);
			})();',
			wp_json_encode( $block_names, JSON_UNESCAPED_SLASHES )
		);

		wp_add_inline_script( 'wp-hooks', $script, 'after' );
	}

	/**
	 * Enqueue dashboard scripts and styles for registered fields.
	 */
	public static function enqueue_dashboard_assets() {
		// Only load if the Jetpack Forms dashboard script is registered.
		if ( ! wp_script_is( 'jp-forms-dashboard', 'registered' ) && ! wp_script_is( 'jp-forms-dashboard', 'enqueued' ) ) {
			return;
		}

		foreach ( self::$registered_fields as $field_type => $args ) {
			// Enqueue dashboard script if provided.
			if ( ! empty( $args['dashboard_script'] ) ) {
				wp_enqueue_script(
					'jetpack-forms-field-' . $field_type . '-dashboard',
					$args['dashboard_script'],
					$args['dashboard_script_deps'],
					$args['dashboard_script_ver'],
					true
				);
			}

			// Enqueue dashboard style if provided.
			if ( ! empty( $args['dashboard_style'] ) ) {
				wp_enqueue_style(
					'jetpack-forms-field-' . $field_type . '-dashboard',
					$args['dashboard_style'],
					$args['dashboard_style_deps'],
					$args['dashboard_style_ver']
				);
			}
		}
	}
}
