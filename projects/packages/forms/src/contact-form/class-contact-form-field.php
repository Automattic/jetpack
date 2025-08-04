<?php
/**
 * Contact_Form_Field class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Forms\Jetpack_Forms;

/**
 * Class for the contact-field shortcode.
 * Parses shortcode to output the contact form field as HTML.
 * Validates input.
 */
class Contact_Form_Field extends Contact_Form_Shortcode {

	/**
	 * The shortcode name.
	 *
	 * @var string
	 */
	public $shortcode_name = 'contact-field';

	/**
	 * The parent form.
	 *
	 * @var Contact_Form
	 */
	public $form;

	/**
	 * Default or POSTed value.
	 *
	 * @var string|string[]
	 */
	public $value;

	/**
	 * Is the input valid?
	 *
	 * @var bool
	 */
	public $error = false;

	/**
	 * Styles to be applied to the field
	 *
	 * @var string
	 */
	public $block_styles = '';

	/**
	 * Classes to be applied to the field
	 *
	 * @var string
	 */
	public $field_classes = '';

	/**
	 * Styles to be applied to the field
	 *
	 * @var string
	 */
	public $field_styles = '';

	/**
	 * Classes to be applied to the field option
	 *
	 * @var string
	 */
	public $option_classes = '';

	/**
	 * Styles to be applied to the field option
	 *
	 * @var string
	 */
	public $option_styles = '';

	/**
	 * Classes to be applied to the field
	 *
	 * @var string
	 */
	public $label_classes = '';

	/**
	 * Styles to be applied to the field
	 *
	 * @var string
	 */
	public $label_styles = '';

	/**
	 * Constructor function.
	 *
	 * @param array        $attributes An associative array of shortcode attributes.  @see shortcode_atts().
	 * @param null|string  $content Null for selfclosing shortcodes.  The inner content otherwise.
	 * @param Contact_Form $form The parent form.
	 */
	public function __construct( $attributes, $content = null, $form = null ) {
		$attributes = shortcode_atts(
			array(
				'label'                    => null,
				'togglelabel'              => null,
				'type'                     => 'text',
				'required'                 => false,
				'requiredtext'             => null,
				'options'                  => array(),
				'optionsdata'              => array(),
				'id'                       => null,
				'style'                    => null,
				'fieldbackgroundcolor'     => null,
				'buttonbackgroundcolor'    => null,
				'buttonborderradius'       => null,
				'buttonborderwidth'        => null,
				'textcolor'                => null,
				'default'                  => null,
				'values'                   => null,
				'placeholder'              => null,
				'class'                    => null,
				'width'                    => null,
				'consenttype'              => null,
				'dateformat'               => null,
				'implicitconsentmessage'   => null,
				'explicitconsentmessage'   => null,
				'borderradius'             => null,
				'borderwidth'              => null,
				'lineheight'               => null,
				'labellineheight'          => null,
				'bordercolor'              => null,
				'inputcolor'               => null,
				'labelcolor'               => null,
				'labelfontsize'            => null,
				'fieldfontsize'            => null,
				'labelclasses'             => null,
				'labelstyles'              => null,
				'inputclasses'             => null,
				'inputstyles'              => null,
				'optionclasses'            => null,
				'optionstyles'             => null,
				'min'                      => null,
				'max'                      => null,
				'maxfiles'                 => null,
				'fieldwrapperclasses'      => null,
				'stylevariationattributes' => array(),
				'stylevariationclasses'    => null,
				'stylevariationstyles'     => null,
				'optionsclasses'           => null,
				'optionsstyles'            => null,
				'align'                    => null,
				'variation'                => null,
			),
			$attributes,
			'contact-field'
		);

		// special default for subject field
		if ( 'subject' === $attributes['type'] && $attributes['default'] === null && $form !== null ) {
			$attributes['default'] = $form->get_attribute( 'subject' );
		}

		// allow required=1 or required=true
		if ( '1' === $attributes['required'] || 'true' === strtolower( $attributes['required'] ) ) {
			$attributes['required'] = true;
		} else {
			$attributes['required'] = false;
		}

		if ( $attributes['requiredtext'] === null ) {
			$attributes['requiredtext'] = __( '(required)', 'jetpack-forms' );
		}

		// parse out comma-separated options list (for selects, radios, and checkbox-multiples)
		if ( ! empty( $attributes['options'] ) && is_string( $attributes['options'] ) ) {
			$attributes['options'] = array_map( 'trim', explode( ',', $attributes['options'] ) );

			if ( ! empty( $attributes['values'] ) && is_string( $attributes['values'] ) ) {
				$attributes['values'] = array_map( 'trim', explode( ',', $attributes['values'] ) );
			}
		}

		if ( ! empty( $attributes['optionsdata'] ) ) {
			$attributes['optionsdata'] = json_decode( html_entity_decode( $attributes['optionsdata'], ENT_COMPAT ), true );
		}

		if ( $form ) {
			// make a unique field ID based on the label, with an incrementing number if needed to avoid clashes
			$form_id = $form->get_attribute( 'id' );
			$id      = isset( $attributes['id'] ) ? $attributes['id'] : false;

			$unescaped_label = $this->unesc_attr( $attributes['label'] );
			$unescaped_label = str_replace( '%', '-', $unescaped_label ); // jQuery doesn't like % in IDs?
			$unescaped_label = preg_replace( '/[^a-zA-Z0-9.-_:]/', '', $unescaped_label );

			if ( empty( $id ) ) {
				$id        = sanitize_title_with_dashes( 'g' . $form_id . '-' . $unescaped_label );
				$i         = 0;
				$max_tries = 99;
				while ( isset( $form->fields[ $id ] ) ) {
					++$i;
					$id = sanitize_title_with_dashes( 'g' . $form_id . '-' . $unescaped_label . '-' . $i );

					if ( $i > $max_tries ) {
						break;
					}
				}
			}

			$attributes['id'] = $id;
		}

		parent::__construct( $attributes, $content );

		// Store parent form
		$this->form = $form;
	}

	/**
	 * This field's input is invalid.  Flag as invalid and add an error to the parent form
	 *
	 * @param string $message The error message to display on the form.
	 */
	public function add_error( $message ) {
		$this->error = true;

		if ( ! is_wp_error( $this->form->errors ) ) {
			$this->form->errors = new \WP_Error();
		}

		$this->form->errors->add( $this->get_attribute( 'id' ), $message );
	}

	/**
	 * Is the field input invalid?
	 *
	 * @see $error
	 *
	 * @return bool
	 */
	public function is_error() {
		return $this->error;
	}

	/**
	 * Validates the form input
	 */
	public function validate() {
		$field_type = $this->maybe_override_type();
		// If it's not required, there's nothing to validate
		if ( ! $this->get_attribute( 'required' ) || ! $this->is_field_renderable( $field_type ) ) {
			return;
		}

		$field_id    = $this->get_attribute( 'id' );
		$field_label = $this->get_attribute( 'label' );

		if ( isset( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
			if ( is_array( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
				$field_value = array_map( 'sanitize_text_field', wp_unslash( $_POST[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce verification should happen in caller.
			} else {
				$field_value = sanitize_text_field( wp_unslash( $_POST[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce verification should happen in caller.
			}
		} else {
			$field_value = '';
		}

		switch ( $field_type ) {
			case 'url':
				if ( ! is_string( $field_value ) || empty( $field_value ) || ! preg_match(
					// Changes to this regex should be synced with the regex in the render_url_field method of this class as both validate the same input. Note that this regex is in PCRE format.
					'%^(?:(?:https?|ftp)://)?(?:\S+(?::\S*)?@|\d{1,3}(?:\.\d{1,3}){3}|(?:(?:[a-z\d\x{00a1}-\x{ffff}]+-?)*[a-z\d\x{00a1}-\x{ffff}]+)(?:\.(?:[a-z\d\x{00a1}-\x{ffff}]+-?)*[a-z\d\x{00a1}-\x{ffff}]+)*(?:\.[a-z\x{00a1}-\x{ffff}]{2,6}))(?::\d+)?(?:[^\s]*)?$%iu',
					$field_value
				) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s: Please enter a valid URL - https://www.example.com', 'jetpack-forms' ), $field_label ) );
				}
				break;
			case 'email':
				// Make sure the email address is valid
				if ( ! is_string( $field_value ) || ! is_email( $field_value ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s requires a valid email address', 'jetpack-forms' ), $field_label ) );
				}
				break;
			case 'checkbox-multiple':
				// Check that there is at least one option selected
				if ( empty( $field_value ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s requires at least one selection', 'jetpack-forms' ), $field_label ) );
				}
				break;
			case 'number':
				// Make sure the number address is valid
				if ( ! is_numeric( $field_value ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s requires a number', 'jetpack-forms' ), $field_label ) );
				}
				break;
			case 'file':
				// Make sure the file field is not empty
				if ( ! is_array( $field_value ) || empty( $field_value[0] ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s requires a file to be uploaded.', 'jetpack-forms' ), $field_label ) );
				}
				break;
			default:
				// Just check for presence of any text
				if ( ! is_string( $field_value ) || ! strlen( trim( $field_value ) ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s is required', 'jetpack-forms' ), $field_label ) );
				}
		}
	}

	/**
	 * Check the default value for options field
	 *
	 * @param string $value - the value we're checking.
	 * @param int    $index - the index.
	 * @param string $options - default field option.
	 *
	 * @return string
	 */
	public function get_option_value( $value, $index, $options ) {
		if ( empty( $value[ $index ] ) ) {
			return $options;
		}
		return $value[ $index ];
	}

	/**
	 * Outputs the HTML for this form field
	 *
	 * @return string HTML
	 */
	public function render() {

		$field_id            = $this->get_attribute( 'id' );
		$field_type          = $this->maybe_override_type();
		$field_label         = $this->get_attribute( 'label' );
		$field_required      = $this->get_attribute( 'required' );
		$field_required_text = $this->get_attribute( 'requiredtext' );
		$field_placeholder   = $this->get_attribute( 'placeholder' );
		$field_width         = $this->get_attribute( 'width' );
		$class               = 'date' === $field_type ? 'jp-contact-form-date' : $this->get_attribute( 'class' );

		$label_classes  = $this->get_attribute( 'labelclasses' );
		$label_styles   = $this->get_attribute( 'labelstyles' );
		$input_classes  = $this->get_attribute( 'inputclasses' );
		$input_styles   = $this->get_attribute( 'inputstyles' );
		$option_classes = $this->get_attribute( 'optionclasses' );
		$option_styles  = $this->get_attribute( 'optionstyles' );

		$has_block_support_styles = ! empty( $label_classes ) || ! empty( $label_styles ) || ! empty( $input_classes ) || ! empty( $input_styles ) || ! empty( $option_classes ) || ! empty( $option_styles );

		if ( $has_block_support_styles ) {
			// Do any of the block support classes need to be applied at the field wrapper level? Do we need to make the classes etc filterable as per the field classes?

			// Classes.
			if ( ! empty( $label_classes ) ) {
				$this->label_classes .= esc_attr( $label_classes );
			}
			if ( ! empty( $input_classes ) ) {
				$class              .= $class ? ' ' . esc_attr( $input_classes ) : esc_attr( $input_classes );
				$this->field_classes = $input_classes;
			}
			if ( ! empty( $option_classes ) ) {
				$class               .= $class ? ' ' . esc_attr( $option_classes ) : esc_attr( $option_classes );
				$this->option_classes = $option_classes;
			}

			// Styles.
			if ( ! empty( $label_styles ) ) {
				$this->label_styles .= esc_attr( $label_styles );
			}
			if ( ! empty( $input_styles ) ) {
				$this->field_styles .= esc_attr( $input_styles );
			}
			if ( ! empty( $option_styles ) ) {
				$this->option_styles .= esc_attr( $option_styles );
			}

			// For Outline style support.
			$form_style = $this->get_form_style();
			if ( 'outlined' === $form_style || 'animated' === $form_style ) {
				$output_data         = $this->get_form_variation_style_properties( $form_style );
				$this->block_styles .= esc_attr( $output_data['css_vars'] );
			}
		} else {
			if ( is_numeric( $this->get_attribute( 'borderradius' ) ) ) {
				$this->block_styles .= '--jetpack--contact-form--border-radius: ' . esc_attr( $this->get_attribute( 'borderradius' ) ) . 'px;';
				$this->field_styles .= 'border-radius: ' . (int) $this->get_attribute( 'borderradius' ) . 'px;';
			}

			if ( is_numeric( $this->get_attribute( 'borderwidth' ) ) ) {
				$this->block_styles .= '--jetpack--contact-form--border-size: ' . esc_attr( $this->get_attribute( 'borderwidth' ) ) . 'px;';
				$this->field_styles .= 'border-width: ' . (int) $this->get_attribute( 'borderwidth' ) . 'px;';
			}

			if ( is_numeric( $this->get_attribute( 'lineheight' ) ) ) {
				$this->block_styles  .= '--jetpack--contact-form--line-height: ' . esc_attr( $this->get_attribute( 'lineheight' ) ) . ';';
				$this->field_styles  .= 'line-height: ' . (int) $this->get_attribute( 'lineheight' ) . ';';
				$this->option_styles .= 'line-height: ' . (int) $this->get_attribute( 'lineheight' ) . ';';
			}

			if ( ! empty( $this->get_attribute( 'bordercolor' ) ) ) {
				$this->block_styles .= '--jetpack--contact-form--border-color: ' . esc_attr( $this->get_attribute( 'bordercolor' ) ) . ';';
				$this->field_styles .= 'border-color: ' . esc_attr( $this->get_attribute( 'bordercolor' ) ) . ';';
			}

			if ( ! empty( $this->get_attribute( 'inputcolor' ) ) ) {
				$this->block_styles  .= '--jetpack--contact-form--text-color: ' . esc_attr( $this->get_attribute( 'inputcolor' ) ) . ';';
				$this->block_styles  .= '--jetpack--contact-form--button-outline--text-color: ' . esc_attr( $this->get_attribute( 'inputcolor' ) ) . ';';
				$this->field_styles  .= 'color: ' . esc_attr( $this->get_attribute( 'inputcolor' ) ) . ';';
				$this->option_styles .= 'color: ' . esc_attr( $this->get_attribute( 'inputcolor' ) ) . ';';
			}

			if ( ! empty( $this->get_attribute( 'fieldbackgroundcolor' ) ) ) {
				$this->block_styles .= '--jetpack--contact-form--input-background: ' . esc_attr( $this->get_attribute( 'fieldbackgroundcolor' ) ) . ';';
				$this->field_styles .= 'background-color: ' . esc_attr( $this->get_attribute( 'fieldbackgroundcolor' ) ) . ';';
			}

			if ( ! empty( $this->get_attribute( 'fieldfontsize' ) ) ) {
				$this->block_styles  .= '--jetpack--contact-form--font-size: ' . esc_attr( $this->get_attribute( 'fieldfontsize' ) ) . ';';
				$this->field_styles  .= 'font-size: ' . esc_attr( $this->get_attribute( 'fieldfontsize' ) ) . ';';
				$this->option_styles .= 'font-size: ' . esc_attr( $this->get_attribute( 'fieldfontsize' ) ) . ';';
			}

			if ( ! empty( $this->get_attribute( 'labelcolor' ) ) ) {
				$this->label_styles .= 'color: ' . esc_attr( $this->get_attribute( 'labelcolor' ) ) . ';';
			}

			if ( ! empty( $this->get_attribute( 'labelfontsize' ) ) ) {
				$this->label_styles .= 'font-size: ' . esc_attr( $this->get_attribute( 'labelfontsize' ) ) . ';';
			}

			if ( is_numeric( $this->get_attribute( 'labellineheight' ) ) ) {
				$this->label_styles .= 'line-height: ' . (int) $this->get_attribute( 'labellineheight' ) . ';';
			}
		}

		if ( ! empty( $this->get_attribute( 'buttonbackgroundcolor' ) ) ) {
			$this->block_styles .= '--jetpack--contact-form--button-outline--background-color: ' . esc_attr( $this->get_attribute( 'buttonbackgroundcolor' ) ) . ';';
		}
		if ( is_numeric( $this->get_attribute( 'buttonborderradius' ) ) ) {
			$this->block_styles .= '--jetpack--contact-form--button-outline--border-radius: ' . esc_attr( $this->get_attribute( 'buttonborderradius' ) ) . 'px;';
		}
		if ( is_numeric( $this->get_attribute( 'buttonborderwidth' ) ) ) {
			$this->block_styles .= '--jetpack--contact-form--button-outline--border-size: ' . esc_attr( $this->get_attribute( 'buttonborderwidth' ) ) . 'px;';

		}

		if ( ! empty( $field_width ) && ! $this->has_inset_label() ) {
			$class .= ' grunion-field-width-' . $field_width;
		}

		/**
		 * Filters the "class" attribute of the contact form input
		 *
		 * @module contact-form
		 *
		 * @since 6.6.0
		 *
		 * @param string $class Additional CSS classes for input class attribute.
		 */
		$field_class = apply_filters( 'jetpack_contact_form_input_class', $class );

		$this->value = $this->get_computed_field_value( $field_type, $field_id );

		$field_value = Contact_Form_Plugin::strip_tags( $this->value );
		$field_label = Contact_Form_Plugin::strip_tags( $field_label );

		$extra_attrs = array();

		if ( $field_type === 'number' || $field_type === 'slider' ) {
			if ( is_numeric( $this->get_attribute( 'min' ) ) ) {
				$extra_attrs['min'] = $this->get_attribute( 'min' );
			}
			if ( is_numeric( $this->get_attribute( 'max' ) ) ) {
				$extra_attrs['max'] = $this->get_attribute( 'max' );
			}
		}

		$rendered_field = $this->render_field( $field_type, $field_id, $field_label, $field_value, $field_class, $field_placeholder, $field_required, $field_required_text, $extra_attrs );

		/**
		 * Filter the HTML of the Contact Form.
		 *
		 * @module contact-form
		 *
		 * @since 2.6.0
		 *
		 * @param string $rendered_field Contact Form HTML output.
		 * @param string $field_label Field label.
		 * @param int|null $id Post ID.
		 */
		return apply_filters( 'grunion_contact_form_field_html', $rendered_field, $field_label, ( in_the_loop() ? get_the_ID() : null ) );
	}
	/**
	 * Returns the computed field value for a field. It uses the POST, GET, Logged in data.
	 *
	 * @module contact-form
	 *
	 * @param string $field_type The field type.
	 * @param string $field_id The field id.
	 *
	 * @return string
	 */
	public function get_computed_field_value( $field_type, $field_id ) {
		global $current_user, $user_identity;
		// Use the POST Field if it is available.
		if ( isset( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
			if ( is_array( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
				return array_map( 'sanitize_textarea_field', wp_unslash( $_POST[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
			}

			return sanitize_textarea_field( wp_unslash( $_POST[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- no site changes.
		}

		// Use the GET Field if it is available.
		if ( isset( $_GET[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- no site changes.
			if ( is_array( $_GET[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- no site changes.
				return array_map( 'sanitize_textarea_field', wp_unslash( $_GET[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- no site changes.
			}

			return sanitize_textarea_field( wp_unslash( $_GET[ $field_id ] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- no site changes.
		}

		if ( ! is_user_logged_in() ) {
			return $this->get_attribute( 'default' );
		}

		/**
		 * Allow third-party tools to prefill the contact form with the user's details when they're logged in.
		 *
		 * @module contact-form
		 *
		* @since 3.2.0
		*
		* @param bool false Should the Contact Form be prefilled with your details when you're logged in. Default to false.
		*/
		$filter_value = apply_filters( 'jetpack_auto_fill_logged_in_user', false );
		if ( ( ! current_user_can( 'manage_options' ) && ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) || $filter_value ) {
			switch ( $field_type ) {
				case 'email':
					return $current_user->data->user_email;

				case 'name':
					return ! empty( $user_identity ) ? $user_identity : $current_user->data->display_name;

				case 'url':
					return $current_user->data->user_url;
			}
		}

		return $this->get_attribute( 'default' );
	}

	/**
	 * Return the HTML for the label.
	 *
	 * @param string $type - the field type.
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param array  $extra_attrs Array of key/value pairs to append as attributes to the element.
	 * @param bool   $always_render - if the label should always be shown.
	 *
	 * @return string HTML
	 */
	public function render_label( $type, $id, $label, $required, $required_field_text, $extra_attrs = array(), $always_render = false ) {
		$form_style = $this->get_form_style();

		if ( ! empty( $form_style ) && $form_style !== 'default' ) {
			if ( ! in_array( $type, array( 'checkbox', 'checkbox-multiple', 'radio', 'consent', 'file' ), true ) ) {
				switch ( $form_style ) {
					case 'outlined':
						return $this->render_outline_label( $id, $label, $required, $required_field_text );
					case 'animated':
						return $this->render_animated_label( $id, $label, $required, $required_field_text );
					case 'below':
						return $this->render_below_label( $id, $label, $required, $required_field_text );
				}
			}

			if ( ! $always_render ) {
				return '';
			}
		}

		if ( ! empty( $this->label_styles ) ) {
			$extra_attrs['style'] = $this->label_styles;
		}

		$type_class           = $type ? ' ' . $type : '';
		$extra_attrs['class'] = "grunion-field-label{$type_class}" . ( $this->is_error() ? ' form-error' : '' );

		if ( ! empty( $this->label_classes ) ) {
			$extra_attrs['class'] .= ' ' . $this->label_classes;
		}

		$extra_attrs_string = '';

		foreach ( $extra_attrs as $attr => $val ) {
			$extra_attrs_string .= sprintf( '%s="%s" ', esc_attr( $attr ), esc_attr( $val ) );
		}

		$type_class = $type ? ' ' . $type : '';
		return "<label
				for='" . esc_attr( $id ) . "' "
				. $extra_attrs_string
				. '>'
				. wp_kses_post( $label )
				. ( $required ? '<span class="grunion-label-required" aria-hidden="true">' . $required_field_text . '</span>' : '' ) .
			"</label>\n";
	}

	/**
	 * Return the HTML for a legend that shares the same style as a label.
	 *
	 * @param string $type - the field type.
	 * @param int    $id - the ID.
	 * @param string $legend - the legend.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param array  $extra_attrs Array of key/value pairs to append as attributes to the element.
	 *
	 * @return string HTML
	 */
	public function render_legend_as_label( $type, $id, $legend, $required, $required_field_text, $extra_attrs = array() ) {
		if ( ! empty( $this->label_styles ) ) {
			$extra_attrs['style'] = $this->label_styles;
		}

		$type_class           = $type ? ' ' . $type : '';
		$extra_attrs['class'] = "grunion-field-label{$type_class}" . ( $this->is_error() ? ' form-error' : '' );

		if ( ! empty( $this->label_classes ) ) {
			$extra_attrs['class'] .= ' ' . $this->label_classes;
		}

		$extra_attrs_string = '';
		if ( is_array( $extra_attrs ) ) {
			foreach ( $extra_attrs as $attr => $val ) {
				$extra_attrs_string .= sprintf( '%s="%s" ', esc_attr( $attr ), esc_attr( $val ) );
			}
		}

		return '<legend '
				. $extra_attrs_string
				. '>'
				. '<span class="grunion-label-text">' . wp_kses_post( $legend ) . '</span>'
				. ( $required ? '<span class="grunion-label-required">' . $required_field_text . '</span>' : '' )
				. "</legend>\n";
	}

	/**
	 * Return the HTML for the input field.
	 *
	 * @param string $type - the field type.
	 * @param int    $id - the ID.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param string $placeholder - the field placeholder content.
	 * @param bool   $required - if the field is marked as required.
	 * @param array  $extra_attrs Array of key/value pairs to append as attributes to the element.
	 *
	 * @return string HTML
	 */
	public function render_input_field( $type, $id, $value, $class, $placeholder, $required, $extra_attrs = array() ) {
		if ( ! is_string( $value ) ) {
			$value = '';
		}

		$extra_attrs_string = '';

		if ( ! empty( $this->field_styles ) ) {
			$extra_attrs['style'] = $this->field_styles;
		}

		if ( is_array( $extra_attrs ) && ! empty( $extra_attrs ) ) {
			foreach ( $extra_attrs as $attr => $val ) {
				$extra_attrs_string .= sprintf( '%s="%s" ', esc_attr( $attr ), esc_attr( $val ) );
			}
		}

		// this is a hack for Firefox to prevent users from falsly entering a something other then a number into a number field.
		if ( $type === 'number' ) {
			$extra_attrs_string .= " data-wp-on--keypress='actions.handleNumberKeyPress' ";
		}

		return "<input
					type='" . esc_attr( $type ) . "'
					name='" . esc_attr( $id ) . "'
					id='" . esc_attr( $id ) . "'
					value='" . esc_attr( $value ) . "'

					data-wp-bind--aria-invalid='state.fieldHasErrors'
					data-wp-bind--value='state.getFieldValue'
					aria-errormessage='" . esc_attr( $id ) . '-' . esc_attr( $type ) . "-error-message'
					data-wp-on--input='actions.onFieldChange'
					data-wp-on--blur='actions.onFieldBlur'
					data-wp-class--has-value='state.hasFieldValue'

					" . $class . $placeholder . '
					' . ( $required ? "required='true' aria-required='true' " : '' ) .
					$extra_attrs_string .
					" />\n " . $this->get_error_div( $id, $type ) . " \n";
	}

	/**
	 * Return the HTML for the error div.
	 *
	 * @param string $id - the field ID.
	 * @param string $type - the field type.
	 * @param bool   $override_render - if the error div should be rendered even if the label is inset.
	 *
	 * @return string HTML
	 */
	private function get_error_div( $id, $type, $override_render = false ) {

		if ( $this->has_inset_label() && ! $override_render ) {
			return '';
		}
		return '
			<div id="' . esc_attr( $id ) . '-' . esc_attr( $type ) . '-error" class="contact-form__input-error" data-wp-class--has-errors="state.fieldHasErrors">
				<span class="contact-form__warning-icon">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M8.50015 11.6402H7.50015V10.6402H8.50015V11.6402Z" />
						<path d="M7.50015 9.64018H8.50015V6.30684H7.50015V9.64018Z" />
						<path fill-rule="evenodd" clip-rule="evenodd" d="M6.98331 3.0947C7.42933 2.30177 8.57096 2.30177 9.01698 3.09469L13.8771 11.7349C14.3145 12.5126 13.7525 13.4735 12.8602 13.4735H3.14004C2.24774 13.4735 1.68575 12.5126 2.12321 11.7349L6.98331 3.0947ZM8.14541 3.58496C8.08169 3.47168 7.9186 3.47168 7.85488 3.58496L2.99478 12.2251C2.93229 12.3362 3.01257 12.4735 3.14004 12.4735H12.8602C12.9877 12.4735 13.068 12.3362 13.0055 12.2251L8.14541 3.58496Z" />
					</svg>
					<span class="visually-hidden">' . __( 'Warning', 'jetpack-forms' ) . '</span>
				</span>
				<span data-wp-text="state.errorMessage" id="' . esc_attr( $id ) . '-' . esc_attr( $type ) . '-error-message"></span>
			</div>';
	}

	/**
	 * Set the invalid message for specific field types.
	 *
	 * @param string $type - the field type.
	 * @param string $message - the message to display.
	 *
	 * @return void
	 */
	private function set_invalid_message( $type, $message ) {
		wp_interactivity_config(
			'jetpack/form',
			array(
				'error_types' => array(
					'invalid_' . $type => $message,
				),
			)
		);
	}

	/**
	 * Return the HTML for the email field.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 *
	 * @return string HTML
	 */
	public function render_email_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		$this->set_invalid_message( 'email', __( 'Please enter a valid email address', 'jetpack-forms' ) );
		$field  = $this->render_label( 'email', $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'email', $id, $value, $class, $placeholder, $required );
		return $field;
	}

	/**
	 * Return the HTML for the telephone field.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 *
	 * @return string HTML
	 */
	public function render_telephone_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		$this->set_invalid_message( 'telephone', __( 'Please enter a valid phone number', 'jetpack-forms' ) );
		$field  = $this->render_label( 'telephone', $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'tel', $id, $value, $class, $placeholder, $required );
		return $field;
	}

	/**
	 * Return the HTML for the URL field.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 *
	 * @return string HTML
	 */
	public function render_url_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		$this->set_invalid_message( 'url', __( 'Please enter a valid URL - https://www.example.com', 'jetpack-forms' ) );

		$field  = $this->render_label( 'url', $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'text', $id, $value, $class, $placeholder, $required );
		return $field;
	}

	/**
	 * Return the HTML for the text area field.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 *
	 * @return string HTML
	 */
	public function render_textarea_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		if ( ! is_string( $value ) ) {
			$value = '';
		}

		$field  = $this->render_label( 'textarea', 'contact-form-comment-' . $id, $label, $required, $required_field_text );
		$field .= "<textarea
		                style='" . $this->field_styles . "'
		                name='" . esc_attr( $id ) . "'
		                id='contact-form-comment-" . esc_attr( $id ) . "'
		                rows='20'
						data-wp-text='state.getFieldValue'
						data-wp-on--input='actions.onFieldChange'
						data-wp-on--blur='actions.onFieldBlur'
						data-wp-class--has-value='state.hasFieldValue'
						data-wp-bind--aria-invalid='state.fieldHasErrors'
						data-wp-on--keydown='actions.onKeyDownTextarea'
						aria-errormessage='" . esc_attr( $id ) . "-textarea-error-message'
						"
						. $class
						. $placeholder
						. ' ' . ( $required ? "required aria-required='true'" : '' ) .
						'>' . esc_textarea( $value )
				. "</textarea>\n " . $this->get_error_div( $id, 'textarea' ) . "\n";
		return $field;
	}

	/**
	 * Return the HTML for the radio field.
	 *
	 * @param string $id - the ID (starts with 'g' - see constructor).
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 *
	 * @return string HTML
	 */
	public function render_radio_field( $id, $label, $value, $class, $required, $required_field_text ) {
		$this->set_invalid_message( 'radio', __( 'Please select one of the options.', 'jetpack-forms' ) );
		$options_classes   = $this->get_attribute( 'optionsclasses' );
		$options_styles    = $this->get_attribute( 'optionsstyles' );
		$form_style        = $this->get_form_style();
		$is_outlined_style = 'outlined' === $form_style;
		$fieldset_id       = "id='" . esc_attr( "$id-label" ) . "'";

		if ( $is_outlined_style ) {
			$style_variation_attributes = $this->get_attribute( 'stylevariationattributes' );

			if ( ! empty( $style_variation_attributes ) ) {
				$style_variation_attributes = json_decode( html_entity_decode( $style_variation_attributes, ENT_COMPAT ), true );
			}

			// When there's an outlined style, and border radius is set, the existing inline border radius is overridden to apply
			// a limit of `100px` to the radius on the x axis. This achieves the same look and feel as other fields
			// that use the notch html (`notched-label__leading` has a max-width of `100px` to prevent it from getting too wide).
			// It prevents large border radius values from disrupting the look and feel of the fields.
			if ( isset( $style_variation_attributes['border']['radius'] ) ) {
				$options_styles          = $options_styles ?? '';
				$radius                  = $style_variation_attributes['border']['radius'];
				$has_split_radius_values = is_array( $radius );
				$top_left_radius         = $has_split_radius_values ? $radius['topLeft'] : $radius;
				$top_right_radius        = $has_split_radius_values ? $radius['topRight'] : $radius;
				$bottom_left_radius      = $has_split_radius_values ? $radius['bottomLeft'] : $radius;
				$bottom_right_radius     = $has_split_radius_values ? $radius['bottomRight'] : $radius;
				$options_styles         .= "border-top-left-radius: min(100px, {$top_left_radius}) {$top_left_radius};";
				$options_styles         .= "border-top-right-radius: min(100px, {$top_right_radius}) {$top_right_radius};";
				$options_styles         .= "border-bottom-left-radius: min(100px, {$bottom_left_radius}) {$bottom_left_radius};";
				$options_styles         .= "border-bottom-right-radius: min(100px, {$bottom_right_radius}) {$bottom_right_radius};";
			}

			/*
			 * For the "outlined" style, the styles and classes are applied to the fieldset element.
			 */
			$field = "<fieldset {$fieldset_id} class='grunion-radio-options " . esc_attr( $options_classes ) . "' style='" . esc_attr( $options_styles ) . "' data-wp-bind--aria-invalid='state.fieldHasErrors' >";
		} else {
			$field = "<fieldset {$fieldset_id} class='jetpack-field-multiple__fieldset' data-wp-bind--aria-invalid='state.fieldHasErrors' >";
		}

		$field .= $this->render_legend_as_label( '', $id, $label, $required, $required_field_text );

		if ( ! $is_outlined_style ) {
			$field .= "<div class='grunion-radio-options " . esc_attr( $options_classes ) . "' style='" . esc_attr( $options_styles ) . "'>";
		}

		$options_data  = $this->get_attribute( 'optionsdata' );
		$used_html_ids = array();

		if ( ! empty( $options_data ) ) {
			foreach ( $options_data as $option_index => $option ) {
				$option_label = Contact_Form_Plugin::strip_tags( $option['label'] );
				if ( is_string( $option_label ) && '' !== $option_label ) {
					$radio_value = $this->get_option_value( $this->get_attribute( 'values' ), $option_index, $option_label );
					$radio_id    = $id . '-' . sanitize_html_class( $radio_value );

					// If exact id was already used in this radio group, append option index.
					// Multiple 'blue' options would give id-blue, id-blue-1, id-blue-2, etc.
					if ( isset( $used_html_ids[ $radio_id ] ) ) {
						$radio_id .= '-' . $option_index;
					}
					$used_html_ids[ $radio_id ] = true;

					$default_classes = 'contact-form-field';
					$option_styles   = empty( $option['style'] ) ? '' : "style='" . esc_attr( $option['style'] ) . "'";
					$option_classes  = empty( $option['class'] ) ? $default_classes : $default_classes . ' ' . esc_attr( $option['class'] );

					$field .= "<p {$option_styles} class='{$option_classes}'>";
					$field .= "<input
									id='" . esc_attr( $radio_id ) . "'
									type='radio'
									name='" . esc_attr( $id ) . "'
									value='" . esc_attr( $radio_value ) . "'
									data-wp-on--change='actions.onFieldChange' "
									. $class
									. checked( $option_label, $value, false ) . ' '
									. ( $required ? "required aria-required='true'" : '' )
									. '/> ';
					$field .= "<label for='" . esc_attr( $radio_id ) . "' class='grunion-radio-label radio" . ( $this->is_error() ? ' form-error' : '' ) . "'>";
					$field .= "<span class='grunion-field-text'>" . esc_html( $option_label ) . '</span>';
					$field .= '</label>';
					$field .= '</p>';
				}
			}
		} else {
			$field_style = 'style="' . $this->option_styles . '"';

			foreach ( (array) $this->get_attribute( 'options' ) as $option_index => $option ) {
				$option = Contact_Form_Plugin::strip_tags( $option );
				if ( is_string( $option ) && '' !== $option ) {
					$radio_value = $this->get_option_value( $this->get_attribute( 'values' ), $option_index, $option );
					$radio_id    = $id . '-' . sanitize_html_class( $radio_value );

					// If exact id was already used in this radio group, append option index.
					// Multiple 'blue' options would give id-blue, id-blue-1, id-blue-2, etc.
					if ( isset( $used_html_ids[ $radio_id ] ) ) {
						$radio_id .= '-' . $option_index;
					}
					$used_html_ids[ $radio_id ] = true;

					$field .= "<p class='contact-form-field'>";
					$field .= "<input
									id='" . esc_attr( $radio_id ) . "'
									type='radio'
									name='" . esc_attr( $id ) . "'
									value='" . esc_attr( $radio_value ) . "'
									data-wp-on--change='actions.onFieldChange' "
									. $class
									. checked( $option, $value, false ) . ' '
									. ( $required ? "required aria-required='true'" : '' )
									. '/> ';
					$field .= "<label for='" . esc_attr( $radio_id ) . "' {$field_style} class='grunion-radio-label radio" . ( $this->is_error() ? ' form-error' : '' ) . "'>";
					$field .= "<span class='grunion-field-text'>" . esc_html( $option ) . '</span>';
					$field .= '</label>';
					$field .= '</p>';
				}
			}
		}

		if ( ! $is_outlined_style ) {
			$field .= '</div>';
		}
		$field .= $this->get_error_div( $id, 'radio' ) . '</fieldset>';
		return $field;
	}

	/**
	 * Return the HTML for the checkbox field.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 *
	 * @return string HTML
	 */
	public function render_checkbox_field( $id, $label, $value, $class, $required, $required_field_text ) {
		$label_class                   = 'grunion-field-label checkbox';
		$label_class                  .= $this->is_error() ? ' form-error' : '';
		$label_class                  .= $this->label_classes ? ' ' . $this->label_classes : '';
		$label_class                  .= $this->option_classes ? ' ' . $this->option_classes : '';
		$has_inner_block_option_styles = ! empty( $this->get_attribute( 'optionstyles' ) );

		$field  = "<div class='contact-form__checkbox-wrap'>";
		$field .= "<input id='" . esc_attr( $id ) . "' type='checkbox' data-wp-on--change='actions.onFieldChange' name='" . esc_attr( $id ) . "' value='" . esc_attr__( 'Yes', 'jetpack-forms' ) . "' " . $class . checked( (bool) $value, true, false ) . ' ' . ( $required ? "required aria-required='true'" : '' ) . "/> \n";
		$field .= "<label for='" . esc_attr( $id ) . "' class='" . esc_attr( $label_class ) . "' style='" . esc_attr( $this->label_styles ) . ( $has_inner_block_option_styles ? esc_attr( $this->option_styles ) : '' ) . "'>";
		$field .= wp_kses_post( $label ) . ( $required ? '<span class="grunion-label-required" aria-hidden="true">' . $required_field_text . '</span>' : '' );
		$field .= "</label>\n";
		$field .= "<div class='clear-form'></div>\n";
		$field .= '</div>';
		return $field . $this->get_error_div( $id, 'checkbox' );
	}

	/**
	 * Return the HTML for the consent field.
	 *
	 * @param string $id field id.
	 * @param string $class html classes (can be set by the admin).
	 */
	private function render_consent_field( $id, $class ) {
		$consent_type                  = 'explicit' === $this->get_attribute( 'consenttype' ) ? 'explicit' : 'implicit';
		$consent_message               = 'explicit' === $consent_type ? $this->get_attribute( 'explicitconsentmessage' ) : $this->get_attribute( 'implicitconsentmessage' );
		$label_class                   = 'grunion-field-label consent consent-' . esc_attr( $consent_type );
		$label_class                  .= $this->option_classes ? ' ' . $this->option_classes : '';
		$has_inner_block_option_styles = ! empty( $this->get_attribute( 'optionstyles' ) );

		$field = "<label class='" . esc_attr( $label_class ) . "' style='" . esc_attr( $this->label_styles ) . ( $has_inner_block_option_styles ? esc_attr( $this->option_styles ) : '' ) . "'>";

		if ( 'implicit' === $consent_type ) {
			$field .= "\t\t<input aria-hidden='true' type='checkbox' checked name='" . esc_attr( $id ) . "' value='" . esc_attr__( 'Yes', 'jetpack-forms' ) . "' style='display:none;' /> \n";
		} else {
			$field .= "\t\t<input type='checkbox' name='" . esc_attr( $id ) . "' value='" . esc_attr__( 'Yes', 'jetpack-forms' ) . "' " . $class . "/> \n";
		}
		$field .= "\t\t" . wp_kses_post( $consent_message );
		$field .= "</label>\n";
		$field .= "<div class='clear-form'></div>\n";
		return $field;
	}

	/**
	 * Return the HTML for the file field.
	 *
	 * Renders a file upload field with drag-and-drop functionality.
	 *
	 * @since 0.45.0
	 *
	 * @param string $id - the field ID.
	 * @param string $label - the field label.
	 * @param string $class - the field CSS class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 *
	 * @return string HTML for the file upload field.
	 */
	private function render_file_field( $id, $label, $class, $required, $required_field_text ) {
		// Check if Jetpack is active
		if ( ! defined( 'JETPACK__PLUGIN_DIR' ) ) {
			return '<div class="jetpack-form-field-error">' .
				esc_html__( 'File upload field requires Jetpack to be active.', 'jetpack-forms' ) .
				'</div>';
		}

		$this->set_invalid_message( 'file_uploading', __( 'Please wait a moment, file is currently uploading.', 'jetpack-forms' ) );
		$this->set_invalid_message( 'file_has_errors', __( 'Please remove any file upload errors.', 'jetpack-forms' ) );

		// Enqueue necessary scripts and styles.
		$this->enqueue_file_field_assets();

		// Get allowed MIME types for display in the field.
		$accepted_file_types = array_values(
			array(
				'jpg|jpeg|jpe'    => 'image/jpeg',
				'png'             => 'image/png',
				'gif'             => 'image/gif',
				'pdf'             => 'application/pdf',
				'doc'             => 'application/msword',
				'docx'            => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'docm'            => 'application/vnd.ms-word.document.macroEnabled.12',
				'pot|pps|ppt'     => 'application/vnd.ms-powerpoint',
				'pptx'            => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
				'pptm'            => 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
				'odt'             => 'application/vnd.oasis.opendocument.text',
				'ppsx'            => 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
				'ppsm'            => 'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
				'xla|xls|xlt|xlw' => 'application/vnd.ms-excel',
				'xlsx'            => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'xlsm'            => 'application/vnd.ms-excel.sheet.macroEnabled.12',
				'xlsb'            => 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
				'key'             => 'application/vnd.apple.keynote',
				'webp'            => 'image/webp',
				'heic'            => 'image/heic',
				'heics'           => 'image/heic-sequence',
				'heif'            => 'image/heif',
				'heifs'           => 'image/heif-sequence',
				'asc'             => 'application/pgp-keys',
			)
		);

		$accept_attribute_value = implode( ', ', $accepted_file_types );

		// Add accessibility attributes and required status if needed.
		$input_attrs = array(
			'type'       => 'file',
			'class'      => 'jetpack-form-file-field ' . esc_attr( $class ),
			'name'       => esc_attr( $id ),
			'id'         => esc_attr( $id ),
			'accept'     => esc_attr( $accept_attribute_value ),
			'aria-label' => esc_attr( $label ),
		);

		if ( $required ) {
			$input_attrs['required']      = 'required';
			$input_attrs['aria-required'] = 'true';
		}

		$max_files       = 1; // TODO: Dynamically retrieve the max number of files using $this->get_attribute( 'maxfiles' ) if needed in the future.
		$max_file_size   = 20 * 1024 * 1024; // 20MB
		$file_size_units = array(
			_x( 'B', 'unit symbol', 'jetpack-forms' ),
			_x( 'KB', 'unit symbol', 'jetpack-forms' ),
			_x( 'MB', 'unit symbol', 'jetpack-forms' ),
			_x( 'GB', 'unit symbol', 'jetpack-forms' ),
		);

		$global_config = array(
			'i18n'          => array(
				'language'           => get_bloginfo( 'language' ),
				'fileSizeUnits'      => $file_size_units,
				'zeroBytes'          => __( '0 Bytes', 'jetpack-forms' ),
				'uploadError'        => __( 'Error uploading file', 'jetpack-forms' ),
				'folderNotSupported' => __( 'Folder uploads are not supported', 'jetpack-forms' ),
				// translators: %s is the formatted maximum file size.
				'fileTooLarge'       => sprintf( __( 'File is too large. Maximum allowed size is %s.', 'jetpack-forms' ), size_format( $max_file_size ) ),
				'invalidType'        => __( 'This file type is not allowed.', 'jetpack-forms' ),
				'maxFiles'           => __( 'You have exeeded the number of files that you can upload.', 'jetpack-forms' ),
				'uploadFailed'       => __( 'File upload failed, try again.', 'jetpack-forms' ),
			),
			'endpoint'      => $this->get_unauth_endpoint_url(),
			'iconsPath'     => Jetpack_Forms::plugin_url() . 'contact-form/images/file-icons/',
			'maxUploadSize' => $max_file_size,
		);

		wp_interactivity_config( 'jetpack/field-file', $global_config );

		$context = array(
			'isDropping'       => false,
			'fieldId'          => $id,
			'files'            => array(),
			'allowedMimeTypes' => $accepted_file_types,
			'maxFiles'         => $max_files, // max number of files.
			'hasMaxFiles'      => false,
		);

		$field = $this->render_label( 'file', $id, $label, $required, $required_field_text, array(), true );

		ob_start();
		?>
		<div
			class="jetpack-form-file-field__container"
			id="<?php echo esc_attr( $id ); ?>"
			name="dropzone-<?php echo esc_attr( $id ); ?>"
			data-wp-interactive="jetpack/field-file"
			<?php // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- output is pre-escaped by method ?>
			<?php echo wp_interactivity_data_wp_context( $context ); ?>
			data-wp-on--dragover="actions.dragOver"
			data-wp-on--dragleave="actions.dragLeave"
			data-wp-on--mouseleave="actions.dragLeave"
			data-wp-on--drop="actions.fileDropped"
			data-wp-on--jetpack-form-reset="actions.resetFiles"
			data-is-required="<?php echo esc_attr( $required ); ?>"
		>
			<div class="jetpack-form-file-field__dropzone" data-wp-class--is-dropping="context.isDropping" data-wp-class--is-hidden="state.hasMaxFiles">
				<div class="jetpack-form-file-field__dropzone-inner" data-wp-on--click="actions.openFilePicker" data-wp-on--keydown="actions.handleKeyDown" tabindex="0" role="button" aria-label="<?php esc_attr_e( 'Select a file to upload.', 'jetpack-forms' ); ?>"></div>
				<?php // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Content is intentionally unescaped as it contains block content that was previously escaped ?>
				<?php echo html_entity_decode( $this->content, ENT_COMPAT, 'UTF-8' ); ?>
				<input
					type="file" class="jetpack-form-file-field"
					accept="<?php echo esc_attr( $accept_attribute_value ); ?>"
					data-wp-on--change="actions.fileAdded"  />
			</div>
			<div class="jetpack-form-file-field__preview-wrap" name="file-field-<?php echo esc_attr( $id ); ?>" data-wp-class--is-active="state.hasFiles">
				<template data-wp-each--file="context.files" data-wp-key="context.file.id">
					<div class="jetpack-form-file-field__preview" tabindex="0" data-wp-bind--aria-label="context.file.name" data-wp-init--focus="callbacks.focusElement" data-wp-class--is-error="context.file.hasError" data-wp-class--is-complete="context.file.isUploaded">
						<input type="hidden" name="<?php echo esc_attr( $id ); ?>[]" class="jetpack-form-file-field__hidden include-hidden" data-wp-bind--value='context.file.fileJson' value="">
						<div class="jetpack-form-file-field__image-wrap" data-wp-style----progress="context.file.progress" data-wp-class--has-icon="context.file.hasIcon">
							<div class="jetpack-form-file-field__image" data-wp-style--background-image="context.file.url" data-wp-style--mask-image="context.file.mask"></div>
							<div class="jetpack-form-file-field__progress-bar" ></div>
						</div>

						<div class="jetpack-form-file-field__file-wrap">
							<strong class="jetpack-form-file-field__file-name" data-wp-text="context.file.name"></strong>
							<div class="jetpack-form-file-field__file-info" data-wp-class--is-error="context.file.error" data-wp-class--is-complete="context.file.file_id">
								<span class="jetpack-form-file-field__file-size" data-wp-text="context.file.formattedSize"></span>
								<span class="jetpack-form-file-field__seperator"> &middot; </span>
								<span aria-live="polite">
									<span class="jetpack-form-file-field__uploading"><?php esc_html_e( 'Uploading…', 'jetpack-forms' ); ?></span>
									<span class="jetpack-form-file-field__success"><?php esc_html_e( 'Uploaded', 'jetpack-forms' ); ?></span>
									<span class="jetpack-form-file-field__error" data-wp-text="context.file.error"></span>
								</span>
							</div>
						</div>
						<a href="#" class="jetpack-form-file-field__remove" data-wp-bind--data-id='context.file.id' aria-label="<?php esc_attr_e( 'Remove file', 'jetpack-forms' ); ?>" data-wp-on--click="actions.removeFile" data-wp-on--keydown="actions.removeFileKeydown" title="<?php esc_attr_e( 'Remove', 'jetpack-forms' ); ?>"> </a>
					</div>
				</template>
			</div>
		</div>
		<?php
		return $field . ob_get_clean() . $this->get_error_div( $id, 'file' );
	}

	/**
	 * Enqueues scripts and styles needed for the file field.
	 *
	 * @since 0.45.0
	 *
	 * @return void
	 */
	private function enqueue_file_field_assets() {
		$version = Constants::get_constant( 'JETPACK__VERSION' );

		\wp_enqueue_script_module(
			'jetpack-form-file-field',
			plugins_url( '../../dist/modules/file-field/view.js', __FILE__ ),
			array( '@wordpress/interactivity' ),
			$version
		);

		\wp_enqueue_style(
			'jetpack-form-file-field',
			plugins_url( '../../dist/contact-form/css/file-field.css', __FILE__ ),
			array(),
			$version
		);
	}

	/**
	 * Returns the URL for the unauthenticated file upload endpoint.
	 *
	 * @return string
	 */
	private function get_unauth_endpoint_url() {
		// Return a placeholder URL if Jetpack is not active
		if ( ! defined( 'JETPACK__PLUGIN_DIR' ) ) {
			return '#jetpack-not-active';
		}

		return sprintf( 'https://public-api.wordpress.com/wpcom/v2/sites/%d/unauth-file-upload', \Jetpack_Options::get_option( 'id' ) );
	}

	/**
	 * Return the HTML for the multiple checkbox field.
	 *
	 * @param string $id - the ID (starts with 'g' - see constructor).
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 *
	 * @return string HTML
	 */
	public function render_checkbox_multiple_field( $id, $label, $value, $class, $required, $required_field_text ) {
		$options_classes   = $this->get_attribute( 'optionsclasses' );
		$options_styles    = $this->get_attribute( 'optionsstyles' );
		$form_style        = $this->get_form_style();
		$is_outlined_style = 'outlined' === $form_style;

		/*
		 * The `data-required` attribute is used in `accessible-form.js` to ensure at least one
		 * checkbox is checked. Unlike radio buttons, for which the required attribute is satisfied if
		 * any of the radio buttons in the group is selected, adding a required attribute directly to
		 * a checkbox means that this specific checkbox must be checked.
		 */
		$fieldset_id = "id='" . esc_attr( "$id-label" ) . "'";

		if ( $is_outlined_style ) {
			$style_variation_attributes = $this->get_attribute( 'stylevariationattributes' );

			if ( ! empty( $style_variation_attributes ) ) {
				$style_variation_attributes = json_decode( html_entity_decode( $style_variation_attributes, ENT_COMPAT ), true );
			}

			/*
			 * When there's an outlined style, and border radius is set, the existing inline border radius is overridden to apply
			 * a limit of `100px` to the radius on the x axis. This achieves the same look and feel as other fields
			 * that use the notch html (`notched-label__leading` has a max-width of `100px` to prevent it from getting too wide).
			 * It prevents large border radius values from disrupting the look and feel of the fields.
			 */
			if ( isset( $style_variation_attributes['border']['radius'] ) ) {
				$options_styles          = $options_styles ?? '';
				$radius                  = $style_variation_attributes['border']['radius'];
				$has_split_radius_values = is_array( $radius );
				$top_left_radius         = $has_split_radius_values ? $radius['topLeft'] : $radius;
				$top_right_radius        = $has_split_radius_values ? $radius['topRight'] : $radius;
				$bottom_left_radius      = $has_split_radius_values ? $radius['bottomLeft'] : $radius;
				$bottom_right_radius     = $has_split_radius_values ? $radius['bottomRight'] : $radius;
				$options_styles         .= "border-top-left-radius: min(100px, {$top_left_radius}) {$top_left_radius};";
				$options_styles         .= "border-top-right-radius: min(100px, {$top_right_radius}) {$top_right_radius};";
				$options_styles         .= "border-bottom-left-radius: min(100px, {$bottom_left_radius}) {$bottom_left_radius};";
				$options_styles         .= "border-bottom-right-radius: min(100px, {$bottom_right_radius}) {$bottom_right_radius};";
			}

			/*
			 * For the "outlined" style, the styles and classes are applied to the fieldset element.
			 */
			$field = "<fieldset {$fieldset_id} class='grunion-checkbox-multiple-options " . $options_classes . "' style='" . $options_styles . "' " . ( $required ? 'data-required' : '' ) . ' data-wp-bind--aria-invalid="state.fieldHasErrors">';
		} else {
			$field = "<fieldset {$fieldset_id} class='jetpack-field-multiple__fieldset'" . ( $required ? 'data-required' : '' ) . ' data-wp-bind--aria-invalid="state.fieldHasErrors">';
		}

		$field .= $this->render_legend_as_label( '', $id, $label, $required, $required_field_text );

		if ( ! $is_outlined_style ) {
			$field .= "<div class='grunion-checkbox-multiple-options " . $options_classes . "' style='" . $options_styles . "' " . '>';
		}

		$options_data  = $this->get_attribute( 'optionsdata' );
		$used_html_ids = array();

		if ( ! empty( $options_data ) ) {
			foreach ( $options_data as $option_index => $option ) {
				$option_label = Contact_Form_Plugin::strip_tags( $option['label'] );
				if ( is_string( $option_label ) && '' !== $option_label ) {
					$checkbox_value = $this->get_option_value( $this->get_attribute( 'values' ), $option_index, $option_label );
					$checkbox_id    = $id . '-' . sanitize_html_class( $checkbox_value );

					// If exact id was already used in this checkbox group, append option index.
					// Multiple 'blue' options would give id-blue, id-blue-1, id-blue-2, etc.
					if ( isset( $used_html_ids[ $checkbox_id ] ) ) {
						$checkbox_id .= '-' . $option_index;
					}
					$used_html_ids[ $checkbox_id ] = true;

					$default_classes = 'contact-form-field';
					$option_styles   = empty( $option['style'] ) ? '' : "style='" . esc_attr( $option['style'] ) . "'";
					$option_classes  = empty( $option['class'] ) ? $default_classes : $default_classes . ' ' . esc_attr( $option['class'] );

					$field .= "<p {$option_styles} class='{$option_classes}'>";
					$field .= "<input
								id='" . esc_attr( $checkbox_id ) . "'
								type='checkbox'
								data-wp-on--change='actions.onMultipleFieldChange'
								name='" . esc_attr( $id ) . "[]'
								value='" . esc_attr( $checkbox_value ) . "' "
								. $class
								. checked( in_array( $option_label, (array) $value, true ), true, false )
								. ' /> ';
					$field .= "<label for='" . esc_attr( $checkbox_id ) . "' class='grunion-checkbox-multiple-label checkbox-multiple" . ( $this->is_error() ? ' form-error' : '' ) . "'>";
					$field .= "<span class='grunion-field-text'>" . esc_html( $option_label ) . '</span>';
					$field .= '</label>';
					$field .= '</p>';
				}
			}
		} else {
			$field_style = 'style="' . $this->option_styles . '"';

			foreach ( (array) $this->get_attribute( 'options' ) as $option_index => $option ) {
				$option = Contact_Form_Plugin::strip_tags( $option );
				if ( is_string( $option ) && '' !== $option ) {
					$checkbox_value = $this->get_option_value( $this->get_attribute( 'values' ), $option_index, $option );
					$checkbox_id    = $id . '-' . sanitize_html_class( $checkbox_value );

					// If exact id was already used in this checkbox group, append option index.
					// Multiple 'blue' options would give id-blue, id-blue-1, id-blue-2, etc.
					if ( isset( $used_html_ids[ $checkbox_id ] ) ) {
						$checkbox_id .= '-' . $option_index;
					}
					$used_html_ids[ $checkbox_id ] = true;

					$field .= "<p class='contact-form-field'>";
					$field .= "<input
								id='" . esc_attr( $checkbox_id ) . "'
								data-wp-on--change='actions.onMultipleFieldChange'
								type='checkbox'
								name='" . esc_attr( $id ) . "[]'
								value='" . esc_attr( $checkbox_value ) . "' "
								. $class
								. checked( in_array( $option, (array) $value, true ), true, false )
								. ' /> ';
					$field .= "<label for='" . esc_attr( $checkbox_id ) . "' {$field_style} class='grunion-checkbox-multiple-label checkbox-multiple" . ( $this->is_error() ? ' form-error' : '' ) . "'>";
					$field .= "<span class='grunion-field-text'>" . esc_html( $option ) . '</span>';
					$field .= '</label>';
					$field .= '</p>';
				}
			}
		}
		if ( ! $is_outlined_style ) {
			$field .= '</div>';
		}
		$field .= $this->get_error_div( $id, 'select' ) . '</fieldset>';
		return $field;
	}

	/**
	 * Return the HTML for the select field.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 *
	 * @return string HTML
	 */
	public function render_select_field( $id, $label, $value, $class, $required, $required_field_text ) {
		$field  = $this->render_label( 'select', $id, $label, $required, $required_field_text );
		$class  = preg_replace( "/class=['\"]([^'\"]*)['\"]/", 'class="contact-form__select-wrapper $1"', $class );
		$field .= "<div {$class} style='" . esc_attr( $this->field_styles ) . "'>";
		$field .= "\t<span class='contact-form__select-element-wrapper'><select name='" . esc_attr( $id ) . "' id='" . esc_attr( $id ) . "' " . ( $required ? "required aria-required='true'" : '' ) . " data-wp-on--change='actions.onFieldChange' data-wp-bind--aria-invalid='state.fieldHasErrors'>\n";

		if ( $this->get_attribute( 'togglelabel' ) ) {
			$field .= "\t\t<option value=''>" . $this->get_attribute( 'togglelabel' ) . "</option>\n";
		}

		foreach ( (array) $this->get_attribute( 'options' ) as $option_index => $option ) {
			$option = Contact_Form_Plugin::strip_tags( $option );
			if ( is_string( $option ) && $option !== '' ) {
				$field .= "\t\t<option"
								. selected( $option, $value, false )
								. " value='" . esc_attr( $this->get_option_value( $this->get_attribute( 'values' ), $option_index, $option ) )
								. "'>" . esc_html( $option )
								. "</option>\n";
			}
		}
		$field .= "\t</select><span class='jetpack-field-dropdown__icon'></span></span>\n";
		$field .= "</div>\n";

		return $field . $this->get_error_div( $id, 'select' );
	}

	/**
	 * Return the HTML for the email field.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 *
	 * @return string HTML
	 */
	public function render_date_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder ) {
		static $is_loaded = false;
		$this->set_invalid_message( 'date', __( 'Please enter a valid date.', 'jetpack-forms' ) );
		// WARNING: sync data with DATE_FORMATS in jetpack-field-datepicker.js
		$formats = array(
			'mm/dd/yy' => array(
				/* translators: date format. DD is the day of the month, MM the month, and YYYY the year (e.g., 12/31/2023). */
				'label' => __( 'MM/DD/YYYY', 'jetpack-forms' ),
			),
			'dd/mm/yy' => array(
				/* translators: date format. DD is the day of the month, MM the month, and YYYY the year (e.g., 31/12/2023). */
				'label' => __( 'DD/MM/YYYY', 'jetpack-forms' ),
			),
			'yy-mm-dd' => array(
				/* translators: date format. DD is the day of the month, MM the month, and YYYY the year (e.g., 2023-12-31). */
				'label' => __( 'YYYY-MM-DD', 'jetpack-forms' ),
			),
		);

		$date_format = $this->get_attribute( 'dateformat' );
		$date_format = isset( $date_format ) && ! empty( $date_format ) ? $date_format : 'yy-mm-dd';
		$label       = isset( $formats[ $date_format ] ) ? $label . ' (' . $formats[ $date_format ]['label'] . ')' : $label;
		$extra_attrs = array( 'data-format' => $date_format );

		$field  = $this->render_label( 'date', $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'text', $id, $value, $class, $placeholder, $required, $extra_attrs );

		/* For AMP requests, use amp-date-picker element: https://amp.dev/documentation/components/amp-date-picker */
		if ( class_exists( 'Jetpack_AMP_Support' ) && \Jetpack_AMP_Support::is_amp_request() ) {
			return sprintf(
				'<%1$s mode="overlay" layout="container" type="single" input-selector="[name=%2$s]">%3$s</%1$s>',
				'amp-date-picker',
				esc_attr( $id ),
				$field
			);
		}

		Assets::register_script(
			'jp-forms-date-picker',
			'../../dist/contact-form/js/date-picker.js',
			__FILE__,
			array(
				'enqueue'      => true,
				'dependencies' => array(),
				'version'      => Constants::get_constant( 'JETPACK__VERSION' ),
			)
		);

		/**
		 * Filter the localized date picker script.
		 */
		if ( ! $is_loaded ) {
			\wp_localize_script(
				'jp-forms-date-picker',
				'jpDatePicker',
				array(
					'offset' => intval( get_option( 'start_of_week', 1 ) ),
					'lang'   => array(
						// translators: These are the two letter abbreviated name of the week.
						'days'      => array(
							__( 'Su', 'jetpack-forms' ),
							__( 'Mo', 'jetpack-forms' ),
							__( 'Tu', 'jetpack-forms' ),
							__( 'We', 'jetpack-forms' ),
							__( 'Th', 'jetpack-forms' ),
							__( 'Fr', 'jetpack-forms' ),
							__( 'Sa', 'jetpack-forms' ),
						),
						'months'    => array(
							__( 'January', 'jetpack-forms' ),
							__( 'February', 'jetpack-forms' ),
							__( 'March', 'jetpack-forms' ),
							__( 'April', 'jetpack-forms' ),
							__( 'May', 'jetpack-forms' ),
							__( 'June', 'jetpack-forms' ),
							__( 'July', 'jetpack-forms' ),
							__( 'August', 'jetpack-forms' ),
							__( 'September', 'jetpack-forms' ),
							__( 'October', 'jetpack-forms' ),
							__( 'November', 'jetpack-forms' ),
							__( 'December', 'jetpack-forms' ),
						),
						'today'     => __( 'Today', 'jetpack-forms' ),
						'clear'     => __( 'Clear', 'jetpack-forms' ),
						'close'     => __( 'Close', 'jetpack-forms' ),
						'ariaLabel' => array(
							'enterPicker'       => __( 'You are on a date picker input. Use the down key to focus into the date picker. Or type the date in the format MM/DD/YYYY', 'jetpack-forms' ),
							'dayPicker'         => __( 'You are currently inside the date picker, use the arrow keys to navigate between the dates. Use tab key to jump to more controls.', 'jetpack-forms' ),
							'monthPicker'       => __( 'You are currently inside the month picker, use the arrow keys to navigate between the months. Use the space key to select it.', 'jetpack-forms' ),
							'yearPicker'        => __( 'You are currently inside the year picker, use the up and down arrow keys to navigate between the years. Use the space key to select it.', 'jetpack-forms' ),
							'monthPickerButton' => __( 'Month picker. Use the space key to enter the month picker.', 'jetpack-forms' ),
							'yearPickerButton'  => __( 'Year picker. Use the space key to enter the month picker.', 'jetpack-forms' ),
							'dayButton'         => __( 'Use the space key to select the date.', 'jetpack-forms' ),
							'todayButton'       => __( 'Today button. Use the space key to select the current date.', 'jetpack-forms' ),
							'clearButton'       => __( 'Clear button. Use the space key to clear the date picker.', 'jetpack-forms' ),
							'closeButton'       => __( 'Close button. Use the space key to close the date picker.', 'jetpack-forms' ),
						),
					),
				)
			);
			$is_loaded = true;
		}

		return $field;
	}

	/**
	 * Return the HTML for the number field.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 * @param array  $extra_attrs - Extra attributes used in number field, namely `min` and `max`.
	 *
	 * @return string HTML
	 */
	public function render_number_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $extra_attrs = array() ) {
		$this->set_invalid_message( 'number', __( 'Please enter a valid number', 'jetpack-forms' ) );
		if ( isset( $extra_attrs['min'] ) ) {
			// translators: %d is the minimum value.
			$this->set_invalid_message( 'min_number', __( 'Please select a value that is no less than %d.', 'jetpack-forms' ) );
		}
		if ( isset( $extra_attrs['max'] ) ) {
			// translators: %d is the maximum value.
			$this->set_invalid_message( 'max_number', __( 'Please select a value that is no more than %d.', 'jetpack-forms' ) );
		}
		$field  = $this->render_label( 'number', $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'number', $id, $value, $class, $placeholder, $required, $extra_attrs );
		return $field;
	}

	/**
	 * Return the HTML for the default field.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 * @param string $type - the type.
	 *
	 * @return string HTML
	 */
	public function render_default_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $type ) {
		$field  = $this->render_label( $type, $id, $label, $required, $required_field_text );
		$field .= $this->render_input_field( 'text', $id, $value, $class, $placeholder, $required );
		return $field;
	}

	/**
	 * Returns the styles, classes and CSS vars necessary to render fields in the "Outlined" style.
	 * The "Animated" style variation shares the CSS vars, which require similar calculations for the left offset and label left position.
	 * At the block level, the styles are extracted and added to the shortcode attributes in
	 * Contact_Form_Plugin::get_outlined_style_attributes().
	 * This function extracts those styles and applies them to the field,
	 * and ensures any global or theme styles are applied.
	 *
	 * @param string $form_style (optional) The form style.
	 *
	 * @return array {
	 *     @type string $style_attrs The style attributes.
	 *     @type string $css_vars The CSS variables.
	 *     @type string $class_name The class name.
	 * }
	 */
	private function get_form_variation_style_properties( $form_style = 'outlined' ) {
		$css_vars             = '';
		$variation_attributes = $this->get_attribute( 'stylevariationattributes' );
		$variation_attributes = ! empty( $variation_attributes ) ? json_decode( html_entity_decode( $variation_attributes, ENT_COMPAT ), true ) : array();
		$variation_classes    = $this->get_attribute( 'stylevariationclasses' );
		$variation_style      = $this->get_attribute( 'stylevariationstyles' );
		$block_name           = 'jetpack/input';

		if ( $this->maybe_override_type() === 'radio' || $this->maybe_override_type() === 'checkbox-multiple' ) {
			$block_name = 'jetpack/options';
		}

		$global_styles = wp_get_global_styles(
			array( 'border' ),
			array(
				'block_name' => $block_name,
				'transforms' => array( 'resolve-variables' ),
			)
		);

		/*
		 * The `borderwidth` attribute contains the border value that forms used before the migration to global styles.
		 * Any old forms saved in a post will still use this attribute, so it needs to be factored into the css vars for border
		 * to properly support backwards compatibility. So we check if the attribute is set and if it's not empty or '0', which is a valid width value.
		 * For newer forms that use global styles or the block supports styles, this value will be empty and is ignored.
		 */
		$border_width_attribute = $this->get_attribute( 'borderwidth' );
		$legacy_border_size     = ! empty( $border_width_attribute ) || $border_width_attribute === '0' ? $border_width_attribute . 'px' : null;

		$border_radius_attribute = $this->get_attribute( 'borderradius' );
		$legacy_border_radius    = ! empty( $border_radius_attribute ) || $border_radius_attribute === '0' ? $border_radius_attribute . 'px' : $variation_attributes['border']['radius'] ?? null;

		$border_top_size = $legacy_border_size ??
			$variation_attributes['border']['width'] ??
			$variation_attributes['border']['top']['width'] ??
			$global_styles['width'] ??
			$global_styles['top']['width'] ?? null;

		$border_right_size = $legacy_border_size ??

			$variation_attributes['border']['right']['width'] ??
			$global_styles['width'] ??
			$global_styles['right']['width'] ?? null;

		$border_bottom_size = $legacy_border_size ??
			$variation_attributes['border']['width'] ??
			$variation_attributes['border']['bottom']['width'] ??
			$global_styles['width'] ??
			$global_styles['bottom']['width'] ?? null;

		$border_left_size = $legacy_border_size ??
			$variation_attributes['border']['width'] ??
			$variation_attributes['border']['left']['width'] ??
			$global_styles['width'] ??
			$global_styles['left']['width'] ?? null;

		$border_radius = $legacy_border_radius ??
			$global_styles['radius'] ?? null;

		// Border size to accommodate legacy border width attribute.
		$css_vars = $legacy_border_size ? '--jetpack--contact-form--border-size: ' . $legacy_border_size . ';' : '';

		// Border side sizes to accommodate global styles split values.
		$css_vars .= $border_top_size ? '--jetpack--contact-form--border-top-size: ' . $border_top_size . ';' : '';
		$css_vars .= $border_right_size ? '--jetpack--contact-form--border-right-size: ' . $border_right_size . ';' : '';
		$css_vars .= $border_bottom_size ? '--jetpack--contact-form--border-bottom-size: ' . $border_bottom_size . ';' : '';
		$css_vars .= $border_left_size ? '--jetpack--contact-form--border-left-size: ' . $border_left_size . ';' : '';

		// Check if border radius is split or a single value.
		if ( is_array( $border_radius ) ) {
			// If corner radii are set on the top-left or bottom-left of the block, take the maximum of the two.
			// We check the left side due to writing direction—this variable is used to offset text.
			// TODO: this should factor in RTL languages.
			$css_vars .= $border_radius ? '--jetpack--contact-form--border-radius: max(' . $border_radius['topLeft'] . ',' . $border_radius['bottomLeft'] . ');' : '';
		} elseif ( isset( $border_radius ) ) {
			$css_vars .= $border_radius ? '--jetpack--contact-form--border-radius: ' . $border_radius . ';' : '';
		}

		if ( 'outlined' === $form_style ) {
			$css_vars .= '--jetpack--contact-form--notch-width: max(var(--jetpack--contact-form--input-padding-left, 16px), var(--jetpack--contact-form--border-radius));';
		} elseif ( 'animated' === $form_style ) {
			$css_vars .= '--jetpack--contact-form--animated-left-offset: 16px;';
		}

		return array(
			'style'      => $variation_style,
			'css_vars'   => $css_vars,
			'class_name' => $variation_classes,
		);
	}

	/**
	 * Return the HTML for the outlined label.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 *
	 * @return string HTML
	 */
	public function render_outline_label( $id, $label, $required, $required_field_text ) {
		$classes  = 'notched-label__label';
		$classes .= $this->is_error() ? ' form-error' : '';
		$classes .= $this->label_classes ? ' ' . $this->label_classes : '';

		$output_data = $this->get_form_variation_style_properties();

		return '
			<div class="notched-label">
				<div class="notched-label__leading' . esc_attr( $output_data['class_name'] ) . '" style="' . esc_attr( $output_data['style'] ) . '"></div>
				<div class="notched-label__notch' . esc_attr( $output_data['class_name'] ) . '" style="' . esc_attr( $output_data['style'] ) . '">
					<label
						for="' . esc_attr( $id ) . '"
						class=" ' . $classes . '"
						style="' . $this->label_styles . esc_attr( $output_data['css_vars'] ) . '"
					>
					<span class="grunion-label-text">' . esc_html( $label ) . '</span>'
					. ( $required ? '<span class="grunion-label-required" aria-hidden="true">' . $required_field_text . '</span>' : '' ) .
			'</label>
				</div>
				<div class="notched-label__filler' . esc_attr( $output_data['class_name'] ) . '" style="' . esc_attr( $output_data['style'] ) . '"></div>
				<div class="notched-label__trailing' . esc_attr( $output_data['class_name'] ) . '" style="' . esc_attr( $output_data['style'] ) . '"></div>
			</div>';
	}

	/**
	 * Return the HTML for the animated label.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 *
	 * @return string HTML
	 */
	public function render_animated_label( $id, $label, $required, $required_field_text ) {
		$classes  = 'animated-label__label';
		$classes .= $this->is_error() ? ' form-error' : '';
		$classes .= $this->label_classes ? ' ' . $this->label_classes : '';

		return '
			<label
				for="' . esc_attr( $id ) . '"
				class="' . $classes . '"
				style="' . $this->label_styles . '"
			>
				<span class="grunion-label-text">' . wp_kses_post( $label ) . '</span>'
				. ( $required ? '<span class="grunion-label-required" aria-hidden="true">' . $required_field_text . '</span>' : '' ) .
			'</label>';
	}

	/**
	 * Return the HTML for the below label.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 *
	 * @return string HTML
	 */
	public function render_below_label( $id, $label, $required, $required_field_text ) {
		return '
			<label
				for="' . esc_attr( $id ) . '"
				class="below-label__label ' . ( $this->is_error() ? ' form-error' : '' ) . '"
			>'
			. esc_html( $label )
			. ( $required ? '<span>' . $required_field_text . '</span>' : '' ) .
			'</label>';
	}

	/**
	 * Return the HTML for the email field.
	 *
	 * @param string $type - the type.
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param string $placeholder - the field placeholder content.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text for a field marked as required.
	 * @param array  $extra_attrs - extra attributes to be passed to render functions.
	 *
	 * @return string HTML
	 */
	public function render_field( $type, $id, $label, $value, $class, $placeholder, $required, $required_field_text, $extra_attrs = array() ) {
		if ( ! $this->is_field_renderable( $type ) ) {
			return '';
		}

		$trimmed_type = trim( esc_attr( $type ) );
		$class       .= ' grunion-field';

		$form_style = $this->get_form_style();
		if ( ! empty( $form_style ) && $form_style !== 'default' ) {
			if ( isset( $placeholder ) && '' !== $placeholder ) {
				$class .= ' has-placeholder';
			}
		}

		// Field classes.
		$field_class = "class='" . $trimmed_type . ' ' . esc_attr( $class ) . "' ";

		// Shell wrapper classes. Add -wrap to each class.
		$wrap_classes          = empty( $class ) ? '' : implode( '-wrap ', array_filter( explode( ' ', $class ) ) ) . '-wrap';
		$field_wrapper_classes = $this->get_attribute( 'fieldwrapperclasses' ) ? $this->get_attribute( 'fieldwrapperclasses' ) . ' ' : '';

		if ( empty( $label ) && ! $required ) {
			$wrap_classes .= ' no-label';
		}

		$shell_field_class = "class='" . $field_wrapper_classes . 'grunion-field-' . $trimmed_type . '-wrap ' . esc_attr( $wrap_classes ) . "' ";

		/**
		 * Filter the Contact Form required field text
		 *
		 * @module contact-form
		 *
		 * @since 3.8.0
		 *
		 * @param string $var Required field text. Default is "(required)".
		 */
		$required_field_text = wp_kses_post( apply_filters( 'jetpack_required_field_text', $required_field_text ) );

		$block_style       = 'style="' . $this->block_styles . '"';
		$has_inset_label   = $this->has_inset_label();
		$field             = '';
		$field_placeholder = ! empty( $placeholder ) ? "placeholder='" . esc_attr( $placeholder ) . "'" : '';

		$context = array(
			'fieldId'           => $id,
			'fieldType'         => $type,
			'fieldLabel'        => $label,
			'fieldValue'        => $value,
			'fieldPlaceholder'  => $placeholder,
			'fieldIsRequired'   => $required,
			'fieldErrorMessage' => '',
			'fieldExtra'        => $this->get_field_extra( $type, $extra_attrs ),
			'formHash'          => $this->form->hash,
		);

		$interactivity_attrs = ' data-wp-interactive="jetpack/form" ' . wp_interactivity_data_wp_context( $context ) . ' ';
		// Fields with an inset label need an extra wrapper to show the error message below the input.
		if ( $has_inset_label ) {
			$field_width       = $this->get_attribute( 'width' );
			$inset_label_class = array( 'contact-form__inset-label-wrap' );

			if ( ! empty( $field_width ) ) {
				array_push( $inset_label_class, 'grunion-field-width-' . $field_width . '-wrap' );
			}

			$field              .= "\n<div class='" . implode( ' ', $inset_label_class ) . "' {$interactivity_attrs} >\n";
			$interactivity_attrs = ''; // Reset interactivity attributes for the field wrapper.
		}

		$field .= "\n<div {$block_style} {$interactivity_attrs} {$shell_field_class} data-wp-init='callbacks.initializeField' data-wp-on--jetpack-form-reset='callbacks.initializeField' >\n"; // new in Jetpack 6.8.0

		switch ( $type ) {
			case 'email':
				$field .= $this->render_email_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder );
				break;
			case 'telephone':
				$field .= $this->render_telephone_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder );
				break;
			case 'url':
				$field .= $this->render_url_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder );
				break;
			case 'textarea':
				$field .= $this->render_textarea_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder );
				break;
			case 'radio':
				$field .= $this->render_radio_field( $id, $label, $value, $field_class, $required, $required_field_text );
				break;
			case 'checkbox':
				$field .= $this->render_checkbox_field( $id, $label, $value, $field_class, $required, $required_field_text );
				break;
			case 'checkbox-multiple':
				$field .= $this->render_checkbox_multiple_field( $id, $label, $value, $field_class, $required, $required_field_text );
				break;
			case 'select':
				$field .= $this->render_select_field( $id, $label, $value, $field_class, $required, $required_field_text );
				break;
			case 'date':
				$field .= $this->render_date_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder );
				break;
			case 'consent':
				$field .= $this->render_consent_field( $id, $field_class );
				break;
			case 'number':
				$field .= $this->render_number_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $extra_attrs );
				break;
			case 'slider':
				$field .= $this->render_slider_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $extra_attrs );
				break;
			case 'file':
				$field .= $this->render_file_field( $id, $label, $field_class, $required, $required_field_text );
				break;
			case 'rating':
				$field .= $this->render_rating_field(
					$id,
					$label,
					$value,
					$field_class,
					$required,
					$required_field_text
				);
				break;
			default: // text field
				$field .= $this->render_default_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $type );
				break;
		}

		$field .= "\t</div>\n";

		if ( $has_inset_label ) {
			$field .= $this->get_error_div( $id, $type, true );
			// Close the extra wrapper for inset labels.
			$field .= "\t</div>\n";
		}

		return $field;
	}

	/**
	 * Returns the extra attributes for the field.
	 * That are used in field validation.
	 *
	 * @param string $type - the field type.
	 * @param array  $extra_attrs - the extra attributes.
	 *
	 * @return string|array The extra attributes.
	 */
	private function get_field_extra( $type, $extra_attrs ) {
		if ( 'date' === $type ) {
			$date_format = $this->get_attribute( 'dateformat' );
			return isset( $date_format ) && ! empty( $date_format ) ? $date_format : 'yy-mm-dd';
		}

		return $extra_attrs;
	}

	/**
	 * Overrides input type (maybe).
	 *
	 * @module contact-form
	 *
	 * Custom input types, like URL, will rely on browser's implementation to validate
	 * the value. If the input carries a data-type-override, we allow to override
	 * the type at render/submit so it can be validated with custom patterns.
	 * This method will try to match the input's type to a custom data-type-override
	 * attribute and return it. Defaults to input's type.
	 *
	 * @return string The input's type attribute or the overriden type.
	 */
	private function maybe_override_type() {
		// Define overridables-to-custom-type, extend as needed.
		$overridable_types = array( 'text' => array( 'url' ) );
		$type              = $this->get_attribute( 'type' );

		if ( ! array_key_exists( $type, $overridable_types ) ) {
			return $type;
		}

		$override_type = $this->get_attribute( 'data-type-override' );

		if ( in_array( $override_type, $overridable_types[ $type ], true ) ) {
			return $override_type;
		}

		return $type;
	}

	/**
	 * Determines if a form field is valid.
	 *
	 * Add checks here to confirm if any given form field
	 * is configured correctly and thus should be rendered
	 * on the frontend.
	 *
	 * @param string $type - the field type.
	 *
	 * @return bool
	 */
	public function is_field_renderable( $type ) {
		// Check that radio, select, and multiple choice
		// fields have at leaast one valid option.
		if ( $type === 'radio' || $type === 'checkbox-multiple' || $type === 'select' ) {
			$options           = (array) $this->get_attribute( 'options' );
			$non_empty_options = array_filter(
				$options,
				function ( $option ) {
					return $option !== '';
				}
			);
			return count( $non_empty_options ) > 0;
		}

		// File field requires Jetpack to be active
		if ( $type === 'file' && ! defined( 'JETPACK__PLUGIN_DIR' ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Gets the form style based on its CSS class.
	 *
	 * @return string The form style type.
	 */
	private function get_form_style() {
		$class_name = $this->form->get_attribute( 'className' );
		preg_match( '/is-style-([^\s]+)/i', $class_name, $matches );
		return count( $matches ) >= 2 ? $matches[1] : null;
	}

	/**
	 * Checks if the field has an inset label, i.e., a label displayed inside the field instead of above.
	 *
	 * @return boolean
	 */
	private function has_inset_label() {
		$form_style = $this->get_form_style();

		return in_array( $form_style, array( 'outlined', 'animated' ), true );
	}

	/**
	 * Return the HTML for the rating (stars/hearts/etc.) field.
	 *
	 * This field is purely decorative (spans acting as buttons) and stores the
	 * selected rating in a hidden input so it is handled by existing form
	 * validation/submission logic.
	 *
	 * @since 0.46.0
	 *
	 * @param string $id                 Field ID.
	 * @param string $label              Field label.
	 * @param string $value              Current value.
	 * @param string $class              Additional CSS classes.
	 * @param bool   $required           Whether field is required.
	 * @param string $required_field_text Required label text.
	 * @return string HTML markup.
	 */
	private function render_rating_field( $id, $label, $value, $class, $required, $required_field_text ) {
		// Enqueue stylesheet for rating field.
		wp_enqueue_style( 'jetpack-form-field-rating-style', plugins_url( '../../dist/blocks/field-rating/style.css', __FILE__ ), array(), Constants::get_constant( 'JETPACK__VERSION' ) );

		// Read block attributes needed for rendering.

		$max_attr = $this->get_attribute( 'max' );

		$max_rating = is_numeric( $max_attr ) && (int) $max_attr > 0 ? (int) $max_attr : 5;

		$initial_rating = (int) $value ? (int) $value : 0;

		$label_html = $this->render_label( 'rating', $id, $label, $required, $required_field_text );

		/*
		 * Determine which icon SVG to use based on CSS classes.
		 * Check field_classes for style classes (this is where WordPress puts them).
		 */

		$has_hearts_style = false !== strpos( $this->field_classes, 'is-style-hearts' );

		// SVG icon definitions - keep in sync with JavaScript icons.js
		$star_svg  = '<svg class="jetpack-field-rating__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" fill="currentColor" stroke="var(--jetpack--contact-form--rating-star-color, var(--jetpack--contact-form--primary-color, #333))" stroke-width="2" stroke-linejoin="round"></path></svg>';
		$heart_svg = '<svg class="jetpack-field-rating__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" stroke="var(--jetpack--contact-form--rating-star-color, var(--jetpack--contact-form--primary-color, #333))" stroke-width="2" stroke-linejoin="round"></path></svg>';

		$icon_svg = $has_hearts_style ? $heart_svg : $star_svg;

		$spans = '';
		for ( $i = 1; $i <= $max_rating; $i++ ) {
			$spans .= sprintf(
				'<label class="jetpack-field-rating__label">%6$s
					<input
						class="jetpack-field-rating__input"
						type="radio"
						data-wp-on--change="actions.onFieldChange"
						%1$s
						%2$s
						name="%3$s"
						value="%4$s/%5$s" />
				</label>',
				checked( $i, $initial_rating, false ),
				$required ? 'required aria-required="true"' : '',
				esc_attr( $id ),
				esc_attr( $i ),
				esc_attr( $max_rating ),
				$icon_svg
			);
		}

		$style_attr = '';

		$css_styles = array_filter( array_map( 'trim', explode( ';', $this->field_styles ) ) );

		$css_key_value_pairs = array_reduce(
			$css_styles,
			function ( $pairs, $style ) {
				list( $key, $value )   = explode( ':', $style );
				$pairs[ trim( $key ) ] = trim( $value );
				return $pairs;
			},
			array()
		);

		// The rating input overwrites the text color, so we are using a custom logic to set the star color as a CSS variable.
		$has_star_color = isset( $css_key_value_pairs['color'] );

		if ( $has_star_color ) {
			$color_value = $css_key_value_pairs['color'];
			$style_attr  = 'style="--jetpack--contact-form--rating-star-color: ' . esc_attr( $color_value ) . ';';
			unset( $css_key_value_pairs['color'] );
		} else {
			// Theme colors are set in the field_classes attribute
			$preset_colors = array(
				'has-base-color'     => '--wp--preset--color--base',
				'has-contrast-color' => '--wp--preset--color--contrast',
			);

			if ( preg_match( '/has-accent-(\d+)-color/', $this->field_classes, $matches ) ) {
				$accent_number = $matches[1];
				$preset_colors[ 'has-accent-' . $accent_number . '-color' ] = '--wp--preset--color--accent-' . $accent_number;
			}

			foreach ( $preset_colors as $class => $css_var ) {
				if ( strpos( $this->field_classes, $class ) !== false ) {
					$style_attr = 'style="--jetpack--contact-form--rating-star-color: var(' . esc_attr( $css_var ) . ');';

					break;
				}
			}
		}

		$remaining_styles = array_map(
			function ( $key, $value ) {
				return $key . ': ' . $value;
			},
			array_keys( $css_key_value_pairs ),
			array_values( $css_key_value_pairs )
		);

		$style_attr .= ' ' . implode( ';', $remaining_styles ) . '"';

		return $label_html . sprintf(
			'<div class="jetpack-field-rating %3$s" %1$s>%2$s</div>',
			$style_attr,
			$spans,
			$this->field_classes
		) . $this->get_error_div( $id, 'rating' );
	}

	/**
	 * Return the HTML for the slider field.
	 *
	 * @since 5.1.0
	 *
	 * @param int    $id The field ID.
	 * @param string $label The field label.
	 * @param string $value The field value.
	 * @param string $class The field class.
	 * @param bool   $required Whether the field is required.
	 * @param string $required_field_text The required field text.
	 * @param string $placeholder The field placeholder.
	 * @param array  $extra_attrs Extra attributes (e.g., min, max).
	 *
	 * @return string HTML for the slider field.
	 */
	public function render_slider_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $extra_attrs = array() ) {
		$this->enqueue_slider_field_assets();
		$this->set_invalid_message( 'slider', __( 'Please select a valid value', 'jetpack-forms' ) );
		if ( isset( $extra_attrs['min'] ) ) {
			// translators: %d is the minimum value.
			$this->set_invalid_message( 'min_slider', __( 'Please select a value that is no less than %d.', 'jetpack-forms' ) );
		}
		if ( isset( $extra_attrs['max'] ) ) {
			// translators: %d is the maximum value.
			$this->set_invalid_message( 'max_slider', __( 'Please select a value that is no more than %d.', 'jetpack-forms' ) );
		}
		$min            = isset( $extra_attrs['min'] ) ? $extra_attrs['min'] : 0;
		$max            = isset( $extra_attrs['max'] ) ? $extra_attrs['max'] : 100;
		$starting_value = isset( $extra_attrs['default'] ) ? $extra_attrs['default'] : 0;
		$current_value  = ( $value !== '' && $value !== null ) ? $value : $starting_value;

		$field = $this->render_label( 'slider', $id, $label, $required, $required_field_text );

		ob_start();
		?>
		<div class="jetpack-field-slider__input-row"
			data-wp-context='
			<?php
			echo wp_json_encode(
				array(
					'min'     => $min,
					'max'     => $max,
					'default' => $starting_value,
				)
			);
			?>
			'>
			<span class="jetpack-field-slider__min-label"><?php echo esc_html( $min ); ?></span>
			<div class="jetpack-field-slider__input-container">
				<input
					type="range"
					name="<?php echo esc_attr( $id ); ?>"
					id="<?php echo esc_attr( $id ); ?>"
					value="<?php echo esc_attr( $current_value ); ?>"
					min="<?php echo esc_attr( $min ); ?>"
					max="<?php echo esc_attr( $max ); ?>"
					class="<?php echo esc_attr( $class ); ?>"
					placeholder="<?php echo esc_attr( $placeholder ); ?>"
					<?php
					if ( $required ) :
						?>
						required<?php endif; ?>
					data-wp-bind--value="state.getSliderValue"
					data-wp-on--input="actions.onSliderChange"
					data-wp-bind--aria-invalid="state.fieldHasErrors"
				/>
				<div
					class="jetpack-field-slider__value-indicator"
					data-wp-text="state.getSliderValue"
					data-wp-style--left="state.getSliderPosition"
				><?php echo esc_html( $current_value ); ?></div>
			</div>
			<span class="jetpack-field-slider__max-label"><?php echo esc_html( $max ); ?></span>
		</div>
		<?php
		$field .= ob_get_clean();
		return $field . $this->get_error_div( $id, 'slider' );
	}

	/**
	 * Enqueues scripts and styles needed for the slider field.
	 *
	 * @since 5.1.0
	 *
	 * @return void
	 */
	private function enqueue_slider_field_assets() {
		$version = defined( 'JETPACK__VERSION' ) ? \JETPACK__VERSION : '0.1';

		\wp_enqueue_style(
			'jetpack-form-slider-field',
			plugins_url( '../../dist/contact-form/css/slider-field.css', __FILE__ ),
			array(),
			$version
		);

		\wp_enqueue_script_module(
			'jetpack-form-slider-field',
			plugins_url( '../../dist/modules/slider-field/view.js', __FILE__ ),
			array( '@wordpress/interactivity' ),
			$version
		);
	}
}
