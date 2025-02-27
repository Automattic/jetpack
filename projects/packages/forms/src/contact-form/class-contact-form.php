<?php
/**
 * Contact_Form class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Sync\Settings;
use PHPMailer\PHPMailer\PHPMailer;
use WP_Error;

/**
 * Class for the contact-form shortcode.
 * Parses shortcode to output the contact form as HTML
 * Sends email and stores the contact form response (a.k.a. "feedback")
 */
class Contact_Form extends Contact_Form_Shortcode {

	/**
	 * The shortcode name.
	 *
	 * @var string
	 */
	public $shortcode_name = 'contact-form';

	/**
	 *
	 * Stores form submission errors.
	 *
	 * @var WP_Error
	 */
	public $errors;

	/**
	 * The SHA1 hash of the attributes that comprise the form.
	 *
	 * @var string
	 */
	public $hash;

	/**
	 * The default attributes for the form.
	 *
	 * @var array
	 */
	public $defaults = array();

	/**
	 * The most recent (inclusive) contact-form shortcode processed.
	 *
	 * @var Contact_Form|null
	 */
	public static $last;

	/**
	 * Form we are currently looking at. If processed, will become $last
	 *
	 * @var Contact_Form|null
	 */
	public static $current_form;

	/**
	 * All found forms, indexed by hash.
	 *
	 * @var array
	 */
	public static $forms = array();

	/**
	 * Whether to print the grunion.css style when processing the contact-form shortcode
	 *
	 * @var bool
	 */
	public static $style = false;

	/**
	 * When printing the submit button, what tags are allowed
	 *
	 * @var array
	 */
	public static $allowed_html_tags_for_submit_button = array( 'br' => array() );

	/**
	 * Construction function.
	 *
	 * @param array  $attributes - the attributes.
	 * @param string $content - the content.
	 */
	public function __construct( $attributes, $content = null ) {
		global $post, $page;

		// Set up the default subject and recipient for this form.
		$default_to      = '';
		$default_subject = '[' . get_option( 'blogname' ) . ']';

		if ( ! isset( $attributes ) || ! is_array( $attributes ) ) {
			$attributes = array();
		}

		if ( $post ) {
			$default_subject = sprintf(
				// translators: the blog name and post title.
				_x( '%1$s %2$s', '%1$s = blog name, %2$s = post title', 'jetpack-forms' ),
				$default_subject,
				Contact_Form_Plugin::strip_tags( $post->post_title )
			);
		}

		// If the contact form is rendered using a block, the id and hash are already
		// set by the block, avoid generating the id and hash again.
		if (
			! isset( $attributes['id'] ) &&
			! isset( $attributes['hash'] )
		) {
			if ( ! empty( $attributes['widget'] ) && $attributes['widget'] ) {
				$default_to      .= get_option( 'admin_email' );
				$attributes['id'] = 'widget-' . $attributes['widget'];
				// translators: the blog name (and post name, if applicable).
				$default_subject = sprintf( _x( '%1$s Sidebar', '%1$s = blog name', 'jetpack-forms' ), $default_subject );
			} elseif ( ! empty( $attributes['block_template'] ) && $attributes['block_template'] ) {
				$default_to      .= get_option( 'admin_email' );
				$attributes['id'] = 'block-template-' . $attributes['block_template'];
			} elseif ( ! empty( $attributes['block_template_part'] ) && $attributes['block_template_part'] ) {
				$default_to      .= get_option( 'admin_email' );
				$attributes['id'] = 'block-template-part-' . $attributes['block_template_part'];
			} elseif ( $post ) {
				$attributes['id'] = $post->ID;
				$post_author      = get_userdata( $post->post_author );
				$default_to      .= $post_author->user_email;
			}

			$form_count = isset( self::$forms ) ? count( self::$forms ) : 0;
			if ( $form_count > 0 ) {
				// Ensure 'id' exists in $attributes before trying to modify it
				if ( ! isset( $attributes['id'] ) ) {
					$attributes['id'] = '';
				}
				$attributes['id'] = $attributes['id'] . '-' . ( $form_count + 1 ) . '-' . $page;
			}

			$this->hash = sha1( wp_json_encode( $attributes ) );
		} else {
			$this->hash = $attributes['hash'];
		}

		if ( ! isset( self::$forms[ $this->hash ] ) ) {
			self::$forms[ $this->hash ] = $this;
		}

		// Keep reference to $this for parsing form fields.
		self::$current_form = $this;

		$this->defaults = array(
			'to'                     => $default_to,
			'subject'                => $default_subject,
			'show_subject'           => 'no', // only used in back-compat mode
			'widget'                 => 0,    // Not exposed to the user. Works with Contact_Form_Plugin::widget_atts()
			'block_template'         => null, // Not exposed to the user. Works with template_loader
			'block_template_part'    => null, // Not exposed to the user. Works with Contact_Form::parse()
			'id'                     => null, // Not exposed to the user. Set above.
			'submit_button_text'     => __( 'Submit', 'jetpack-forms' ),
			// These attributes come from the block editor, so use camel case instead of snake case.
			'customThankyou'         => '', // Whether to show a custom thankyou response after submitting a form. '' for no, 'message' for a custom message, 'redirect' to redirect to a new URL.
			'customThankyouHeading'  => __( 'Your message has been sent', 'jetpack-forms' ), // The text to show above customThankyouMessage.
			'customThankyouMessage'  => __( 'Thank you for your submission!', 'jetpack-forms' ), // The message to show when customThankyou is set to 'message'.
			'customThankyouRedirect' => '', // The URL to redirect to when customThankyou is set to 'redirect'.
			'jetpackCRM'             => true, // Whether Jetpack CRM should store the form submission.
			'className'              => null,
			'postToUrl'              => null,
			'salesforceData'         => null,
			'hiddenFields'           => null,
		);

		$attributes = shortcode_atts( $this->defaults, $attributes, 'contact-form' );

		// We only enable the contact-field shortcode temporarily while processing the contact-form shortcode.
		Contact_Form_Plugin::$using_contact_form_field = true;

		parent::__construct( $attributes, $content );

		// There were no fields in the contact form. The form was probably just [contact-form /]. Build a default form.
		if ( empty( $this->fields ) ) {
			// same as the original Grunion v1 form.
			$default_form = '
				[contact-field label="' . __( 'Name', 'jetpack-forms' ) . '" type="name"  required="true" /]
				[contact-field label="' . __( 'Email', 'jetpack-forms' ) . '" type="email" required="true" /]
				[contact-field label="' . __( 'Website', 'jetpack-forms' ) . '" type="url" /]';

			if ( 'yes' === strtolower( $this->get_attribute( 'show_subject' ) ) ) {
				$default_form .= '
					[contact-field label="' . __( 'Subject', 'jetpack-forms' ) . '" type="subject" /]';
			}

			$default_form .= '
				[contact-field label="' . __( 'Message', 'jetpack-forms' ) . '" type="textarea" /]';

			$this->parse_content( $default_form );

			// Store the shortcode.
			$this->store_shortcode( $default_form, $attributes, $this->hash );
		} else {
			// Store the shortcode.
			$this->store_shortcode( $content, $attributes, $this->hash );
		}

		// $this->body and $this->fields have been setup.  We no longer need the contact-field shortcode.
		Contact_Form_Plugin::$using_contact_form_field = false;
	}

	/**
	 * Store shortcode content for recall later
	 *  - used to receate shortcode when user uses do_shortcode
	 *
	 * @param string $content - the content.
	 * @param array  $attributes - the attributes.
	 * @param string $hash - the hash.
	 */
	public static function store_shortcode( $content = null, $attributes = null, $hash = null ) {

		if ( $content && isset( $attributes['id'] ) ) {

			if ( empty( $hash ) ) {
				$hash = sha1( wp_json_encode( $attributes ) . $content );
			}

			$shortcode_meta = (string) get_post_meta( $attributes['id'], "_g_feedback_shortcode_{$hash}", true );

			if ( $shortcode_meta !== '' || $shortcode_meta !== $content ) {
				update_post_meta( $attributes['id'], "_g_feedback_shortcode_{$hash}", $content );

				// Save attributes to post_meta for later use. They're not available later in do_shortcode situations.
				update_post_meta( $attributes['id'], "_g_feedback_shortcode_atts_{$hash}", $attributes );
			}
		}
	}

	/**
	 * Toggle for printing the grunion.css stylesheet
	 *
	 * @param bool $style - the CSS style.
	 *
	 * @return bool
	 */
	public static function style( $style ) {
		$previous_style = self::$style;
		self::$style    = (bool) $style;
		return $previous_style;
	}

	/**
	 * Turn on printing of grunion.css stylesheet
	 *
	 * @see ::style()
	 *
	 * @return bool
	 */
	public static function style_on() {
		return self::style( true );
	}

	/**
	 * The contact-form shortcode processor
	 *
	 * @param array       $attributes Key => Value pairs as parsed by shortcode_parse_atts().
	 * @param string|null $content The shortcode's inner content: [contact-form]$content[/contact-form].
	 *
	 * @return string HTML for the concat form.
	 */
	public static function parse( $attributes, $content ) {
		global $post, $page, $multipage; // $page is used in the contact-form submission redirect
		if ( Settings::is_syncing() ) {
			return '';
		}
		if ( isset( $GLOBALS['grunion_block_template_part_id'] ) ) {
			self::style_on();
			if ( is_array( $attributes ) ) {
				$attributes['block_template_part'] = $GLOBALS['grunion_block_template_part_id'];
			}
		}
		// Create a new Contact_Form object (this class)
		$form = new Contact_Form( $attributes, $content );

		$id = $form->get_attribute( 'id' );

		if ( ! $id ) { // something terrible has happened
			return '[contact-form]';
		}

		if ( is_feed() ) {
			return '[contact-form]';
		}

		self::$last = $form;

		// Enqueue the grunion.css stylesheet if self::$style allows it
		if ( self::$style && ( empty( $_REQUEST['action'] ) || $_REQUEST['action'] !== 'grunion_shortcode_to_json' ) ) {
			// Enqueue the style here instead of printing it, because if some other plugin has run the_post()+rewind_posts(),
			// (like VideoPress does), the style tag gets "printed" the first time and discarded, leaving the contact form unstyled.
			// when WordPress does the real loop.
			wp_enqueue_style( 'grunion.css' );
			wp_enqueue_script( 'accessible-form' );
		}

		$container_classes        = array( 'wp-block-jetpack-contact-form-container' );
		$container_classes[]      = self::get_block_alignment_class( $attributes );
		$container_classes_string = implode( ' ', $container_classes );

		$r  = '';
		$r .= "<div data-test='contact-form' id='contact-form-$id' class='{$container_classes_string}'>\n";

		$form_errors = Contact_Form_Plugin::$submission->get_errors( $form->hash ) ?? null;
		if ( is_wp_error( $form_errors ) && $form_errors->get_error_codes() ) {
			// There are errors.  Display them
			$r .= "<div class='form-error'>\n<h3>" . __( 'Error!', 'jetpack-forms' ) . "</h3>\n<ul class='form-errors'>\n";
			foreach ( $form_errors->get_error_messages() as $message ) {
				$r .= "\t<li class='form-error-message'>" . esc_html( $message ) . "</li>\n";
			}
			$r .= "</ul>\n</div>\n\n";
		}

		if ( isset( $_GET['contact-form-id'] )
			&& (int) $_GET['contact-form-id'] === (int) self::$last->get_attribute( 'id' )
			&& isset( $_GET['contact-form-sent'] ) && isset( $_GET['contact-form-hash'] )
			&& is_string( $_GET['contact-form-hash'] )
			&& hash_equals( $form->hash, wp_unslash( $_GET['contact-form-hash'] ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			// The contact form was submitted.  Show the success message/results.
			$feedback_id = (int) $_GET['contact-form-sent'];

			$back_url = remove_query_arg( array( 'contact-form-id', 'contact-form-sent', '_wpnonce' ) );
			$r       .= '<div class="contact-form-submission">';

			$r_success_message = '<p class="go-back-message"> <a class="link" href="' . esc_url( $back_url ) . '">' . esc_html__( 'Go back', 'jetpack-forms' ) . '</a> </p>';

			$r_success_message .=
				'<h4 id="contact-form-success-header">' . esc_html( $form->get_attribute( 'customThankyouHeading' ) ) .
				"</h4>\n\n";

			// Don't show the feedback details unless the nonce matches
			if (
				$feedback_id
				&& isset( $_GET['_wpnonce'] )
				&& wp_verify_nonce( sanitize_key( wp_unslash( $_GET['_wpnonce'] ) ), "contact-form-sent-{$feedback_id}" )
			) {
				$r_success_message .= self::success_message( $feedback_id, $form );
			}

			/**
			 * Filter the message returned after a successful contact form submission.
			 *
			 * @module contact-form
			 *
			 * @since 1.3.1
			 *
			 * @param string $r_success_message Success message.
			 */
			$r .= apply_filters( 'grunion_contact_form_success_message', $r_success_message );
			$r .= '</div>';
		} else {
			// Nothing special - show the normal contact form
			if ( $form->get_attribute( 'widget' )
				|| $form->get_attribute( 'block_template' )
				|| $form->get_attribute( 'block_template_part' ) ) {
				// Submit form to the current URL
				$url = remove_query_arg( array( 'contact-form-id', 'contact-form-sent', 'action', '_wpnonce' ) );
			} else {
				// Submit form to the post permalink
				$url = get_permalink();
				if ( $multipage && $page ) {
					$url = add_query_arg( 'page', $page, $url );
				}
			}

			// For SSL/TLS page. See RFC 3986 Section 4.2
			$url = set_url_scheme( $url );

			// May eventually want to send this to admin-post.php...
			/**
			 * Filter the contact form action URL.
			 *
			 * @module contact-form
			 *
			 * @since 1.3.1
			 *
			 * @param string $contact_form_id Contact form post URL.
			 * @param $post $GLOBALS['post'] Post global variable.
			 * @param int $id Contact Form ID.
			 */
			$url                     = apply_filters( 'grunion_contact_form_form_action', "{$url}#contact-form-{$id}", $GLOBALS['post'], $id, $page );
			$has_submit_button_block = str_contains( $content, 'wp-block-jetpack-button' );
			$form_classes            = 'contact-form commentsblock';
			$post_title              = $post->post_title ?? '';
			$form_accessible_name    = ! empty( $attributes['formTitle'] ) ? $attributes['formTitle'] : $post_title;
			$form_aria_label         = isset( $form_accessible_name ) && ! empty( $form_accessible_name ) ? 'aria-label="' . esc_attr( $form_accessible_name ) . '"' : '';

			if ( $has_submit_button_block ) {
				$form_classes .= ' wp-block-jetpack-contact-form';
			}

			$r .= "<form action='" . esc_url( $url ) . "' method='post' class='" . esc_attr( $form_classes ) . "' $form_aria_label novalidate>\n";
			$r .= $form->body;

			// In new versions of the contact form block the button is an inner block
			// so the button does not need to be constructed server-side.
			if ( ! $has_submit_button_block ) {
				$r .= "\t<p class='contact-submit'>\n";

				$gutenberg_submit_button_classes = '';
				if ( ! empty( $attributes['submitButtonClasses'] ) ) {
					$gutenberg_submit_button_classes = ' ' . $attributes['submitButtonClasses'];
				}

				/**
				 * Filter the contact form submit button class attribute.
				 *
				 * @module contact-form
				 *
				 * @since 6.6.0
				 *
				 * @param string $class Additional CSS classes for button attribute.
				 */
				$submit_button_class = apply_filters( 'jetpack_contact_form_submit_button_class', 'pushbutton-wide' . $gutenberg_submit_button_classes );

				$submit_button_styles = '';
				if ( ! empty( $attributes['customBackgroundButtonColor'] ) ) {
					$submit_button_styles .= 'background-color: ' . $attributes['customBackgroundButtonColor'] . '; ';
				}
				if ( ! empty( $attributes['customTextButtonColor'] ) ) {
					$submit_button_styles .= 'color: ' . $attributes['customTextButtonColor'] . ';';
				}
				if ( ! empty( $attributes['submitButtonText'] ) ) {
					$submit_button_text = $attributes['submitButtonText'];
				} else {
					$submit_button_text = $form->get_attribute( 'submit_button_text' );
				}

				$r .= "\t\t<button type='submit' class='" . esc_attr( $submit_button_class ) . "'";
				if ( ! empty( $submit_button_styles ) ) {
					$r .= " style='" . esc_attr( $submit_button_styles ) . "'";
				}
				$r .= '>';
				$r .= wp_kses(
					$submit_button_text,
					self::$allowed_html_tags_for_submit_button
				) . '</button>';
			}

			if ( is_user_logged_in() ) {
				$r .= "\t\t" . wp_nonce_field( 'contact-form_' . $id, '_wpnonce', true, false ) . "\n"; // nonce and referer
			}

			if ( isset( $attributes['hasFormSettingsSet'] ) && $attributes['hasFormSettingsSet'] ) {
				$r .= "\t\t<input type='hidden' name='is_block' value='1' />\n";
			}
			$r .= "\t\t<input type='hidden' name='contact-form-id' value='$id' />\n";
			$r .= "\t\t<input type='hidden' name='action' value='grunion-contact-form' />\n";
			$r .= "\t\t<input type='hidden' name='contact-form-hash' value='" . esc_attr( $form->hash ) . "' />\n";

			if ( $page && $page > 1 ) {
				$r .= "\t\t<input type='hidden' name='page' value='$page' />\n";
			}

			if ( ! $has_submit_button_block ) {
				$r .= "\t</p>\n";
			}

			$r .= "</form>\n";
		}

		$r .= '</div>';

		/**
		 * Filter the contact form, allowing plugins to modify the HTML.
		 *
		 * @module contact-form
		 *
		 * @since 10.2.0
		 *
		 * @param string $r The contact form HTML.
		 */
		return apply_filters( 'jetpack_contact_form_html', $r );
	}

	/**
	 * Returns a success message to be returned if the form is sent via AJAX.
	 *
	 * @param int          $feedback_id - the feedback ID.
	 * @param Contact_Form $form - the contact form.
	 *
	 * @return string $message
	 */
	public static function success_message( $feedback_id, $form ) {
		if ( 'message' === $form->get_attribute( 'customThankyou' ) ) {
			$message = wpautop( $form->get_attribute( 'customThankyouMessage' ) );
		} else {
			$message = '<p>' . implode( '</p><p>', self::get_compiled_form( $feedback_id, $form ) ) . '</p>';
		}

		return wp_kses(
			$message,
			array(
				'br'         => array(),
				'blockquote' => array( 'class' => array() ),
				'p'          => array(),
				'div'        => array(
					'class' => array(),
					'style' => array(),
				),
			)
		);
	}

	/**
	 * Returns the form submission data.
	 *
	 * This is passed to the Contact_Form_Submission class.
	 *
	 * @return array $form_submission_data
	 */
	public function get_form_submission_data() {
		return array(
			'to'                     => $this->get_attribute( 'to' ),
			'subject'                => $this->get_attribute( 'subject' ),
			'customThankYou'         => $this->get_attribute( 'customThankYou' ),
			'customThankYouRedirect' => $this->get_attribute( 'customThankYouRedirect' ),
		);
	}

	/**
	 * Returns a compiled form with labels and values in a form of  an array
	 * of lines.
	 *
	 * @param int          $feedback_id - the feedback ID.
	 * @param Contact_Form $form - the form.
	 *
	 * @return array $lines
	 */
	public static function get_compiled_form( $feedback_id, $form ) {
		$feedback       = get_post( $feedback_id );
		$field_ids      = $form->get_field_ids();
		$content_fields = Contact_Form_Plugin::parse_fields_from_content( $feedback_id );

		// Maps field_ids to post_meta keys
		$field_value_map = array(
			'name'     => 'author',
			'email'    => 'author_email',
			'url'      => 'author_url',
			'subject'  => 'subject',
			'textarea' => false, // not a post_meta key.  This is stored in post_content
		);

		$compiled_form = array();

		// "Standard" field allowed list.
		foreach ( $field_value_map as $type => $meta_key ) {
			if ( isset( $field_ids[ $type ] ) ) {
				$field = $form->fields[ $field_ids[ $type ] ];

				if ( $meta_key ) {
					if ( isset( $content_fields[ "_feedback_{$meta_key}" ] ) ) {
						if ( 'name' === $type ) {
							// If a form contains both email and name fields but the user doesn't provide a name, we don't need to show the name field
							// in the success message after submision. We have this specific check because in the above case the `author` field gets
							// a fallback value of the provided email and is used in the backend in various places.
							if ( isset( $content_fields['_feedback_author_email'] ) && $content_fields['_feedback_author'] === $content_fields['_feedback_author_email'] ) {
								continue;
							}
						}
						$value = $content_fields[ "_feedback_{$meta_key}" ];
					}
				} else {
					// The feedback content is stored as the first "half" of post_content
					$value         = is_a( $feedback, '\WP_Post' ) ? $feedback->post_content : '';
					list( $value ) = explode( '<!--more-->', $value );
					$value         = trim( $value );
				}

				// If we still do not have any value, bail.
				if ( empty( $value ) ) {
					continue;
				}

				$field_index = array_search( $field_ids[ $type ], $field_ids['all'], true );
				$field_label = $field->get_attribute( 'label' ) ? $field->get_attribute( 'label' ) . ':' : '';

				$compiled_form[ $field_index ] = sprintf(
					'<div class="field-name">%1$s</div> <div class="field-value">%2$s</div>',
					wp_kses( $field_label, array() ),
					self::escape_and_sanitize_field_value( $value )
				);
			}
		}

		// "Non-standard" fields
		if ( $field_ids['extra'] ) {
			// array indexed by field label (not field id)
			$extra_fields = get_post_meta( $feedback_id, '_feedback_extra_fields', true );

			/**
			 * Only get data for the compiled form if `$extra_fields` is a valid and non-empty array.
			 */
			if ( is_array( $extra_fields ) && ! empty( $extra_fields ) ) {

				$extra_field_keys = array_keys( $extra_fields );

				$i = 0;
				foreach ( $field_ids['extra'] as $field_id ) {
					$field       = $form->fields[ $field_id ];
					$field_index = array_search( $field_id, $field_ids['all'], true );

					$label = $field->get_attribute( 'label' ) ? $field->get_attribute( 'label' ) . ':' : '';

					$compiled_form[ $field_index ] = sprintf(
						'<div class="field-name">%1$s</div> <div class="field-value">%2$s</div>',
						wp_kses( $label, array() ),
						self::escape_and_sanitize_field_value( $extra_fields[ $extra_field_keys[ $i ] ] )
					);

					++$i;
				}
			}
		}

		// Sorting lines by the field index
		ksort( $compiled_form );

		return $compiled_form;
	}

	/**
	 * Escape and sanitize the field value.
	 *
	 * @param string $value - the value we're escaping and sanitizing.
	 *
	 * @return string
	 */
	public static function escape_and_sanitize_field_value( $value ) {
		if ( $value === null ) {
			return '';
		}

		$value = str_replace( array( '[', ']' ), array( '&#91;', '&#93;' ), $value );
		return nl2br( wp_kses( $value, array() ) );
	}

	/**
	 * Only strip out empty string values and keep all the other values as they are.
	 *
	 * @param string $single_value - the single value.
	 *
	 * @return bool
	 */
	public static function remove_empty( $single_value ) {
		return ( $single_value !== '' );
	}

	/**
	 * Escape a shortcode value.
	 *
	 * Shortcode attribute values have a number of unfortunate restrictions, which fortunately we
	 * can get around by adding some extra HTML encoding.
	 *
	 * The output HTML will have a few extra escapes, but that makes no functional difference.
	 *
	 * @since 9.1.0
	 * @param string $val Value to escape.
	 * @return string
	 */
	public static function esc_shortcode_val( $val ) {
		return strtr(
			esc_html( $val ),
			array(
				// Brackets in attribute values break the shortcode parser.
				'['  => '&#091;',
				']'  => '&#093;',
				// Shortcode parser screws up backslashes too, thanks to calls to `stripcslashes`.
				'\\' => '&#092;',
				// The existing code here represents arrays as comma-separated strings.
				// Rather than trying to change representations now, just escape the commas in values.
				','  => '&#044;',
			)
		);
	}

	/**
	 * The contact-field shortcode processor.
	 * We use an object method here instead of a static Contact_Form_Field class method to parse contact-field shortcodes so that we can tie them to the contact-form object.
	 *
	 * @param array       $attributes Key => Value pairs as parsed by shortcode_parse_atts().
	 * @param string|null $content The shortcode's inner content: [contact-field]$content[/contact-field].
	 * @return string HTML for the contact form field
	 */
	public static function parse_contact_field( $attributes, $content ) {
		// Don't try to parse contact form fields if not inside a contact form
		if ( ! Contact_Form_Plugin::$using_contact_form_field ) {
			$type = isset( $attributes['type'] ) ? $attributes['type'] : null;

			if ( $type === 'checkbox-multiple' || $type === 'radio' ) {
				preg_match_all( '/' . get_shortcode_regex() . '/s', $content, $matches );

				if ( ! empty( $matches[0] ) ) {
					$options = array();
					foreach ( $matches[0] as $shortcode ) {
						$attr = shortcode_parse_atts( $shortcode );
						if ( ! empty( $attr['label'] ) ) {
							$options[] = $attr['label'];
						}
					}

					$attributes['options'] = $options;
				}
			}

			if ( ! isset( $attributes['label'] ) ) {
				$attributes['label'] = self::get_default_label_from_type( $type );
			}

			$att_strs = array();
			foreach ( $attributes as $att => $val ) {
				if ( is_numeric( $att ) ) { // Is a valueless attribute
					$att_strs[] = self::esc_shortcode_val( $val );
				} elseif ( isset( $val ) ) { // A regular attr - value pair
					if ( ( $att === 'options' || $att === 'values' ) && is_string( $val ) ) { // remove any empty strings
						$val = explode( ',', $val );
					}
					if ( is_array( $val ) ) {
						$val        = array_filter( $val, array( __CLASS__, 'remove_empty' ) ); // removes any empty strings
						$att_strs[] = esc_html( $att ) . '="' . implode( ',', array_map( array( __CLASS__, 'esc_shortcode_val' ), $val ) ) . '"';
					} elseif ( is_bool( $val ) ) {
						$att_strs[] = esc_html( $att ) . '="' . ( $val ? '1' : '' ) . '"';
					} else {
						$att_strs[] = esc_html( $att ) . '="' . self::esc_shortcode_val( $val ) . '"';
					}
				}
			}

			$shortcode_type = 'contact-field';
			if ( $type === 'field-option' ) {
				$shortcode_type = 'contact-field-option';
			}

			$html = '[' . $shortcode_type . ' ' . implode( ' ', $att_strs );

			if ( isset( $content ) && ! empty( $content ) ) { // If there is content, let's add a closing tag
				$html .= ']' . esc_html( $content ) . '[/contact-field]';
			} else { // Otherwise let's add a closing slash in the first tag
				$html .= '/]';
			}

			return $html;
		}

		$form = self::$current_form;

		$field = new Contact_Form_Field( $attributes, $content, $form );

		$field_id = $field->get_attribute( 'id' );
		if ( $field_id ) {
			$form->fields[ $field_id ] = $field;
		} else {
			$form->fields[] = $field;
		}

		if ( // phpcs:disable WordPress.Security.NonceVerification.Missing
			isset( $_POST['action'] ) && 'grunion-contact-form' === $_POST['action']
			&&
			isset( $_POST['contact-form-id'] ) && (string) $form->get_attribute( 'id' ) === $_POST['contact-form-id']
			&&
			isset( $_POST['contact-form-hash'] ) && is_string( $_POST['contact-form-hash'] ) && hash_equals( $form->hash, wp_unslash( $_POST['contact-form-hash'] ) )
		) { // phpcs:enable
			// If we're processing a POST submission for this contact form, validate the field value so we can show errors as necessary.
			$field->validate();
		}

		// Output HTML
		return $field->render();
	}

	/**
	 * Get the default label from type.
	 *
	 * @param string $type - the type of label.
	 *
	 * @return string
	 */
	public static function get_default_label_from_type( $type ) {
		$str = null;
		switch ( $type ) {
			case 'text':
				$str = __( 'Text', 'jetpack-forms' );
				break;
			case 'name':
				$str = __( 'Name', 'jetpack-forms' );
				break;
			case 'number':
				$str = __( 'Number', 'jetpack-forms' );
				break;
			case 'email':
				$str = __( 'Email', 'jetpack-forms' );
				break;
			case 'url':
				$str = __( 'Website', 'jetpack-forms' );
				break;
			case 'date':
				$str = __( 'Date', 'jetpack-forms' );
				break;
			case 'telephone':
				$str = __( 'Phone', 'jetpack-forms' );
				break;
			case 'textarea':
				$str = __( 'Message', 'jetpack-forms' );
				break;
			case 'checkbox-multiple':
				$str = __( 'Choose several options', 'jetpack-forms' );
				break;
			case 'radio':
				$str = __( 'Choose one option', 'jetpack-forms' );
				break;
			case 'select':
				$str = __( 'Select one', 'jetpack-forms' );
				break;
			case 'consent':
				$str = __( 'Consent', 'jetpack-forms' );
				break;
			default:
				$str = null;
		}
		return $str;
	}

	/**
	 * Loops through $this->fields to generate a (structured) list of field IDs.
	 *
	 * Important: Currently the allowed fields are defined as follows:
	 *  `name`, `email`, `url`, `subject`, `textarea`
	 *
	 * If you need to add new fields to the Contact Form, please don't add them
	 * to the allowed fields and leave them as extra fields.
	 *
	 * The reasoning behind this is that both the admin Feedback view and the CSV
	 * export will not include any fields that are added to the list of
	 * allowed fields without taking proper care to add them to all the
	 * other places where they accessed/used/saved.
	 *
	 * The safest way to add new fields is to add them to the dropdown and the
	 * HTML list ( @see Contact_Form_Field::render ) and don't add them
	 * to the list of allowed fields. This way they will become a part of the
	 * `extra fields` which are saved in the post meta and will be properly
	 * handled by the admin Feedback view and the CSV Export without any extra
	 * work.
	 *
	 * If there is need to add a field to the allowed fields, then please
	 * take proper care to add logic to handle the field in the following places:
	 *
	 *  - Below in the switch statement - so the field is recognized as allowed.
	 *
	 *  - Contact_Form::process_submission - validation and logic.
	 *
	 *  - Contact_Form::process_submission - add the field as an additional
	 *      field in the `post_content` when saving the feedback content.
	 *
	 *  - Contact_Form_Plugin::parse_fields_from_content - add mapping
	 *      for the field, defined in the above method.
	 *
	 *  - Contact_Form_Plugin::map_parsed_field_contents_of_post_to_field_names -
	 *      add mapping of the field for the CSV Export. Otherwise it will be missing
	 *      from the exported data.
	 *
	 *  - admin.php / grunion_manage_post_columns - add the field to the render logic.
	 *      Otherwise it will be missing from the admin Feedback view.
	 *
	 * @return array
	 */
	public function get_field_ids() {
		$field_ids = array(
			'all'   => array(), // array of all field_ids.
			'extra' => array(), // array of all non-allowed field IDs.

			// Allowed "standard" field IDs:
			// 'email'    => field_id,
			// 'name'     => field_id,
			// 'url'      => field_id,
			// 'subject'  => field_id,
			// 'textarea' => field_id,
		);

		// Initialize marketing consent
		$field_ids['email_marketing_consent'] = null;

		foreach ( $this->fields as $id => $field ) {
			$field_ids['all'][] = $id;

			$type = $field->get_attribute( 'type' );
			if ( isset( $field_ids[ $type ] ) ) {
				// This type of field is already present in our allowed list of "standard" fields for this form
				// Put it in extra
				$field_ids['extra'][] = $id;
				continue;
			}

			/**
			 * See method description before modifying the switch cases.
			 */
			switch ( $type ) {
				case 'email':
				case 'name':
				case 'url':
				case 'subject':
				case 'textarea':
					$field_ids[ $type ] = $id;
					break;
				case 'consent':
					// Set email marketing consent for the first Consent type field
					if ( null === $field_ids['email_marketing_consent'] ) {
						if ( $field->value ) {
							$field_ids['email_marketing_consent'] = true;
						} else {
							$field_ids['email_marketing_consent'] = false;
						}
					}
					$field_ids['extra'][] = $id;
					break;
				default:
					// Put everything else in extra
					$field_ids['extra'][] = $id;
			}
		}

		return $field_ids;
	}

	/**
	 * Wrapper for wp_mail() that enables HTML messages with text alternatives
	 *
	 * @param string|array $to          Array or comma-separated list of email addresses to send message.
	 * @param string       $subject     Email subject.
	 * @param string       $message     Message contents.
	 * @param string|array $headers     Optional. Additional headers.
	 * @param string|array $attachments Optional. Files to attach.
	 *
	 * @return bool Whether the email contents were sent successfully.
	 */
	public static function wp_mail( $to, $subject, $message, $headers = '', $attachments = array() ) {
		add_filter( 'wp_mail_content_type', __CLASS__ . '::get_mail_content_type' );
		add_action( 'phpmailer_init', __CLASS__ . '::add_plain_text_alternative' );

		$result = wp_mail( $to, $subject, $message, $headers, $attachments );

		remove_filter( 'wp_mail_content_type', __CLASS__ . '::get_mail_content_type' );
		remove_action( 'phpmailer_init', __CLASS__ . '::add_plain_text_alternative' );

		return $result;
	}

	/**
	 * Get the content type that should be assigned to outbound emails
	 *
	 * @return string
	 */
	public static function get_mail_content_type() {
		return 'text/html';
	}

	/**
	 * Add a plain-text alternative part to an outbound email
	 *
	 * This makes the message more accessible to mail clients that aren't HTML-aware, and decreases the likelihood
	 * that the message will be flagged as spam.
	 *
	 * @param PHPMailer $phpmailer - the phpmailer.
	 */
	public static function add_plain_text_alternative( $phpmailer ) {
		// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		// Add an extra break so that the extra space above the <p> is preserved after the <p> is stripped out
		$alt_body = str_replace( '<p>', '<p><br />', $phpmailer->Body );

		// Convert <br> to \n breaks, to preserve the space between lines that we want to keep
		$alt_body = str_replace( array( '<br>', '<br />' ), "\n", $alt_body );

		// Convert <div> to \n breaks, to preserve space between lines for new email formatting.
		$alt_body = str_replace( '<div', "\n<div", $alt_body );

		// Convert <hr> to an plain-text equivalent, to preserve the integrity of the message
		$alt_body = str_replace( array( '<hr>', '<hr />' ), "----\n", $alt_body );

		// Trim the plain text message to remove the \n breaks that were after <doctype>, <html>, and <body>
		$phpmailer->AltBody = trim( wp_strip_all_tags( $alt_body ) );
		// phpcs:enable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

	/**
	 * Add deepslashes.
	 *
	 * @param array $value - the value.
	 * @return array The value, with slashes added.
	 */
	public function addslashes_deep( $value ) {
		if ( is_array( $value ) ) {
			return array_map( array( $this, 'addslashes_deep' ), $value );
		} elseif ( is_object( $value ) ) {
			$vars = get_object_vars( $value );
			foreach ( $vars as $key => $data ) {
				$value->{$key} = $this->addslashes_deep( $data );
			}
			return (array) $value;
		}

		return addslashes( $value );
	}

	/**
	 * Rough implementation of Gutenberg's align-attribute-to-css-class map.
	 * Only allowin "wide" and "full" as "center", "left" and "right" don't
	 * make much sense for the form.
	 *
	 * @param array $attributes Block attributes.
	 * @return string The CSS alignment class: alignfull | alignwide.
	 */
	public static function get_block_alignment_class( $attributes = array() ) {
		$align_to_class_map = array(
			'wide' => 'alignwide',
			'full' => 'alignfull',
		);
		if ( empty( $attributes['align'] ) || ! array_key_exists( $attributes['align'], $align_to_class_map ) ) {
			return '';
		}
		return $align_to_class_map[ $attributes['align'] ];
	}
}
