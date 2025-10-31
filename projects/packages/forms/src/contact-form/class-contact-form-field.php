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

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

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
				'label'                        => null,
				'togglelabel'                  => null,
				'type'                         => 'text',
				'required'                     => false,
				'requiredtext'                 => null,
				'requiredindicator'            => true,
				'options'                      => array(),
				'optionsdata'                  => array(),
				'id'                           => null,
				'style'                        => null,
				'fieldbackgroundcolor'         => null,
				'buttonbackgroundcolor'        => null,
				'buttonborderradius'           => null,
				'buttonborderwidth'            => null,
				'textcolor'                    => null,
				'default'                      => null,
				'values'                       => null,
				'placeholder'                  => null,
				'class'                        => null,
				'width'                        => null,
				'consenttype'                  => null,
				'dateformat'                   => null,
				'implicitconsentmessage'       => null,
				'explicitconsentmessage'       => null,
				'borderradius'                 => null,
				'borderwidth'                  => null,
				'lineheight'                   => null,
				'labellineheight'              => null,
				'bordercolor'                  => null,
				'inputcolor'                   => null,
				'labelcolor'                   => null,
				'labelfontsize'                => null,
				'fieldfontsize'                => null,
				'labelclasses'                 => null,
				'labelstyles'                  => null,
				'inputclasses'                 => null,
				'inputstyles'                  => null,
				'optionclasses'                => null,
				'optionstyles'                 => null,
				'min'                          => null,
				'max'                          => null,
				'minlabel'                     => null,
				'maxlabel'                     => null,
				'step'                         => null,
				'maxfiles'                     => null,
				'fieldwrapperclasses'          => null,
				'stylevariationattributes'     => array(),
				'stylevariationclasses'        => null,
				'stylevariationstyles'         => null,
				'optionsclasses'               => null,
				'optionsstyles'                => null,
				'align'                        => null,
				'variation'                    => null,
				'iconstyle'                    => null, // For rating field icon style (lowercase for shortcode compatibility)
				// full phone field attributes, might become a standalone country list input block
				'showcountryselector'          => false,
				'searchplaceholder'            => false,
				// Image select field attributes
				'ismultiple'                   => null,
				'showlabels'                   => null,
				'issupersized'                 => null,
				'randomizeoptions'             => null,
				'showotheroption'              => null,
				// derived from block metadata for blockVisibility support
				'labelhiddenbyblockvisibility' => null,
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

		// allow boolean values for showcountryselector, only if it's set so we don't pollute other fields attrs
		if ( isset( $attributes['showcountryselector'] ) ) {
			if ( true === $attributes['showcountryselector'] || '1' === $attributes['showcountryselector'] || 'true' === strtolower( $attributes['showcountryselector'] ) ) {
				$attributes['showcountryselector'] = true;
			} else {
				$attributes['showcountryselector'] = false;
			}
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
		$this->form->add_error( $this->get_attribute( 'id' ), $message );
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
	 * Check if the field has a value.
	 *
	 * This is used to determine if the field has been filled out by the user.
	 *
	 * @return bool True if the field has a value, false otherwise.
	 */
	public function has_value() {
		$field_id    = $this->get_attribute( 'id' );
		$field_value = isset( $_POST[ $field_id ] ) ? wp_unslash( $_POST[ $field_id ] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- no site changes.

		if ( is_array( $field_value ) ) {
			if ( empty( $field_value ) ) {
				return false;
			}
			return ! empty( array_filter( $field_value ) );
		}
		return ! empty( trim( $field_value ) );
	}

	/**
	 * Validates the form input
	 */
	public function validate() {
		// If the field is already invalid, don't validate it again.
		if ( $this->is_error() ) {
			return;
		}

		$field_type = $this->maybe_override_type();
		// If it's not required, there's nothing to validate
		if ( ! $this->get_attribute( 'required' ) && ! $this->has_value() ) {
			return;
		}

		if ( ! $this->is_field_renderable( $field_type ) ) {
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
					$this->add_error( sprintf( __( '%s: Please enter a valid URL - https://www.example.com.', 'jetpack-forms' ), $field_label ) );
				}
				break;
			case 'email':
				// Make sure the email address is valid
				if ( ! is_string( $field_value ) || ! is_email( $field_value ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s requires a valid email address.', 'jetpack-forms' ), $field_label ) );
				}
				break;
			case 'checkbox-multiple':
				// Check that there is at least one option selected
				if ( empty( $field_value ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s requires at least one selection.', 'jetpack-forms' ), $field_label ) );
				} else {

					$options_data    = (array) $this->get_attribute( 'optionsdata' );
					$possible_values = array();
					if ( ! empty( $options_data ) ) {
						foreach ( $options_data as $option_index => $option ) {
							$option_label = isset( $option['label'] ) ? Contact_Form_Plugin::strip_tags( $option['label'] ) : '';
							if ( is_string( $option_label ) && '' !== $option_label ) {
								$possible_values[] = $this->get_option_value( $this->get_attribute( 'values' ), $option_index, $option_label );
							}
						}
					} else {
						foreach ( (array) $this->get_attribute( 'options' ) as $option_index => $option ) {
							$option = Contact_Form_Plugin::strip_tags( $option );
							if ( is_string( $option ) && '' !== $option ) {
								$possible_values[] = $this->get_option_value( $this->get_attribute( 'values' ), $option_index, $option );
							}
						}
					}

					$non_empty_options = array_map( array( $this, 'sanitize_text_field' ), $possible_values );

					foreach ( $field_value  as $field_value_item ) {
						if ( ! in_array( $field_value_item, $non_empty_options, true ) ) {
							/* translators: %s is the name of a form field */
							$this->add_error( sprintf( __( '%s requires at least one selection.', 'jetpack-forms' ), $field_label ) );
							break;
						}
					}
				}
				break;
			case 'radio':
				// Check that there is at least one option selected
				if ( empty( $field_value ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s requires at least one selection.', 'jetpack-forms' ), $field_label ) );
				} else {
					// Check that the selected options are valid
					$options      = (array) $this->get_attribute( 'options' );
					$options_data = (array) $this->get_attribute( 'optionsdata' );

					if ( ! empty( $options_data ) ) {
						$options = array_map(
							function ( $option ) {
								return $this->sanitize_text_field( trim( $option['label'] ) );
							},
							$options_data
						);
					} else {
						$options = array_map( array( $this, 'sanitize_text_field' ), $options );
					}
					$non_empty_options = array_filter(
						$options,
						function ( $option ) {
							return $option !== '';
						}
					);

					if ( ! in_array( $field_value, $non_empty_options, true ) ) {
						/* translators: %s is the name of a form field */
						$this->add_error( sprintf( __( '%s requires at least one selection.', 'jetpack-forms' ), $field_label ) );
						break;
					}
				}
				break;
			case 'image-select':
				// Check that there is at least one option selected
				if ( empty( $field_value ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s requires at least one selection.', 'jetpack-forms' ), $field_label ) );
				} else {
					// Check that the selected options are valid
					$options      = (array) $this->get_attribute( 'options' );
					$options_data = (array) $this->get_attribute( 'optionsdata' );

					if ( ! empty( $options_data ) ) {
						// Extract letters from options_data for validation
						$options = array_map(
							function ( $option ) {
								return sanitize_text_field( trim( $option['letter'] ?? '' ) );
							},
							$options_data
						);
					}

					$non_empty_options = array_filter(
						$options,
						function ( $option ) {
							return $option !== '';
						}
					);

					// For single selection (radio), check if the selected value is in the options
					if ( ! $this->get_attribute( 'ismultiple' ) ) {
						// Decode the JSON response to get the selected value
						$decoded_value  = json_decode( $field_value, true );
						$selected_value = $decoded_value['selected'] ?? '';

						if ( ! in_array( $selected_value, $non_empty_options, true ) ) {
							/* translators: %s is the name of a form field */
							$this->add_error( sprintf( __( '%s requires a valid selection.', 'jetpack-forms' ), $field_label ) );
						}
					} else {
						// For multiple selection (checkbox), check each selected value
						foreach ( $field_value as $field_value_item ) {
							// Decode the JSON response to get the selected value
							$decoded_item   = json_decode( $field_value_item, true );
							$selected_value = $decoded_item['selected'] ?? '';

							if ( ! in_array( $selected_value, $non_empty_options, true ) ) {
								/* translators: %s is the name of a form field */
								$this->add_error( sprintf( __( '%s requires valid selections.', 'jetpack-forms' ), $field_label ) );
								break;
							}
						}
					}
				}
				break;
			case 'number':
				// Make sure the number address is valid
				if ( ! is_numeric( $field_value ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s requires a number.', 'jetpack-forms' ), $field_label ) );
				}
				break;
			case 'time':
				// Make sure the number address is valid
				if ( ! preg_match( '/^(?:2[0-3]|[01][0-9]):[0-5][0-9]$/', $field_value ) ) {
					/* translators: %s is the name of a form field */
					$this->add_error( sprintf( __( '%s requires a time', 'jetpack-forms' ), $field_label ) );
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
					$this->add_error( sprintf( __( '%s field is required.', 'jetpack-forms' ), $field_label ) );
				}
		}
	}
	/**
	 * Sanitize a text field value and html_entity_decode the field.
	 *
	 * @param string $field_value The field value to sanitize.
	 * @return string The sanitized field value.
	 */
	public function sanitize_text_field( $field_value ) {
		return sanitize_text_field( html_entity_decode( $field_value, ENT_COMPAT ) );
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

		$field_id                 = $this->get_attribute( 'id' );
		$field_type               = $this->maybe_override_type();
		$field_label              = $this->get_attribute( 'label' );
		$field_required           = $this->get_attribute( 'required' );
		$field_required_text      = $this->get_attribute( 'requiredtext' );
		$field_required_indicator = (bool) $this->get_attribute( 'requiredindicator' );
		$field_placeholder        = $this->get_attribute( 'placeholder' );
		$field_width              = $this->get_attribute( 'width' );
		$class                    = 'date' === $field_type ? 'jp-contact-form-date' : $this->get_attribute( 'class' );

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
			if ( is_numeric( $this->get_attribute( 'step' ) ) ) {
				$extra_attrs['step'] = $this->get_attribute( 'step' );
			}
		}

		if ( $field_type === 'slider' ) {
			$minlabel = $this->get_attribute( 'minlabel' );
			$maxlabel = $this->get_attribute( 'maxlabel' );
			if ( null !== $minlabel && '' !== $minlabel ) {
				$extra_attrs['minLabel'] = $minlabel;
			}
			if ( null !== $maxlabel && '' !== $maxlabel ) {
				$extra_attrs['maxLabel'] = $maxlabel;
			}
		}

		$rendered_field = $this->render_field( $field_type, $field_id, $field_label, $field_value, $field_class, $field_placeholder, $field_required, $field_required_text, $extra_attrs, $field_required_indicator );

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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_label( $type, $id, $label, $required, $required_field_text, $extra_attrs = array(), $always_render = false, $required_indicator = true ) {
		if ( $this->attributes['labelhiddenbyblockvisibility'] ) {
			return '';
		}
		$form_style = $this->get_form_style();

		if ( ! empty( $form_style ) && $form_style !== 'default' ) {
			if ( ! in_array( $type, array( 'checkbox', 'checkbox-multiple', 'radio', 'consent', 'file' ), true ) ) {
				switch ( $form_style ) {
					case 'outlined':
						return $this->render_outline_label( $id, $label, $required, $required_field_text, $required_indicator );
					case 'animated':
						return $this->render_animated_label( $id, $label, $required, $required_field_text, $required_indicator );
					case 'below':
						return $this->render_below_label( $id, $label, $required, $required_field_text, $required_indicator );
				}
			}

			if ( ! $always_render ) {
				return '';
			}
		}

		if ( ! empty( $this->label_styles ) ) {
			$extra_attrs['style'] = $this->label_styles;
		}

		$type_class = $type ? ' ' . $type : '';

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
				. ( $required && $required_indicator ? '<span class="grunion-label-required" aria-hidden="true">' . $required_field_text . '</span>' : '' ) .
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_legend_as_label( $type, $id, $legend, $required, $required_field_text, $extra_attrs = array(), $required_indicator = true ) {
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
				. ( $required && $required_indicator ? '<span class="grunion-label-required">' . $required_field_text . '</span>' : '' )
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

		// this is a hack for Firefox to prevent users from falsely entering a something other than a number into a number field.
		if ( $type === 'number' ) {
			$extra_attrs_string .= " data-wp-on--keypress='actions.handleNumberKeyPress' ";
		}

		if ( $this->get_attribute( 'labelhiddenbyblockvisibility' ) ) {
			$aria_label          = ! empty( $placeholder ) ? $placeholder : Contact_Form_Plugin::strip_tags( $this->get_attribute( 'label' ) );
			$extra_attrs_string .= " aria-label='" . esc_attr( $aria_label ) . "' ";
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_email_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $required_indicator = true ) {
		$this->set_invalid_message( 'email', __( 'Please enter a valid email address', 'jetpack-forms' ) );
		$field  = $this->render_label( 'email', $id, $label, $required, $required_field_text, array(), false, $required_indicator );
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_telephone_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $required_indicator = true ) {
		$show_country_selector = $this->get_attribute( 'showcountryselector' );
		$default_country       = $this->get_attribute( 'default' );
		$search_placeholder    = $this->get_attribute( 'searchplaceholder' );

		if ( ! $show_country_selector ) {
			// old telephone field treatment
			$this->set_invalid_message( 'telephone', __( 'Please enter a valid phone number', 'jetpack-forms' ) );
			$label = $this->render_label( 'telephone', $id, $label, $required, $required_field_text, array(), false, $required_indicator );
			$field = $this->render_input_field( 'tel', $id, $value, $class, $placeholder, $required );
			return $label . $field;
		}

		if ( empty( $search_placeholder ) ) {
			$search_placeholder = __( 'Search countries…', 'jetpack-forms' );
		}

		$this->enqueue_phone_field_assets();

		// $class is ill-formed, so we need to fix it
		// Strip 'class=' and quotes to get just the class names
		$class_names = preg_replace( "/^class=['\"]([^'\"]*)['\"].*$/", '$1', $class );

		$link_label_id = $id . '-number';

		$this->set_invalid_message( 'phone', __( 'Please enter a valid phone number', 'jetpack-forms' ) );
		$label = $this->render_label( 'phone', $link_label_id, $label, $required, $required_field_text, array(), false, $required_indicator );
		if ( ! is_string( $value ) ) {
			$value = '';
		}

		$translated_countries = $this->get_translatable_countries();
		$global_config        = array(
			'i18n' => array(
				'countryNames' => $translated_countries,
			),
		);
		wp_interactivity_config( 'jetpack/field-phone', $global_config );
		ob_start();
		?>
		<div
			class="jetpack-field__input-phone-wrapper <?php echo esc_attr( $this->get_attribute( 'stylevariationclasses' ) ); ?> <?php echo esc_attr( $class_names ); ?>"
			style="<?php echo ( ! empty( $this->field_styles ) && is_string( $this->field_styles ) ? esc_attr( $this->field_styles ) : '' ); ?>"
			data-wp-on--jetpack-form-reset='actions.phoneResetHandler'
			data-wp-class--is-combobox-open="context.comboboxOpen"
			<?php
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- function is supposed to work this way
			echo wp_interactivity_data_wp_context(
				array(
					'fieldId'             => $id,
					'defaultCountry'      => $default_country,
					'showCountrySelector' => $this->get_attribute( 'showcountryselector' ),
					// dynamic
					'phoneNumber'         => '',
					'phoneCountryCode'    => $default_country,
					'fullPhoneNumber'     => '',
					'countryPrefix'       => '',
					// combobox state
					'useCombobox'         => true,
					'comboboxOpen'        => false,
					'searchTerm'          => '',
					'allCountries'        => array(),
					'filteredCountries'   => array(),
					'selectedCountry'     => array(),
				)
			);
			?>
			>
				<div class="jetpack-field__input-prefix"
					data-wp-bind--hidden="!context.showCountrySelector"
					data-wp-on-document--click="actions.phoneComboboxDocumentClickHandler">
					<div class="jetpack-custom-combobox">

						<button
							class="jetpack-combobox-trigger"
							type="button"
							data-wp-on--click="actions.phoneComboboxToggle"
							data-wp-bind--aria-expanded="context.comboboxOpen">
							<span
								class="jetpack-combobox-selected"
								data-wp-text="context.selectedCountry.flag"></span>
							<span
								class="jetpack-combobox-trigger-arrow"
								data-wp-class--is-open="context.comboboxOpen">
								<svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</span>
							<span
								class="jetpack-combobox-selected"
								data-wp-text="context.selectedCountry.value"></span>
						</button>
						<div
							class="jetpack-combobox-dropdown <?php echo esc_attr( $this->get_attribute( 'stylevariationclasses' ) ); ?>"
							style="<?php echo ( ! empty( $this->field_styles ) && is_string( $this->field_styles ) ? esc_attr( $this->field_styles ) : '' ); ?>"
							data-wp-bind--hidden="!context.comboboxOpen">
							<input
								class="jetpack-combobox-search"
								type="text"
								placeholder="<?php echo esc_attr( $search_placeholder ); ?>"
								data-wp-on--input="actions.phoneComboboxInputHandler"
								data-wp-on--keydown="actions.phoneComboboxKeydownHandler"
								data-wp-init="callbacks.registerPhoneComboboxSearchInput">
							<div class="jetpack-combobox-options" data-wp-init="callbacks.registerPhoneComboboxOptionsList">
								<template
									data-wp-each--filtered="context.filteredCountries"
									data-wp-each-key="context.filtered.code">
									<div
										class="jetpack-combobox-option"
										data-wp-key="context.filtered.code"
										data-wp-class--jetpack-combobox-option-selected="context.filtered.selected"
										data-wp-on--click="actions.phoneCountryChangeHandler">
										<span class="jetpack-combobox-option-icon" data-wp-text="context.filtered.flag"></span>
										<span class="jetpack-combobox-option-value" data-wp-text="context.filtered.value"></span>
										<span class="jetpack-combobox-option-description" data-wp-text="context.filtered.country"></span>
									</div>
								</template>
							</div>
						</div>
					</div>
				</div>
				<input
					class="jetpack-field__input-element"
					<?php // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- both are escaped in calling function ?>
					<?php echo $placeholder; ?>
					type="tel"
					<?php if ( $required ) { ?>
						required="true"
						aria-required="true"
					<?php } ?>
					id="<?php echo esc_attr( $link_label_id ); ?>"
					name="<?php echo esc_attr( $link_label_id ); ?>"
					data-wp-bind--disabled='state.isSubmitting'
					data-wp-bind--aria-invalid='state.fieldHasErrors'
					data-wp-bind--value='context.phoneNumber'
					aria-errormessage="<?php echo esc_attr( $id ); ?>-phone-error-message"
					data-wp-on--input='actions.phoneNumberInputHandler'
					data-wp-on--blur='actions.onFieldBlur'
					data-wp-on--focus='actions.phoneNumberFocusHandler'
					data-wp-class--has-value='context.phoneNumber'
					data-wp-init="callbacks.registerPhoneInput"
					data-wp-init--phone-field-custom-combobox="callbacks.initializePhoneFieldCustomComboBox"
					<?php if ( $this->get_attribute( 'labelhiddenbyblockvisibility' ) ) { ?>
						aria-label="<?php echo esc_attr( $this->get_attribute( 'label' ) ); ?>"
					<?php } ?>
					/>
				<input type="hidden"
					id="<?php echo esc_attr( $id ); ?>"
					name="<?php echo esc_attr( $id ); ?>"
					data-wp-bind--value='context.fullPhoneNumber' />
		</div>
		<?php
		$input = ob_get_clean();

		$field = $label . $input . $this->get_error_div( $id, 'telephone' );
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_url_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $required_indicator = true ) {
		$this->set_invalid_message( 'url', __( 'Please enter a valid URL - https://www.example.com', 'jetpack-forms' ) );

		$field  = $this->render_label( 'url', $id, $label, $required, $required_field_text, array(), false, $required_indicator );
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_textarea_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $required_indicator = true ) {
		if ( ! is_string( $value ) ) {
			$value = '';
		}

		$field      = $this->render_label( 'textarea', 'contact-form-comment-' . $id, $label, $required, $required_field_text, array(), false, $required_indicator );
		$aria_label = ! empty( $placeholder ) ? $placeholder : Contact_Form_Plugin::strip_tags( $this->get_attribute( 'label' ) );
		$field     .= "<textarea
		                style='" . $this->field_styles . "'
		                name='" . esc_attr( $id ) . "'
		                id='contact-form-comment-" . esc_attr( $id ) . "'
		                rows='20'
						data-wp-text='state.getFieldValue'
						data-wp-on--input='actions.onFieldChange'
						data-wp-on--blur='actions.onFieldBlur'
						data-wp-class--has-value='state.hasFieldValue'
						data-wp-bind--aria-invalid='state.fieldHasErrors'
						aria-errormessage='" . esc_attr( $id ) . "-textarea-error-message'
						"
						. ( $this->get_attribute( 'labelhiddenbyblockvisibility' )
							? "aria-label='" . esc_attr( $aria_label ) . "'"
							: '' )
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_radio_field( $id, $label, $value, $class, $required, $required_field_text, $required_indicator = true ) {
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

		$field .= $this->render_legend_as_label( '', $id, $label, $required, $required_field_text, array(), $required_indicator );

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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_checkbox_field( $id, $label, $value, $class, $required, $required_field_text, $required_indicator = true ) {
		$label_class                   = 'grunion-field-label checkbox';
		$label_class                  .= $this->is_error() ? ' form-error' : '';
		$label_class                  .= $this->label_classes ? ' ' . $this->label_classes : '';
		$label_class                  .= $this->option_classes ? ' ' . $this->option_classes : '';
		$has_inner_block_option_styles = ! empty( $this->get_attribute( 'optionstyles' ) );

		$field  = "<div class='contact-form__checkbox-wrap' style='" . ( $has_inner_block_option_styles ? esc_attr( $this->option_styles ) : '' ) . "' >";
		$field .= "<input id='" . esc_attr( $id ) . "' type='checkbox' data-wp-on--change='actions.onFieldChange' name='" . esc_attr( $id ) . "' value='" . esc_attr__( 'Yes', 'jetpack-forms' ) . "' " . $class . checked( (bool) $value, true, false ) . ' ' . ( $required ? "required aria-required='true'" : '' ) . "/> \n";
		$field .= "<label for='" . esc_attr( $id ) . "' class='" . esc_attr( $label_class ) . "' style='" . esc_attr( $this->label_styles ) . ( $has_inner_block_option_styles ? esc_attr( $this->option_styles ) : '' ) . "'>";
		$field .= wp_kses_post( $label ) . ( $required && $required_indicator ? '<span class="grunion-label-required" aria-hidden="true">' . $required_field_text . '</span>' : '' );
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
			$field .= "\t\t<input type='hidden' name='" . esc_attr( $id ) . "' value='" . esc_attr__( 'Yes', 'jetpack-forms' ) . "' /> \n";
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML for the file upload field.
	 */
	private function render_file_field( $id, $label, $class, $required, $required_field_text, $required_indicator = true ) {
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
				'maxFiles'           => __( 'You have exceeded the number of files that you can upload.', 'jetpack-forms' ),
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

		$field = $this->render_label( 'file', $id, $label, $required, $required_field_text, array(), true, $required_indicator );

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
	 * Render a hidden field.
	 *
	 * @param string $id - the field ID.
	 * @param string $label - the field label.
	 * @param string $value - the value of the field.
	 *
	 * @return string HTML for the hidden field.
	 */
	private function render_hidden_field( $id, $label, $value ) {
		/**
		 *
		 * Filter the value of the hidden field.
		 *
		 * @since 6.3.0
		 *
		 * @param string $value The value of the hidden field.
		 * @param string $label The label of the hidden field.
		 * @param string $id The ID of the hidden field.
		 *
		 * @return string The modified value of the hidden field.
		 */
		$value = apply_filters( 'jetpack_forms_hidden_field_value', $value, $label, $id );
		return "<input type='hidden' name='" . esc_attr( $id ) . "' id='" . esc_attr( $id ) . "' value='" . esc_attr( $value ) . "' />\n";
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_checkbox_multiple_field( $id, $label, $value, $class, $required, $required_field_text, $required_indicator = true ) {
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

		$field .= $this->render_legend_as_label( '', $id, $label, $required, $required_field_text, array(), $required_indicator );

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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_select_field( $id, $label, $value, $class, $required, $required_field_text, $required_indicator = true ) {
		$field      = $this->render_label( 'select', $id, $label, $required, $required_field_text, array(), false, $required_indicator );
		$class      = preg_replace( "/class=['\"]([^'\"]*)['\"]/", 'class="contact-form__select-wrapper $1"', $class );
		$field     .= "<div {$class} style='" . esc_attr( $this->field_styles ) . "'>";
		$aria_label = ! empty( $this->get_attribute( 'togglelabel' ) )
			? Contact_Form_Plugin::strip_tags( $this->get_attribute( 'togglelabel' ) )
			: __( 'Select an option', 'jetpack-forms' ); // selects don't have a default label
		$field     .= "\t<span class='contact-form__select-element-wrapper'><select name='" . esc_attr( $id ) . "' id='" . esc_attr( $id ) . "' " . ( $required ? "required aria-required='true'" : '' ) . " data-wp-on--change='actions.onFieldChange' data-wp-bind--aria-invalid='state.fieldHasErrors' " . ( $this->get_attribute( 'labelhiddenbyblockvisibility' ) ? "aria-label='" . esc_attr( $aria_label ) . "'" : '' ) . ">\n";

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
	 * Return the HTML for the date field.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_date_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $required_indicator = true ) {
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

		$field  = $this->render_label( 'date', $id, $label, $required, $required_field_text, array(), false, $required_indicator );
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
	 * Return the HTML for the time field.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param string $placeholder - the field placeholder content.
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_time_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $required_indicator = true ) {
		$this->set_invalid_message( 'time', __( 'Please enter a valid time.', 'jetpack-forms' ) );

		$field  = $this->render_label( 'time', $id, $label, $required, $required_field_text, array(), false, $required_indicator );
		$field .= $this->render_input_field( 'time', $id, $value, $class, $placeholder, $required );

		return $field;
	}

	/**
	 * Return the HTML for the image select field.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param string $value - the value of the field.
	 * @param string $class - the field class.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_image_select_field( $id, $label, $value, $class, $required, $required_field_text, $required_indicator = true ) {
		wp_enqueue_style( 'jetpack-form-field-image-select-style', plugins_url( '../../dist/blocks/field-image-select/style.css', __FILE__ ), array(), Constants::get_constant( 'JETPACK__VERSION' ) );

		$is_multiple       = $this->get_attribute( 'ismultiple' );
		$show_labels       = $this->get_attribute( 'showlabels' );
		$randomize_options = $this->get_attribute( 'randomizeoptions' );
		$is_supersized     = $this->get_attribute( 'issupersized' );

		$input_type = $is_multiple ? 'checkbox' : 'radio';
		$input_name = $is_multiple ? $id . '[]' : $id;

		$field = "<div class='jetpack-field jetpack-field-image-select'>";

		$fieldset_id = "id='" . esc_attr( "$id-label" ) . "'";

		$field .= "<fieldset {$fieldset_id} data-wp-bind--aria-invalid='state.fieldHasErrors' >";

		$field .= $this->render_legend_as_label( '', $id, $label, $required, $required_field_text, array(), $required_indicator );

		$options_classes = $this->get_attribute( 'optionsclasses' );
		$options_styles  = $this->get_attribute( 'optionsstyles' );

		$field .= "<div class='" . esc_attr( $options_classes ) . " jetpack-field jetpack-fieldset-image-options' style='" . esc_attr( $options_styles ) . "'>";
		$field .= "<div class='jetpack-fieldset-image-options__wrapper'>";

		$options_data = $this->get_attribute( 'optionsdata' );

		// Filter out empty options from the end
		$options_data = $this->trim_image_select_options( $options_data );

		$used_html_ids = array();

		// Create a separate array of original letters in sequence (A, B, C...)
		$perceived_letters = array();

		foreach ( $options_data as $option ) {
			$perceived_letters[] = Contact_Form_Plugin::strip_tags( $option['letter'] );
		}

		// Create a working copy of options for potential randomization
		$working_options = $options_data;

		// Randomize options if requested, but preserve original letter values
		if ( $randomize_options ) {
			shuffle( $working_options );

			// Trims options after randomization to ensure the last option has a label or image.
			$working_options = $this->trim_image_select_options( $working_options );
		}

		// Calculate row options count for CSS variable
		$total_options_count = count( $working_options );
		// Those values are halved on mobile via CSS media query
		$max_images_per_row = $is_supersized ? 2 : 4;
		$row_options_count  = min( $total_options_count, $max_images_per_row );

		foreach ( $working_options as $option_index => $option ) {
			$option_label  = Contact_Form_Plugin::strip_tags( $option['label'] );
			$option_letter = Contact_Form_Plugin::strip_tags( $option['letter'] );
			$image_block   = $option['image'];

			$rendered_image_block = render_block( $image_block );
			// Remove any links from the rendered block
			$rendered_image_block = preg_replace( '/<a[^>]*>(.*?)<\/a>/s', '$1', $rendered_image_block );

			// Extract image src from rendered block
			$image_src = '';

			if ( ! empty( $rendered_image_block ) ) {
				if ( preg_match( '/<img[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $rendered_image_block, $matches ) ) {
					$extracted_src = $matches[1];

					if ( filter_var( $extracted_src, FILTER_VALIDATE_URL ) || str_starts_with( $extracted_src, 'data:' ) ) {
						$image_src = $extracted_src;
					}
				}
			} else {
				$rendered_image_block = '<figure class="wp-block-image jetpack-input-image-option__empty-image"><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="" style="aspect-ratio:1;object-fit:cover"/></figure>';
			}

			$option_value                = wp_json_encode(
				array(
					'perceived'  => $perceived_letters[ $option_index ],
					'selected'   => $option_letter,
					'label'      => $option_label,
					'showLabels' => $show_labels,
					'image'      => array(
						'id'  => $image_block['attrs']['id'] ?? null,
						'src' => $image_src ?? null,
					),
				)
			);
			$option_id                   = $id . '-' . $option_letter;
			$used_html_ids[ $option_id ] = true;

			$figcaption_id = esc_attr( $option_id . '-figcaption' );

			// Add id attribute to figcaption for accessibility
			if ( ! empty( $rendered_image_block ) && strpos( $rendered_image_block, '<figcaption' ) !== false ) {
				$rendered_image_block = preg_replace( '/(<figcaption[^>]*)(>)/', '$1 id="' . $figcaption_id . '"$2', $rendered_image_block );
			}

			// To be able to apply the backdrop-filter for the hover effect, we need to separate the background into an outer div.
			// This outer div needs the color styles separately, and also the border radius to match the inner div without sticking out.
			$option_outer_classes = 'jetpack-input-image-option__outer ' . ( isset( $option['classcolor'] ) ? $option['classcolor'] : '' );

			if ( $is_supersized ) {
				$option_outer_classes .= ' is-supersized';
			}

			$border_styles = '';
			if ( ! empty( $option['style'] ) ) {
				preg_match( '/border-radius:([^;]+)/', $option['style'], $radius_match );
				preg_match( '/border-width:([^;]+)/', $option['style'], $width_match );

				if ( ! empty( $radius_match[1] ) ) {
					$radius_value = trim( $radius_match[1] );

					if ( ! empty( $width_match[1] ) ) {
							$width_value   = trim( $width_match[1] );
							$border_styles = "border-radius:calc({$radius_value} + {$width_value});";
					} else {
							$border_styles = "border-radius:{$radius_value};";
					}
				} else {
					// Handle individual border radius properties when border-radius is not present
					preg_match( '/border-top-left-radius:([^;]+)/', $option['style'], $top_left_match );
					preg_match( '/border-top-right-radius:([^;]+)/', $option['style'], $top_right_match );
					preg_match( '/border-bottom-right-radius:([^;]+)/', $option['style'], $bottom_right_match );
					preg_match( '/border-bottom-left-radius:([^;]+)/', $option['style'], $bottom_left_match );

					if ( ! empty( $top_left_match[1] ) || ! empty( $top_right_match[1] ) || ! empty( $bottom_right_match[1] ) || ! empty( $bottom_left_match[1] ) ) {
						$width_value = ! empty( $width_match[1] ) ? trim( $width_match[1] ) : '1px';

						$top_left     = ! empty( $top_left_match[1] ) ? trim( $top_left_match[1] ) : '4px';
						$top_right    = ! empty( $top_right_match[1] ) ? trim( $top_right_match[1] ) : '4px';
						$bottom_right = ! empty( $bottom_right_match[1] ) ? trim( $bottom_right_match[1] ) : '4px';
						$bottom_left  = ! empty( $bottom_left_match[1] ) ? trim( $bottom_left_match[1] ) : '4px';

						$border_styles = "border-radius:calc({$top_left} + {$width_value}) calc({$top_right} + {$width_value}) calc({$bottom_right} + {$width_value}) calc({$bottom_left} + {$width_value});";
					}
				}
			}

			$option_outer_styles  = ( empty( $option['stylecolor'] ) ? '' : $option['stylecolor'] ) . $border_styles;
			$option_outer_styles .= "--row-options-count: {$row_options_count};";
			$option_outer_styles  = empty( $option_outer_styles ) ? '' : "style='" . esc_attr( $option_outer_styles ) . "'";

			$field .= "<div class='{$option_outer_classes}' {$option_outer_styles}>";

			$default_classes = 'jetpack-field jetpack-input-image-option';
			$option_styles   = empty( $option['style'] ) ? '' : "style='" . esc_attr( $option['style'] ) . "'";
			$option_classes  = "class='" . ( empty( $option['class'] ) ? $default_classes : $default_classes . ' ' . $option['class'] ) . "'";

			$field .= "<div {$option_classes} {$option_styles} data-wp-on--click='actions.onImageOptionClick' data-wp-init='callbacks.setImageOptionOutlineColor'>";

			$input_id = esc_attr( $option_id );
			$label_id = esc_attr( $option_id . '-label' );

			/* translators: %s is the letter associated with the option, e.g. "Option A" */
			$aria_label_parts = array( sprintf( __( 'Option %s', 'jetpack-forms' ), $perceived_letters[ $option_index ] ) );

			if ( ! empty( $option_label ) ) {
				$aria_label_parts[] = $option_label;
			}

			$aria_label = implode( ': ', $aria_label_parts );

			// Build aria-describedby to reference label and figcaption
			$aria_describedby_parts = array( $label_id );

			if ( ! empty( $rendered_image_block ) && strpos( $rendered_image_block, '<figcaption' ) !== false ) {
				$aria_describedby_parts[] = $figcaption_id;
			}

			$aria_describedby = implode( ' ', $aria_describedby_parts );

			$field .= "<div class='jetpack-input-image-option__wrapper'>";
			$field .= "<input
			id='" . $input_id . "'
			class='jetpack-input-image-option__input'
			type='" . esc_attr( $input_type ) . "'
			name='" . esc_attr( $input_name ) . "'
			value='" . esc_attr( $option_value ) . "'
			aria-label='" . esc_attr( $aria_label ) . "'
			aria-describedby='" . esc_attr( $aria_describedby ) . "'
			data-wp-init='callbacks.setImageOptionCheckColor'
			data-wp-on--keydown='actions.onKeyDownImageOption'
			data-wp-on--change='" . ( $is_multiple ? 'actions.onMultipleFieldChange' : 'actions.onFieldChange' ) . "' "
			. $class
			. ( $is_multiple ? checked( in_array( $option_value, (array) $value, true ), true, false ) : checked( $option_value, $value, false ) ) . ' '
			. ( $required ? "required aria-required='true'" : '' )
			. '/> ';

			$field .= $rendered_image_block;
			$field .= '</div>';

			$field .= "<div class='jetpack-input-image-option__label-wrapper'>";
			$field .= "<div class='jetpack-input-image-option__label-code'>" . esc_html( $perceived_letters[ $option_index ] ) . '</div>';

			$label_classes  = 'jetpack-input-image-option__label';
			$label_classes .= $show_labels ? '' : ' visually-hidden';
			$field         .= "<span id='{$label_id}' class='{$label_classes}'>" . esc_html( $option_label ) . '</span>';
			$field         .= '</div></div></div>';
		}

		$field .= '</div></div>';

		$field .= $this->get_error_div( $id, 'image-select' );

		$field .= '</fieldset>';

		$field .= '</div>';

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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_number_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $extra_attrs = array(), $required_indicator = true ) {
		$this->set_invalid_message( 'number', __( 'Please enter a valid number', 'jetpack-forms' ) );
		if ( isset( $extra_attrs['min'] ) ) {
			// translators: %d is the minimum value.
			$this->set_invalid_message( 'min_number', __( 'Please select a value that is no less than %d.', 'jetpack-forms' ) );
		}
		if ( isset( $extra_attrs['max'] ) ) {
			// translators: %d is the maximum value.
			$this->set_invalid_message( 'max_number', __( 'Please select a value that is no more than %d.', 'jetpack-forms' ) );
		}
		$field  = $this->render_label( 'number', $id, $label, $required, $required_field_text, array(), false, $required_indicator );
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_default_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $type, $required_indicator = true ) {
		$field  = $this->render_label( $type, $id, $label, $required, $required_field_text, array(), false, $required_indicator );
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
			$css_vars .= $border_radius ? '--jetpack--contact-form--border-radius: max(' . ( $border_radius['topLeft'] ?? '0' ) . ',' . ( $border_radius['bottomLeft'] ?? '0' ) . ');' : '';
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_outline_label( $id, $label, $required, $required_field_text, $required_indicator = true ) {
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
					. ( $required && $required_indicator ? '<span class="grunion-label-required" aria-hidden="true">' . $required_field_text . '</span>' : '' ) .
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_animated_label( $id, $label, $required, $required_field_text, $required_indicator = true ) {
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
				. ( $required && $required_indicator !== 'hidden' ? '<span class="grunion-label-required" aria-hidden="true">' . $required_field_text . '</span>' : '' ) .
			'</label>';
	}

	/**
	 * Return the HTML for the below label.
	 *
	 * @param int    $id - the ID.
	 * @param string $label - the label.
	 * @param bool   $required - if the field is marked as required.
	 * @param string $required_field_text - the text in the required text field.
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_below_label( $id, $label, $required, $required_field_text, $required_indicator = true ) {
		return '
			<label
				for="' . esc_attr( $id ) . '"
				class="below-label__label ' . ( $this->is_error() ? ' form-error' : '' ) . '"
			>'
			. esc_html( $label )
			. ( $required && $required_indicator ? '<span>' . $required_field_text . '</span>' : '' ) .
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML
	 */
	public function render_field( $type, $id, $label, $value, $class, $placeholder, $required, $required_field_text, $extra_attrs = array(), $required_indicator = true ) {
		if ( ! $this->is_field_renderable( $type ) ) {
			return '';
		}

		if ( $type === 'hidden' ) {
			// For hidden fields, we don't need to render the label or any other HTML.
			return $this->render_hidden_field( $id, $label, $value );
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
				$field .= $this->render_email_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $required_indicator );
				break;
			case 'phone':
			case 'telephone':
				$field .= $this->render_telephone_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $required_indicator );
				break;
			case 'url':
				$field .= $this->render_url_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $required_indicator );
				break;
			case 'textarea':
				$field .= $this->render_textarea_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $required_indicator );
				break;
			case 'radio':
				$field .= $this->render_radio_field( $id, $label, $value, $field_class, $required, $required_field_text, $required_indicator );
				break;
			case 'checkbox':
				$field .= $this->render_checkbox_field( $id, $label, $value, $field_class, $required, $required_field_text, $required_indicator );
				break;
			case 'checkbox-multiple':
				$field .= $this->render_checkbox_multiple_field( $id, $label, $value, $field_class, $required, $required_field_text, $required_indicator );
				break;
			case 'select':
				$field .= $this->render_select_field( $id, $label, $value, $field_class, $required, $required_field_text, $required_indicator );
				break;
			case 'date':
				$field .= $this->render_date_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $required_indicator );
				break;
			case 'consent':
				$field .= $this->render_consent_field( $id, $field_class );
				break;
			case 'number':
				$field .= $this->render_number_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $extra_attrs, $required_indicator );
				break;
			case 'slider':
				$field .= $this->render_slider_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $extra_attrs, $required_indicator );
				break;
			case 'file':
				$field .= $this->render_file_field( $id, $label, $field_class, $required, $required_field_text, $required_indicator );
				break;
			case 'rating':
				$field .= $this->render_rating_field(
					$id,
					$label,
					$value,
					$field_class,
					$required,
					$required_field_text,
					$required_indicator
				);
				break;
			case 'time':
				$field .= $this->render_time_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $required_indicator );
				break;
			case 'image-select':
				$field .= $this->render_image_select_field( $id, $label, $value, $field_class, $required, $required_field_text, $required_indicator );
				break;
			default: // text field
				$field .= $this->render_default_field( $id, $label, $value, $field_class, $required, $required_field_text, $field_placeholder, $type, $required_indicator );
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
		// Check that radio, select, multiple choice, and image select
		// fields have at least one valid option.
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

		if ( $type === 'image-select' ) {
			$options_data         = (array) $this->get_attribute( 'optionsdata' );
			$trimmed_options_data = $this->trim_image_select_options( $options_data );

			return ! empty( $trimmed_options_data );
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 * @return string HTML markup.
	 */
	private function render_rating_field( $id, $label, $value, $class, $required, $required_field_text, $required_indicator = true ) {
		// Enqueue stylesheet for rating field.
		wp_enqueue_style( 'jetpack-form-field-rating-style', plugins_url( '../../dist/blocks/field-rating/style.css', __FILE__ ), array(), Constants::get_constant( 'JETPACK__VERSION' ) );

		// Read block attributes needed for rendering.
		$max_attr   = $this->get_attribute( 'max' );
		$max_rating = is_numeric( $max_attr ) && (int) $max_attr > 0 ? (int) $max_attr : 5;

		$initial_rating = (int) $value ? (int) $value : 0;

		$label_html = $this->render_legend_as_label( 'rating', $id, $label, $required, $required_field_text, array(), $required_indicator );

		/*
		 * Determine which icon SVG to use based on the 'iconstyle' attribute.
		 * Note: attribute name is lowercase due to WordPress shortcode processing
		 */
		$icon_style       = $this->get_attribute( 'iconstyle' );
		$has_hearts_style = ( 'hearts' === $icon_style );

		// SVG icon definitions - keep in sync with JavaScript icons.js
		$star_svg  = '<svg class="jetpack-field-rating__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path></svg>';
		$heart_svg = '<svg class="jetpack-field-rating__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path></svg>';

		$icon_svg = $has_hearts_style ? $heart_svg : $star_svg;

		$options = '';
		for ( $i = 1; $i <= $max_rating; $i++ ) {
			$radio_id = $id . '-' . $i;
			$options .= sprintf(
				'<div class="jetpack-field-rating__option">
					<input
						id="%1$s"
						type="radio"
						name="%2$s"
						value="%3$s/%4$s"
						data-wp-on--change="actions.onFieldChange"
						class="jetpack-field-rating__input visually-hidden"
						%5$s
						%6$s />
					<label for="%1$s" class="jetpack-field-rating__label">
						%7$s
					</label>
				</div>',
				esc_attr( $radio_id ),         // %1$s: id and label for
				esc_attr( $id ),               // %2$s: name
				esc_attr( $i ),                // %3$s: value (current rating)
				esc_attr( $max_rating ),       // %4$s: value (max rating)
				checked( $i, $initial_rating, false ), // %5$s: checked attribute
				$required ? 'required' : '',   // %6$s: required attribute
				$icon_svg                      // %7$s: icon SVG
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

		return sprintf(
			'<fieldset id="%4$s-label" class="jetpack-field-multiple__fieldset jetpack-field-rating" %1$s>
				%5$s
				<div class="jetpack-field-rating__options %3$s">%2$s</div>
			</fieldset>',
			$style_attr,
			$options,
			$this->field_classes,
			esc_attr( $id ),
			$label_html
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
	 * @param bool   $required_indicator Whether to display the required indicator.
	 *
	 * @return string HTML for the slider field.
	 */
	public function render_slider_field( $id, $label, $value, $class, $required, $required_field_text, $placeholder, $extra_attrs = array(), $required_indicator = true ) {
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
		$step           = isset( $extra_attrs['step'] ) ? $extra_attrs['step'] : 1;
		$current_value  = ( $value !== '' && $value !== null ) ? $value : $starting_value;
		$min_text_label = isset( $extra_attrs['minLabel'] ) ? $extra_attrs['minLabel'] : '';
		$max_text_label = isset( $extra_attrs['maxLabel'] ) ? $extra_attrs['maxLabel'] : '';

		$field = $this->render_label( 'slider', $id, $label, $required, $required_field_text, array(), false, $required_indicator );

		ob_start();
		?>
		<div class="jetpack-field-slider__input-row <?php echo esc_attr( $this->field_classes ); ?>"
			data-wp-context='
			<?php
			echo wp_json_encode(
				array(
					'min'     => $min,
					'max'     => $max,
					'default' => $starting_value,
					'step'    => $step,
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
					step="<?php echo esc_attr( $step ); ?>"
					class="<?php echo esc_attr( trim( $class . ' jetpack-field-slider__range' ) ); ?>"
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
		<?php if ( '' !== $min_text_label || '' !== $max_text_label ) : ?>
			<div class="jetpack-field-slider__text-labels <?php echo esc_attr( $this->field_classes ); ?>" aria-hidden="true">
				<span class="jetpack-field-slider__min-text-label"><?php echo esc_html( $min_text_label ); ?></span>
				<span class="jetpack-field-slider__max-text-label"><?php echo esc_html( $max_text_label ); ?></span>
			</div>
		<?php endif; ?>
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
			plugins_url( '../../dist/blocks/input-range/style.css', __FILE__ ),
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

	/**
	 * Gets an array of translatable country names indexed by their two-letter country codes.
	 *
	 * @since 6.2.1
	 *
	 * @return array Array of country names with two-letter country codes as keys.
	 */
	public function get_translatable_countries() {
		return array(
			'AF' => __( 'Afghanistan', 'jetpack-forms' ),
			'AL' => __( 'Albania', 'jetpack-forms' ),
			'DZ' => __( 'Algeria', 'jetpack-forms' ),
			'AS' => __( 'American Samoa', 'jetpack-forms' ),
			'AD' => __( 'Andorra', 'jetpack-forms' ),
			'AO' => __( 'Angola', 'jetpack-forms' ),
			'AI' => __( 'Anguilla', 'jetpack-forms' ),
			'AG' => __( 'Antigua and Barbuda', 'jetpack-forms' ),
			'AR' => __( 'Argentina', 'jetpack-forms' ),
			'AM' => __( 'Armenia', 'jetpack-forms' ),
			'AW' => __( 'Aruba', 'jetpack-forms' ),
			'AU' => __( 'Australia', 'jetpack-forms' ),
			'AT' => __( 'Austria', 'jetpack-forms' ),
			'AZ' => __( 'Azerbaijan', 'jetpack-forms' ),
			'BS' => __( 'Bahamas', 'jetpack-forms' ),
			'BH' => __( 'Bahrain', 'jetpack-forms' ),
			'BD' => __( 'Bangladesh', 'jetpack-forms' ),
			'BB' => __( 'Barbados', 'jetpack-forms' ),
			'BY' => __( 'Belarus', 'jetpack-forms' ),
			'BE' => __( 'Belgium', 'jetpack-forms' ),
			'BZ' => __( 'Belize', 'jetpack-forms' ),
			'BJ' => __( 'Benin', 'jetpack-forms' ),
			'BM' => __( 'Bermuda', 'jetpack-forms' ),
			'BT' => __( 'Bhutan', 'jetpack-forms' ),
			'BO' => __( 'Bolivia', 'jetpack-forms' ),
			'BA' => __( 'Bosnia and Herzegovina', 'jetpack-forms' ),
			'BW' => __( 'Botswana', 'jetpack-forms' ),
			'BR' => __( 'Brazil', 'jetpack-forms' ),
			'IO' => __( 'British Indian Ocean Territory', 'jetpack-forms' ),
			'VG' => __( 'British Virgin Islands', 'jetpack-forms' ),
			'BN' => __( 'Brunei', 'jetpack-forms' ),
			'BG' => __( 'Bulgaria', 'jetpack-forms' ),
			'BF' => __( 'Burkina Faso', 'jetpack-forms' ),
			'BI' => __( 'Burundi', 'jetpack-forms' ),
			'KH' => __( 'Cambodia', 'jetpack-forms' ),
			'CM' => __( 'Cameroon', 'jetpack-forms' ),
			'CA' => __( 'Canada', 'jetpack-forms' ),
			'CV' => __( 'Cape Verde', 'jetpack-forms' ),
			'KY' => __( 'Cayman Islands', 'jetpack-forms' ),
			'CF' => __( 'Central African Republic', 'jetpack-forms' ),
			'TD' => __( 'Chad', 'jetpack-forms' ),
			'CL' => __( 'Chile', 'jetpack-forms' ),
			'CN' => __( 'China', 'jetpack-forms' ),
			'CX' => __( 'Christmas Island', 'jetpack-forms' ),
			'CC' => __( 'Cocos (Keeling) Islands', 'jetpack-forms' ),
			'CO' => __( 'Colombia', 'jetpack-forms' ),
			'KM' => __( 'Comoros', 'jetpack-forms' ),
			'CG' => __( 'Congo - Brazzaville', 'jetpack-forms' ),
			'CD' => __( 'Congo - Kinshasa', 'jetpack-forms' ),
			'CK' => __( 'Cook Islands', 'jetpack-forms' ),
			'CR' => __( 'Costa Rica', 'jetpack-forms' ),
			'HR' => __( 'Croatia', 'jetpack-forms' ),
			'CU' => __( 'Cuba', 'jetpack-forms' ),
			'CY' => __( 'Cyprus', 'jetpack-forms' ),
			'CZ' => __( 'Czech Republic', 'jetpack-forms' ),
			'CI' => __( "Côte d'Ivoire", 'jetpack-forms' ),
			'DK' => __( 'Denmark', 'jetpack-forms' ),
			'DJ' => __( 'Djibouti', 'jetpack-forms' ),
			'DM' => __( 'Dominica', 'jetpack-forms' ),
			'DO' => __( 'Dominican Republic', 'jetpack-forms' ),
			'EC' => __( 'Ecuador', 'jetpack-forms' ),
			'EG' => __( 'Egypt', 'jetpack-forms' ),
			'SV' => __( 'El Salvador', 'jetpack-forms' ),
			'GQ' => __( 'Equatorial Guinea', 'jetpack-forms' ),
			'ER' => __( 'Eritrea', 'jetpack-forms' ),
			'EE' => __( 'Estonia', 'jetpack-forms' ),
			'SZ' => __( 'Eswatini', 'jetpack-forms' ),
			'ET' => __( 'Ethiopia', 'jetpack-forms' ),
			'FK' => __( 'Falkland Islands', 'jetpack-forms' ),
			'FO' => __( 'Faroe Islands', 'jetpack-forms' ),
			'FJ' => __( 'Fiji', 'jetpack-forms' ),
			'FI' => __( 'Finland', 'jetpack-forms' ),
			'FR' => __( 'France', 'jetpack-forms' ),
			'GF' => __( 'French Guiana', 'jetpack-forms' ),
			'PF' => __( 'French Polynesia', 'jetpack-forms' ),
			'GA' => __( 'Gabon', 'jetpack-forms' ),
			'GM' => __( 'Gambia', 'jetpack-forms' ),
			'GE' => __( 'Georgia', 'jetpack-forms' ),
			'DE' => __( 'Germany', 'jetpack-forms' ),
			'GH' => __( 'Ghana', 'jetpack-forms' ),
			'GI' => __( 'Gibraltar', 'jetpack-forms' ),
			'GR' => __( 'Greece', 'jetpack-forms' ),
			'GL' => __( 'Greenland', 'jetpack-forms' ),
			'GD' => __( 'Grenada', 'jetpack-forms' ),
			'GP' => __( 'Guadeloupe', 'jetpack-forms' ),
			'GU' => __( 'Guam', 'jetpack-forms' ),
			'GT' => __( 'Guatemala', 'jetpack-forms' ),
			'GG' => __( 'Guernsey', 'jetpack-forms' ),
			'GN' => __( 'Guinea', 'jetpack-forms' ),
			'GW' => __( 'Guinea-Bissau', 'jetpack-forms' ),
			'GY' => __( 'Guyana', 'jetpack-forms' ),
			'HT' => __( 'Haiti', 'jetpack-forms' ),
			'HN' => __( 'Honduras', 'jetpack-forms' ),
			'HK' => __( 'Hong Kong', 'jetpack-forms' ),
			'HU' => __( 'Hungary', 'jetpack-forms' ),
			'IS' => __( 'Iceland', 'jetpack-forms' ),
			'IN' => __( 'India', 'jetpack-forms' ),
			'ID' => __( 'Indonesia', 'jetpack-forms' ),
			'IR' => __( 'Iran', 'jetpack-forms' ),
			'IQ' => __( 'Iraq', 'jetpack-forms' ),
			'IE' => __( 'Ireland', 'jetpack-forms' ),
			'IM' => __( 'Isle of Man', 'jetpack-forms' ),
			'IL' => __( 'Israel', 'jetpack-forms' ),
			'IT' => __( 'Italy', 'jetpack-forms' ),
			'JM' => __( 'Jamaica', 'jetpack-forms' ),
			'JP' => __( 'Japan', 'jetpack-forms' ),
			'JE' => __( 'Jersey', 'jetpack-forms' ),
			'JO' => __( 'Jordan', 'jetpack-forms' ),
			'KZ' => __( 'Kazakhstan', 'jetpack-forms' ),
			'KE' => __( 'Kenya', 'jetpack-forms' ),
			'KI' => __( 'Kiribati', 'jetpack-forms' ),
			'XK' => __( 'Kosovo', 'jetpack-forms' ),
			'KW' => __( 'Kuwait', 'jetpack-forms' ),
			'KG' => __( 'Kyrgyzstan', 'jetpack-forms' ),
			'LA' => __( 'Laos', 'jetpack-forms' ),
			'LV' => __( 'Latvia', 'jetpack-forms' ),
			'LB' => __( 'Lebanon', 'jetpack-forms' ),
			'LS' => __( 'Lesotho', 'jetpack-forms' ),
			'LR' => __( 'Liberia', 'jetpack-forms' ),
			'LY' => __( 'Libya', 'jetpack-forms' ),
			'LI' => __( 'Liechtenstein', 'jetpack-forms' ),
			'LT' => __( 'Lithuania', 'jetpack-forms' ),
			'LU' => __( 'Luxembourg', 'jetpack-forms' ),
			'MO' => __( 'Macao', 'jetpack-forms' ),
			'MG' => __( 'Madagascar', 'jetpack-forms' ),
			'MW' => __( 'Malawi', 'jetpack-forms' ),
			'MY' => __( 'Malaysia', 'jetpack-forms' ),
			'MV' => __( 'Maldives', 'jetpack-forms' ),
			'ML' => __( 'Mali', 'jetpack-forms' ),
			'MT' => __( 'Malta', 'jetpack-forms' ),
			'MH' => __( 'Marshall Islands', 'jetpack-forms' ),
			'MQ' => __( 'Martinique', 'jetpack-forms' ),
			'MR' => __( 'Mauritania', 'jetpack-forms' ),
			'MU' => __( 'Mauritius', 'jetpack-forms' ),
			'YT' => __( 'Mayotte', 'jetpack-forms' ),
			'MX' => __( 'Mexico', 'jetpack-forms' ),
			'FM' => __( 'Micronesia', 'jetpack-forms' ),
			'MD' => __( 'Moldova', 'jetpack-forms' ),
			'MC' => __( 'Monaco', 'jetpack-forms' ),
			'MN' => __( 'Mongolia', 'jetpack-forms' ),
			'ME' => __( 'Montenegro', 'jetpack-forms' ),
			'MS' => __( 'Montserrat', 'jetpack-forms' ),
			'MA' => __( 'Morocco', 'jetpack-forms' ),
			'MZ' => __( 'Mozambique', 'jetpack-forms' ),
			'MM' => __( 'Myanmar', 'jetpack-forms' ),
			'NA' => __( 'Namibia', 'jetpack-forms' ),
			'NR' => __( 'Nauru', 'jetpack-forms' ),
			'NP' => __( 'Nepal', 'jetpack-forms' ),
			'NL' => __( 'Netherlands', 'jetpack-forms' ),
			'NC' => __( 'New Caledonia', 'jetpack-forms' ),
			'NZ' => __( 'New Zealand', 'jetpack-forms' ),
			'NI' => __( 'Nicaragua', 'jetpack-forms' ),
			'NE' => __( 'Niger', 'jetpack-forms' ),
			'NG' => __( 'Nigeria', 'jetpack-forms' ),
			'NU' => __( 'Niue', 'jetpack-forms' ),
			'NF' => __( 'Norfolk Island', 'jetpack-forms' ),
			'KP' => __( 'North Korea', 'jetpack-forms' ),
			'MK' => __( 'North Macedonia', 'jetpack-forms' ),
			'MP' => __( 'Northern Mariana Islands', 'jetpack-forms' ),
			'NO' => __( 'Norway', 'jetpack-forms' ),
			'OM' => __( 'Oman', 'jetpack-forms' ),
			'PK' => __( 'Pakistan', 'jetpack-forms' ),
			'PW' => __( 'Palau', 'jetpack-forms' ),
			'PS' => __( 'Palestine', 'jetpack-forms' ),
			'PA' => __( 'Panama', 'jetpack-forms' ),
			'PG' => __( 'Papua New Guinea', 'jetpack-forms' ),
			'PY' => __( 'Paraguay', 'jetpack-forms' ),
			'PE' => __( 'Peru', 'jetpack-forms' ),
			'PH' => __( 'Philippines', 'jetpack-forms' ),
			'PN' => __( 'Pitcairn Islands', 'jetpack-forms' ),
			'PL' => __( 'Poland', 'jetpack-forms' ),
			'PT' => __( 'Portugal', 'jetpack-forms' ),
			'PR' => __( 'Puerto Rico', 'jetpack-forms' ),
			'QA' => __( 'Qatar', 'jetpack-forms' ),
			'RO' => __( 'Romania', 'jetpack-forms' ),
			'RU' => __( 'Russia', 'jetpack-forms' ),
			'RW' => __( 'Rwanda', 'jetpack-forms' ),
			'RE' => __( 'Réunion', 'jetpack-forms' ),
			'BL' => __( 'Saint Barthélemy', 'jetpack-forms' ),
			'SH' => __( 'Saint Helena', 'jetpack-forms' ),
			'KN' => __( 'Saint Kitts and Nevis', 'jetpack-forms' ),
			'LC' => __( 'Saint Lucia', 'jetpack-forms' ),
			'MF' => __( 'Saint Martin', 'jetpack-forms' ),
			'PM' => __( 'Saint Pierre and Miquelon', 'jetpack-forms' ),
			'VC' => __( 'Saint Vincent and the Grenadines', 'jetpack-forms' ),
			'WS' => __( 'Samoa', 'jetpack-forms' ),
			'SM' => __( 'San Marino', 'jetpack-forms' ),
			'SA' => __( 'Saudi Arabia', 'jetpack-forms' ),
			'SN' => __( 'Senegal', 'jetpack-forms' ),
			'RS' => __( 'Serbia', 'jetpack-forms' ),
			'SC' => __( 'Seychelles', 'jetpack-forms' ),
			'SL' => __( 'Sierra Leone', 'jetpack-forms' ),
			'SG' => __( 'Singapore', 'jetpack-forms' ),
			'SK' => __( 'Slovakia', 'jetpack-forms' ),
			'SI' => __( 'Slovenia', 'jetpack-forms' ),
			'SB' => __( 'Solomon Islands', 'jetpack-forms' ),
			'SO' => __( 'Somalia', 'jetpack-forms' ),
			'ZA' => __( 'South Africa', 'jetpack-forms' ),
			'GS' => __( 'South Georgia and the South Sandwich Islands', 'jetpack-forms' ),
			'KR' => __( 'South Korea', 'jetpack-forms' ),
			'ES' => __( 'Spain', 'jetpack-forms' ),
			'LK' => __( 'Sri Lanka', 'jetpack-forms' ),
			'SD' => __( 'Sudan', 'jetpack-forms' ),
			'SR' => __( 'Suriname', 'jetpack-forms' ),
			'SJ' => __( 'Svalbard and Jan Mayen', 'jetpack-forms' ),
			'SE' => __( 'Sweden', 'jetpack-forms' ),
			'CH' => __( 'Switzerland', 'jetpack-forms' ),
			'SY' => __( 'Syria', 'jetpack-forms' ),
			'ST' => __( 'São Tomé and Príncipe', 'jetpack-forms' ),
			'TW' => __( 'Taiwan', 'jetpack-forms' ),
			'TJ' => __( 'Tajikistan', 'jetpack-forms' ),
			'TZ' => __( 'Tanzania', 'jetpack-forms' ),
			'TH' => __( 'Thailand', 'jetpack-forms' ),
			'TL' => __( 'Timor-Leste', 'jetpack-forms' ),
			'TG' => __( 'Togo', 'jetpack-forms' ),
			'TK' => __( 'Tokelau', 'jetpack-forms' ),
			'TO' => __( 'Tonga', 'jetpack-forms' ),
			'TT' => __( 'Trinidad and Tobago', 'jetpack-forms' ),
			'TN' => __( 'Tunisia', 'jetpack-forms' ),
			'TR' => __( 'Turkey', 'jetpack-forms' ),
			'TM' => __( 'Turkmenistan', 'jetpack-forms' ),
			'TC' => __( 'Turks and Caicos Islands', 'jetpack-forms' ),
			'TV' => __( 'Tuvalu', 'jetpack-forms' ),
			'VI' => __( 'U.S. Virgin Islands', 'jetpack-forms' ),
			'UG' => __( 'Uganda', 'jetpack-forms' ),
			'UA' => __( 'Ukraine', 'jetpack-forms' ),
			'AE' => __( 'United Arab Emirates', 'jetpack-forms' ),
			'GB' => __( 'United Kingdom', 'jetpack-forms' ),
			'US' => __( 'United States', 'jetpack-forms' ),
			'UY' => __( 'Uruguay', 'jetpack-forms' ),
			'UZ' => __( 'Uzbekistan', 'jetpack-forms' ),
			'VU' => __( 'Vanuatu', 'jetpack-forms' ),
			'VA' => __( 'Vatican City', 'jetpack-forms' ),
			'VE' => __( 'Venezuela', 'jetpack-forms' ),
			'VN' => __( 'Vietnam', 'jetpack-forms' ),
			'WF' => __( 'Wallis and Futuna', 'jetpack-forms' ),
			'YE' => __( 'Yemen', 'jetpack-forms' ),
			'ZM' => __( 'Zambia', 'jetpack-forms' ),
			'ZW' => __( 'Zimbabwe', 'jetpack-forms' ),
		);
	}

	/**
	 * Enqueues scripts and styles needed for the slider field.
	 *
	 * @since 6.2.1
	 *
	 * @return void
	 */
	private function enqueue_phone_field_assets() {
		$version = defined( 'JETPACK__VERSION' ) ? \JETPACK__VERSION : '0.1';

		// extra cache busting strategy for view.js, seems they are left out of cache clearing on deploys
		$asset_file = plugin_dir_path( __FILE__ ) . '../../dist/modules/field-phone/view.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : null;
		$version   .= $asset['version'] ?? '';

		// combobox styles
		\wp_enqueue_style(
			'jetpack-form-combobox',
			plugins_url( '../../dist/contact-form/css/combobox.css', __FILE__ ),
			array(),
			$version
		);

		\wp_enqueue_style(
			'jetpack-form-phone-field',
			plugins_url( '../../dist/contact-form/css/phone-field.css', __FILE__ ),
			array(),
			$version
		);

		\wp_enqueue_script_module(
			'jetpack-form-phone-field',
			plugins_url( '../../dist/modules/field-phone/view.js', __FILE__ ),
			array( '@wordpress/interactivity' ),
			$version
		);
	}

	/**
	 * Trims the image select options from the end of the array if they are empty.
	 *
	 * @param array $options The options to trim.
	 *
	 * @return array The trimmed options array.
	 */
	private function trim_image_select_options( $options ) {
		if ( empty( $options ) ) {
			return $options;
		}

		// Work backwards through the array to find the last valid option
		$last_valid_index = -1;

		for ( $i = count( $options ) - 1; $i >= 0; $i-- ) {
			$option = $options[ $i ];

			// Check if option has a label
			$has_label = ! empty( $option['label'] );

			// Check if option has an image with src
			$has_image = false;

			if ( isset( $option['image']['innerHTML'] ) ) {
				// Extract src from innerHTML using regex
				preg_match( '/src="([^"]*)"/', $option['image']['innerHTML'], $matches );
				$has_image = ! empty( $matches[1] );
			}

			// If this option has either a label or an image, it's valid
			if ( $has_label || $has_image ) {
				$last_valid_index = $i;
				break;
			}
		}

		return array_slice( $options, 0, $last_valid_index + 1 );
	}
}
