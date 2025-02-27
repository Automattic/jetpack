<?php
/**
 * Contact_Form_Submission class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * Stores data from a form submission.
 */
class Contact_Form_Submission {
	/**
	 * The form ID.
	 *
	 * @var int
	 */
	private $id;

	/**
	 * The form hash.
	 *
	 * @var string
	 */
	private $hash;

	/**
	 * Data that's used for the form submission process.
	 *
	 * This is supplied by the Contact_Form class.
	 *
	 * @var array
	 */
	private $form_submission_data;

	/**
	 * The form defaults.
	 *
	 * @var array
	 */
	private $defaults;

	/**
	 * Form validation errors.
	 *
	 * Keyed by the field id.
	 *
	 * @var \WP_Error
	 */
	private $errors;

	/**
	 * Form fields.
	 *
	 * Keyed by the field id. Stores the `id`, `label`, `type`, and `value` of each field.
	 *
	 * @var array
	 */
	private $fields;

	/**
	 * Constructor.
	 *
	 * @param string $form_id The form ID.
	 * @param string $form_hash The form hash.
	 */
	public function __construct( $form_id, $form_hash ) {
		$this->id     = $form_id;
		$this->hash   = $form_hash;
		$this->errors = new \WP_Error();
		$this->fields = array();
	}

	/**
	 * Set the form submission data.
	 *
	 * @param array $form_submission_data The form submission data.
	 */
	public function set_form_submission_data( $form_submission_data ) {
		$this->form_submission_data = $form_submission_data;
	}

	/**
	 * Set the defaults.
	 *
	 * @param array $defaults The form defaults.
	 */
	public function set_defaults( $defaults ) {
		$this->defaults = $defaults;
	}

	/**
	 * Add an error to the submission.
	 *
	 * @param string $hash The form hash.
	 * @param string $field_id The field ID.
	 * @param string $error The error message.
	 */
	public function add_error( $hash, $field_id, $error ) {
		// Only add errors for the submitted form.
		if ( $hash !== $this->hash ) {
			return;
		}

		$this->errors->add( $field_id, $error );
	}

	/**
	 * Get the errors for a form.
	 *
	 * @return \WP_Error
	 */
	public function get_errors() {
		return $this->errors;
	}

	/**
	 * Whether the submission has errors.
	 *
	 * @return bool
	 */
	public function has_errors() {
		return $this->errors->has_errors();
	}

	/**
	 * Add a value to the submission.
	 *
	 * @param string $hash The form hash.
	 * @param string $field_id The field ID.
	 * @param string $type The field type.
	 * @param string $label The field label.
	 * @param mixed  $value The value to add.
	 */
	public function add_field( $hash, $field_id, $type, $label, $value ) {
		// Only add fields for the submitted form.
		if ( $hash !== $this->hash ) {
			return;
		}

		$this->fields[ $field_id ] = array(
			'type'  => $type,
			'label' => $label,
			'value' => $value,
		);
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

			$type = $field['type'];
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
						if ( $field['value'] ) {
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
	 * Add a display name part to an email address
	 *
	 * SpamAssassin doesn't like addresses in HTML messages that are missing display names (e.g., `foo@bar.org`
	 * instead of `Foo Bar <foo@bar.org>`.
	 *
	 * @param string $address - the email address.
	 *
	 * @return string
	 */
	public static function add_name_to_address( $address ) {
		// If it's just the address, without a display name
		if ( is_email( $address ) ) {
			$address_parts = explode( '@', $address );

			/*
			 * The email address format here is formatted in a format
			 * that is the most likely to be accepted by wp_mail(),
			 * without escaping.
			 * More info: https://github.com/Automattic/jetpack/pull/19727
			 */
			$address = sprintf( '%s <%s>', $address_parts[0], $address );
		}

		return $address;
	}

	/**
	 * Get the permalink for the post ID that include the page query parameter if it was set.
	 *
	 * @param int $post_id The post ID.
	 *
	 * return string The permalink for the post ID.
	 */
	public static function get_permalink_with_page( $post_id ) {
		$url  = get_permalink( $post_id );
		$page = isset( $_POST['page'] ) ? absint( wp_unslash( $_POST['page'] ) ) : null; // phpcs:Ignore WordPress.Security.NonceVerification.Missing
		if ( $page ) {
			return add_query_arg( 'page', $page, $url );
		}
		return $url;
	}

	/**
	 * Returns a compiled form with labels and values in a form of  an array
	 * of lines.
	 *
	 * @param int $feedback_id - the feedback ID.
	 *
	 * @return array $lines
	 */
	public function get_compiled_form( $feedback_id ) {
		$feedback       = get_post( $feedback_id );
		$field_ids      = $this->get_field_ids();
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
				$field = $this->fields[ $field_ids[ $type ] ];

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
				$field_label = $field['label'] ? $field['label'] . ':' : '';

				$compiled_form[ $field_index ] = sprintf(
					'<div class="field-name">%1$s</div> <div class="field-value">%2$s</div>',
					wp_kses( $field_label, array() ),
					Contact_Form::escape_and_sanitize_field_value( $value )
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
					$field       = $this->fields[ $field_id ];
					$field_index = array_search( $field_id, $field_ids['all'], true );

					$label = $field['label'] ? $field['label'] . ':' : '';

					$compiled_form[ $field_index ] = sprintf(
						'<div class="field-name">%1$s</div> <div class="field-value">%2$s</div>',
						wp_kses( $label, array() ),
						Contact_Form::escape_and_sanitize_field_value( $extra_fields[ $extra_field_keys[ $i ] ] )
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
	 * Returns a compiled form with labels and values formatted for the email response
	 * in a form of an array of lines.
	 *
	 * @param int $feedback_id - the feedback ID.
	 *
	 * @return array $lines
	 */
	public function get_compiled_form_for_email( $feedback_id ) {
		$feedback       = get_post( $feedback_id );
		$field_ids      = $this->get_field_ids();
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
				$field = $this->fields[ $field_ids[ $type ] ];

				if ( $meta_key ) {
					if ( isset( $content_fields[ "_feedback_{$meta_key}" ] ) ) {
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
				$field_label = $field['label'] ? $field['label'] . ':' : '';

				$compiled_form[ $field_index ] = array(
					wp_kses( $field_label, array() ),
					Contact_Form::escape_and_sanitize_field_value( $value ),
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
					$field       = $this->fields[ $field_id ];
					$field_index = array_search( $field_id, $field_ids['all'], true );

					$field_label = $field['label'] ? $field['label'] . ':' : '';

					$compiled_form[ $field_index ] = array(
						wp_kses( $field_label, array() ),
						Contact_Form::escape_and_sanitize_field_value( $extra_fields[ $extra_field_keys[ $i ] ] ),
					);

					++$i;
				}
			}
		}

		$form = Contact_Form::$forms[ $this->hash ];

		/**
		 * This filter allows a site owner to customize the response to be emailed, by adding their own HTML around it for example.
		 *
		 * @module contact-form
		 *
		 * @since 0.18.0
		 *
		 * @param array $compiled_form the form response to be filtered
		 * @param int $feedback_id the ID of the feedback form
		 * @param Contact_Form $form a copy of this object
		 */
		$updated_compiled_form = apply_filters( 'jetpack_forms_response_email', $compiled_form, $feedback_id, $form );
		if ( $updated_compiled_form !== $compiled_form ) {
			$compiled_form = $updated_compiled_form;
		} else {
			// add styling to the array
			foreach ( $compiled_form as $key => $value ) {
				$compiled_form[ $key ] = sprintf(
					'<p><strong>%1$s</strong><br /><span>%2$s</span></p>',
					$value[0],
					$value[1]
				);
			}
		}

		// Sorting lines by the field index
		ksort( $compiled_form );

		return $compiled_form;
	}

	/**
	 * Prepare the form for Akismet.
	 *
	 * @param array $akismet_vars The Akismet variables.
	 *
	 * @return array $akismet_vars The processed Akismet variables.
	 */
	private function prepare_for_akismet( $akismet_vars ) {
		$akismet_vars['comment_type']     = 'contact_form';
		$akismet_vars['user_ip']          = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		$akismet_vars['user_agent']       = isset( $_SERVER['HTTP_USER_AGENT'] ) ? filter_var( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';
		$akismet_vars['referrer']         = isset( $_SERVER['HTTP_REFERER'] ) ? esc_url_raw( wp_unslash( $_SERVER['HTTP_REFERER'] ) ) : '';
		$akismet_vars['blog']             = get_option( 'home' );
		$akismet_vars['comment_date_gmt'] = gmdate( DATE_ATOM, time() ); // ISO 8601. See https://www.php.net/manual/en/class.datetimeinterface.php#datetimeinterface.constants.types

		foreach ( $_SERVER as $key => $value ) {
			if ( ! is_string( $value ) ) {
				continue;
			}
			if ( in_array( $key, array( 'HTTP_COOKIE', 'HTTP_COOKIE2', 'HTTP_USER_AGENT', 'HTTP_REFERER' ), true ) ) {
				// We don't care about cookies, and the UA and Referrer were caught above.
				continue;
			} elseif ( in_array( $key, array( 'REMOTE_ADDR', 'REQUEST_URI', 'DOCUMENT_URI' ), true ) ) {
				// All three of these are relevant indicators and should be passed along.
				$akismet_vars[ $key ] = $value;
			} elseif ( str_starts_with( $key, 'HTTP_' ) ) {
				// Any other HTTP header indicators.
				$akismet_vars[ $key ] = $value;
			}
		}

		/**
		 * Filter the values that are sent to Akismet for the spam check.
		 *
		 * @module contact-form
		 *
		 * @since 10.2.0
		 *
		 * @param array $form The form values being sent to Akismet.
		 */
		return apply_filters( 'jetpack_contact_form_akismet_values', $akismet_vars );
	}

	/**
	 * Wrap a message body with the appropriate in HTML tags
	 *
	 * This helps to ensure correct parsing by clients, and also helps avoid triggering spam filtering rules
	 *
	 * @param string $title - title of the email.
	 * @param string $body - the message body.
	 * @param string $footer - the footer containing meta information.
	 *
	 * @return string
	 */
	public static function wrap_message_in_html_tags( $title, $body, $footer ) {
		// Don't do anything if the message was already wrapped in HTML tags
		// That could have be done by a plugin via filters
		if ( str_contains( $body, '<html' ) ) {
			return $body;
		}

		$template = '';

		/**
		 * Filter the filename of the template HTML surrounding the response email. The PHP file will return the template in a variable called $template.
		 *
		 * @module contact-form
		 *
		 * @since 0.18.0
		 *
		 * @param string the filename of the HTML template used for response emails to the form owner.
		 */
		require apply_filters( 'jetpack_forms_response_email_template', __DIR__ . '/templates/email-response.php' );
		$html_message = sprintf(
			// The tabs are just here so that the raw code is correctly formatted for developers
			// They're removed so that they don't affect the final message sent to users
			str_replace(
				"\t",
				'',
				$template
			),
			( $title !== '' ? '<h1>' . $title . '</h1>' : '' ),
			$body,
			'',
			'',
			$footer
		);

		return $html_message;
	}

	/**
	 * Add deepslashes. Add them everywhere.
	 *
	 * @param array $value - the value.
	 * @return array The value, with slashes added.
	 */
	public static function addslashes_deep( $value ) {
		if ( is_array( $value ) ) {
			return array_map( array( __CLASS__, 'addslashes_deep' ), $value );
		} elseif ( is_object( $value ) ) {
			$vars = get_object_vars( $value );
			foreach ( $vars as $key => $data ) {
				$value->{$key} = self::addslashes_deep( $data );
			}
			return (array) $value;
		}

		return addslashes( $value );
	}

	/**
	 * Returns a success message to be returned if the form is sent via AJAX.
	 *
	 * @param int $feedback_id - the feedback ID.
	 *
	 * @return string $message
	 */
	public function success_message( $feedback_id ) {
		$form_submission_data = $this->form_submission_data;

		if ( 'message' === $form_submission_data['customThankyou'] ) {
			$message = wpautop( $form_submission_data['customThankyouMessage'] );
		} else {
			$message = '<p>' . implode( '</p><p>', $this->get_compiled_form( $feedback_id ) ) . '</p>';
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
	 * Process the submission.
	 */
	public function process() {
		global $post;

		// Contact_Form_Plugin is a singleton, so this isn't really initializing.
		$plugin = Contact_Form_Plugin::init();

		$form_submission_data = $this->form_submission_data;

		$contact_form_subject = $form_submission_data['subject'];
		$to                   = $form_submission_data['to'];
		$to                   = str_replace( ' ', '', $to );
		$emails               = explode( ',', $to );

		$valid_emails = array();

		foreach ( (array) $emails as $email ) {
			if ( ! is_email( $email ) ) {
				continue;
			}

			if ( function_exists( 'is_email_address_unsafe' ) && is_email_address_unsafe( $email ) ) {
				continue;
			}

			$valid_emails[] = $email;
		}

		// No one to send it to, which means none of the "to" attributes are valid emails.
		// Use default email instead.
		if ( ! $valid_emails ) {
			$valid_emails = $this->defaults['to'];
		}

		$to = $valid_emails;

		// Last ditch effort to set a recipient if somehow none have been set.
		if ( empty( $to ) ) {
			$to = get_option( 'admin_email' );
		}

		$field_ids = $this->get_field_ids();

		// Initialize all these "standard" fields to null
		$comment_author_email = null;
		$comment_author       = null;
		$comment_author_url   = null;
		$comment_content      = null;

		// For each of the "standard" fields, grab their field label and value.
		if ( isset( $field_ids['name'] ) ) {
			$field = $this->fields[ $field_ids['name'] ];

			if ( is_string( $field['value'] ) ) {
				$comment_author = Contact_Form_Plugin::strip_tags(
					stripslashes(
						/** This filter is already documented in core/wp-includes/comment-functions.php */
						apply_filters( 'pre_comment_author_name', addslashes( $field['value'] ) )
					)
				);
			} elseif ( is_array( $field['value'] ) ) {
				$field['value'] = '';
			}
		}

		if ( isset( $field_ids['email'] ) ) {
			$field = $this->fields[ $field_ids['email'] ];

			if ( is_string( $field['value'] ) ) {
				$comment_author_email = Contact_Form_Plugin::strip_tags(
					stripslashes(
						/** This filter is already documented in core/wp-includes/comment-functions.php */
						apply_filters( 'pre_comment_author_email', addslashes( $field['value'] ) )
					)
				);
			} elseif ( is_array( $field['value'] ) ) {
				$field['value'] = '';
			}
		}

		if ( isset( $field_ids['url'] ) ) {
			$field = $this->fields[ $field_ids['url'] ];

			if ( is_string( $field['value'] ) ) {
				$comment_author_url = Contact_Form_Plugin::strip_tags(
					stripslashes(
						/** This filter is already documented in core/wp-includes/comment-functions.php */
						apply_filters( 'pre_comment_author_url', addslashes( $field['value'] ) )
					)
				);
				if ( 'http://' === $comment_author_url ) {
					$comment_author_url = '';
				}
			} elseif ( is_array( $field['value'] ) ) {
				$field['value'] = '';
			}
		}

		if ( isset( $field_ids['textarea'] ) ) {
			$field = $this->fields[ $field_ids['textarea'] ];

			if ( is_string( $field['value'] ) ) {
				$comment_content = trim( Contact_Form_Plugin::strip_tags( $field['value'] ) );
			} else {
				$field['value'] = '';
			}
		}

		if ( isset( $field_ids['subject'] ) ) {
			$field = $this->fields[ $field_ids['subject'] ];
			if ( $field['value'] ) {
				$contact_form_subject = Contact_Form_Plugin::strip_tags( $field['value'] );
			}
		}

		// Set marketing consent
		$email_marketing_consent = $field_ids['email_marketing_consent'];

		if ( null === $email_marketing_consent ) {
			$email_marketing_consent = false;
		}

		$all_values   = array();
		$extra_values = array();
		$i            = 1; // Prefix counter for stored metadata

		// For all fields, grab label and value
		foreach ( $field_ids['all'] as $field_id ) {
			$field = $this->fields[ $field_id ];
			$label = $i . '_' . $field['label'];
			$value = $field['value'];

			$all_values[ $label ] = $value;
			++$i; // Increment prefix counter for the next field
		}

		// For the "non-standard" fields, grab label and value
		// Extra fields have their prefix starting from count( $all_values ) + 1
		foreach ( $field_ids['extra'] as $field_id ) {
			$field = $this->fields[ $field_id ];
			$label = $i . '_' . $field['label'];
			$value = $field['value'];

			if ( is_array( $value ) ) {
				$field['value'] = implode( ', ', $value );
			}

			$extra_values[ $label ] = $value;
			++$i; // Increment prefix counter for the next extra field
		}

		if ( ! empty( $_REQUEST['is_block'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- not changing the site.
			$extra_values['is_block'] = true;
		}

		$contact_form_subject = trim( $contact_form_subject );

		$comment_author_ip = Contact_Form_Plugin::get_ip_address();

		$vars = array( 'comment_author', 'comment_author_email', 'comment_author_url', 'contact_form_subject', 'comment_author_ip' );
		foreach ( $vars as $var ) {
			$$var = str_replace( array( "\n", "\r" ), '', (string) $$var );
		}

		// Ensure that Akismet gets all of the relevant information from the contact form,
		// not just the textarea field and predetermined subject.
		$akismet_vars                    = compact( $vars );
		$akismet_vars['comment_content'] = $comment_content;

		foreach ( array_merge( $field_ids['all'], $field_ids['extra'] ) as $field_id ) {
			$field = $this->fields[ $field_id ];

			// Skip any fields that are just a choice from a pre-defined list. They wouldn't have any value
			// from a spam-filtering point of view.
			if ( in_array( $field['type'], array( 'select', 'checkbox', 'checkbox-multiple', 'radio' ), true ) ) {
				continue;
			}

			// Normalize the label into a slug.
			$field_slug = trim( // Strip all leading/trailing dashes.
				preg_replace(   // Normalize everything to a-z0-9_-
					'/[^a-z0-9_]+/',
					'-',
					strtolower( $field['label'] ) // Lowercase
				),
				'-'
			);

			$field_value = ( is_array( $field['value'] ) ? trim( implode( ', ', $field['value'] ) ) : trim( $field['value'] ) );

			// Skip any values that are already in the array we're sending.
			if ( $field_value && in_array( $field_value, $akismet_vars, true ) ) {
				continue;
			}

			$akismet_vars[ 'contact_form_field_' . $field_slug ] = $field_value;
		}

		$spam           = '';
		$akismet_values = $this->prepare_for_akismet( $akismet_vars );

		// Is it spam?
		/** This filter is already documented in \Automattic\Jetpack\Forms\ContactForm\Admin */
		$is_spam = apply_filters( 'jetpack_contact_form_is_spam', false, $akismet_values );
		if ( is_wp_error( $is_spam ) ) { // WP_Error to abort
			return $is_spam; // abort
		} elseif ( $is_spam === true ) {  // TRUE to flag a spam
			$spam = '***SPAM*** ';
		}

		/**
		 * Filter whether a submitted contact form is in the comment disallowed list.
		 *
		 * @module contact-form
		 *
		 * @since 8.9.0
		 *
		 * @param bool  $result         Is the submitted feedback in the disallowed list.
		 * @param array $akismet_values Feedack values returned by the Akismet plugin.
		 */
		$in_comment_disallowed_list = apply_filters( 'jetpack_contact_form_in_comment_disallowed_list', false, $akismet_values );

		if ( ! $comment_author ) {
			$comment_author = $comment_author_email;
		}

		/**
		 * Filter the email where a submitted feedback is sent.
		 *
		 * @module contact-form
		 *
		 * @since 1.3.1
		 *
		 * @param string|array $to Array of valid email addresses, or single email address.
		 * @param array $all_values Contact form fields
		 */
		$to            = (array) apply_filters( 'contact_form_to', $to, $all_values );
		$reply_to_addr = $to[0]; // get just the address part before the name part is added

		foreach ( $to as $to_key => $to_value ) {
			$to[ $to_key ] = Contact_Form_Plugin::strip_tags( $to_value );
			$to[ $to_key ] = self::add_name_to_address( $to_value );
		}

		// Get the site domain and get rid of www.
		$sitename        = wp_parse_url( site_url(), PHP_URL_HOST );
		$from_email_addr = 'wordpress@';

		if ( null !== $sitename ) {
			if ( str_starts_with( $sitename, 'www.' ) ) {
				$sitename = substr( $sitename, 4 );
			}

			$from_email_addr .= $sitename;
		}

		if ( ! empty( $comment_author_email ) ) {
			$reply_to_addr = $comment_author_email;
		}

		/*
		 * The email headers here are formatted in a format
		 * that is the most likely to be accepted by wp_mail(),
		 * without escaping.
		 * More info: https://github.com/Automattic/jetpack/pull/19727
		 */
		$headers = 'From: ' . $comment_author . ' <' . $from_email_addr . ">\r\n" .
			'Reply-To: ' . $comment_author . ' <' . $reply_to_addr . ">\r\n";

		/**
		 * Allow customizing the email headers.
		 *
		 * Warning: DO NOT add headers or header data from the form submission without proper
		 * escaping and validation, or you're liable to allow abusers to use your site to send spam.
		 *
		 * Especially DO NOT take email addresses from the form data to add as CC or BCC headers
		 * without strictly validating each address against a list of allowed addresses.
		 *
		 * @module contact-form
		 *
		 * @since 10.2.0
		 *
		 * @param string|array $headers        Email headers.
		 * @param string       $comment_author Name of the author of the submitted feedback, if provided in form.
		 * @param string       $reply_to_addr  Email of the author of the submitted feedback, if provided in form.
		 * @param string|array $to             Array of valid email addresses, or single email address, where the form is sent.
		 */
		$headers = apply_filters(
			'jetpack_contact_form_email_headers',
			$headers,
			$comment_author,
			$reply_to_addr,
			$to
		);

		$all_values['email_marketing_consent'] = $email_marketing_consent;

		// Build feedback reference
		$feedback_time  = current_time( 'mysql' );
		$feedback_title = "{$comment_author} - {$feedback_time}";
		$feedback_id    = md5( $feedback_title );

		$entry_values = array(
			'entry_title'     => the_title_attribute( 'echo=0' ),
			'entry_permalink' => esc_url( self::get_permalink_with_page( get_the_ID() ) ),
			'feedback_id'     => $feedback_id,
		);

		if ( isset( $_POST['page'] ) ) { // phpcs:Ignore WordPress.Security.NonceVerification.Missing
			$entry_values['entry_page'] = absint( wp_unslash( $_POST['page'] ) ); // phpcs:Ignore WordPress.Security.NonceVerification.Missing
		}

		$all_values = array_merge( $all_values, $entry_values );

		/** This filter is already documented in \Automattic\Jetpack\Forms\ContactForm\Admin */
		$subject = apply_filters( 'contact_form_subject', $contact_form_subject, $all_values );

		/*
		 * Links to the feedback and the post.
		 */
		$is_widget              = str_starts_with( $this->id, 'widget-' );
		$is_block_template      = str_starts_with( $this->id, 'block-template-' );
		$is_block_template_part = str_starts_with( $this->id, 'block-template-part-' );
		if ( $is_block_template || $is_block_template_part || $is_widget ) {
			$url = home_url( '/' );
		} else {
			$url = self::get_permalink_with_page( $post->ID );
		}

		// translators: the time of the form submission.
		$date_time_format = _x( '%1$s \a\t %2$s', '{$date_format} \a\t {$time_format}', 'jetpack-forms' );
		$date_time_format = sprintf( $date_time_format, get_option( 'date_format' ), get_option( 'time_format' ) );
		$time             = wp_date( $date_time_format );

		// Keep a copy of the feedback as a custom post type.
		if ( $in_comment_disallowed_list ) {
			$feedback_status = 'trash';
		} elseif ( $is_spam ) {
			$feedback_status = 'spam';
		} else {
			$feedback_status = 'publish';
		}

		foreach ( (array) $akismet_values as $av_key => $av_value ) {
			$akismet_values[ $av_key ] = Contact_Form_Plugin::strip_tags( $av_value );
		}

		foreach ( (array) $all_values as $all_key => $all_value ) {
			$all_values[ $all_key ] = Contact_Form_Plugin::strip_tags( $all_value );
		}

		foreach ( (array) $extra_values as $ev_key => $ev_value ) {
			$extra_values[ $ev_key ] = Contact_Form_Plugin::strip_tags( $ev_value );
		}

		/*
		 * We need to make sure that the post author is always zero for contact
		 * form submissions.  This prevents export/import from trying to create
		 * new users based on form submissions from people who were logged in
		 * at the time.
		 *
		 * Unfortunately wp_insert_post() tries very hard to make sure the post
		 * author gets the currently logged in user id.  That is how we ended up
		 * with this work around.
		 */
		add_filter( 'wp_insert_post_data', array( $plugin, 'insert_feedback_filter' ), 10, 2 );

		/**
		 * Allows site owners to not include IP addresses in the saved form response.
		 *
		 * The IP address is still used as part of spam filtering, if enabled, but it is removed when this filter
		 * is set to true before saving to the database and e-mailing the form recipients.

		 * @module contact-form
		 *
		 * @param bool $remove_ip_address Should the IP address be removed. Default false.
		 * @param string $ip_address IP address of the form submission.
		 *
		 * @since 0.33.0
		 */
		if ( apply_filters( 'jetpack_contact_form_forget_ip_address', false, $comment_author_ip ) ) {
			$comment_author_ip = null;
		}

		$comment_ip_text = $comment_author_ip ? "IP: {$comment_author_ip}\n" : null;

		$post_id = wp_insert_post(
			array(
				'post_date'    => addslashes( $feedback_time ),
				'post_type'    => 'feedback',
				'post_status'  => addslashes( $feedback_status ),
				'post_parent'  => $post ? (int) $post->ID : 0,
				'post_title'   => addslashes( wp_kses( $feedback_title, array() ) ),
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.InterpolatedVariableNotSnakeCase, WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.PHP.DevelopmentFunctions.error_log_print_r
				'post_content' => addslashes( wp_kses( "$comment_content\n<!--more-->\nAUTHOR: {$comment_author}\nAUTHOR EMAIL: {$comment_author_email}\nAUTHOR URL: {$comment_author_url}\nSUBJECT: {$subject}\n{$comment_ip_text}JSON_DATA\n" . @wp_json_encode( $all_values, true ), array() ) ), // so that search will pick up this data
				'post_name'    => $feedback_id,
			)
		);

		// once insert has finished we don't need this filter any more
		remove_filter( 'wp_insert_post_data', array( $plugin, 'insert_feedback_filter' ), 10 );

		update_post_meta( $post_id, '_feedback_extra_fields', self::addslashes_deep( $extra_values ) );

		if ( 'publish' === $feedback_status ) {
			// Increase count of unread feedback.
			$unread = (int) get_option( 'feedback_unread_count', 0 ) + 1;
			update_option( 'feedback_unread_count', $unread );
		}

		if ( defined( 'AKISMET_VERSION' ) ) {
			update_post_meta( $post_id, '_feedback_akismet_values', self::addslashes_deep( $akismet_values ) );
		}

		/**
		 * Fires after the feedback post for the contact form submission has been inserted.
		 *
		 * @module contact-form
		 *
		 * @since 8.6.0
		 *
		 * @param integer $post_id The post id that contains the contact form data.
		 * @param array   $this->fields An array containing the form's Contact_Form_Field objects.
		 * @param boolean $is_spam Whether the form submission has been identified as spam.
		 * @param array   $entry_values The feedback entry values.
		 */
		do_action( 'grunion_after_feedback_post_inserted', $post_id, $this->fields, $is_spam, $entry_values );

		/**
		 * Filter the title used in the response email.
		 *
		 * @module contact-form
		 *
		 * @since 0.18.0
		 *
		 * @param string the title of the email
		 */
		$title   = (string) apply_filters( 'jetpack_forms_response_email_title', '' );
		$message = $this->get_compiled_form_for_email( $post_id );

		if ( is_user_logged_in() ) {
			$sent_by_text = sprintf(
				// translators: the name of the site.
				'<br />' . esc_html__( 'Sent by a verified %s user.', 'jetpack-forms' ) . '<br />',
				isset( $GLOBALS['current_site']->site_name ) && $GLOBALS['current_site']->site_name ? $GLOBALS['current_site']->site_name : '"' . get_option( 'blogname' ) . '"'
			);
		} else {
			$sent_by_text = '<br />' . esc_html__( 'Sent by an unverified visitor to your site.', 'jetpack-forms' ) . '<br />';
		}

		$footer_time = sprintf(
			/* translators: Placeholder is the date and time when a form was submitted. */
			esc_html__( 'Time: %1$s', 'jetpack-forms' ),
			$time
		);
		$footer_ip = null;
		if ( $comment_author_ip ) {
			$footer_ip = sprintf(
			/* translators: Placeholder is the IP address of the person who submitted a form. */
				esc_html__( 'IP Address: %1$s', 'jetpack-forms' ),
				$comment_author_ip
			) . '<br />';
		}

		$footer_url = sprintf(
			/* translators: Placeholder is the URL of the page where a form was submitted. */
			__( 'Source URL: %1$s', 'jetpack-forms' ),
			esc_url( $url )
		);

		$footer = implode(
			'',
			/**
			 * Filter the footer used in the response email.
			 *
			 * @module contact-form
			 *
			 * @since 0.18.0
			 *
			 * @param array the lines of the footer, one line per array element.
			 */
			apply_filters(
				'jetpack_forms_response_email_footer',
				array(
					'<br />',
					'<hr />',
					'<span style="font-size: 12px">',
					$footer_time . '<br />',
					$footer_ip ? $footer_ip . '<br />' : null,
					$footer_url . '<br />',
					$sent_by_text,
					'</span>',
					'<hr />',
				)
			)
		);

		/**
		 * Filters the message sent via email after a successful form submission.
		 *
		 * @module contact-form
		 *
		 * @since 1.3.1
		 *
		 * @param string $message Feedback email message.
		 * @param string $message Feedback email message as an array
		 */
		$message = apply_filters( 'contact_form_message', implode( '', $message ), $message );

		// This is called after `contact_form_message`, in order to preserve back-compat
		$message = self::wrap_message_in_html_tags( $title, $message, $footer );

		update_post_meta( $post_id, '_feedback_email', self::addslashes_deep( compact( 'to', 'message' ) ) );

		/**
		 * Fires right before the contact form message is sent via email to
		 * the recipient specified in the contact form.
		 *
		 * @module contact-form
		 *
		 * @since 1.3.1
		 *
		 * @param integer $post_id Post contact form lives on
		 * @param array $all_values Contact form fields
		 * @param array $extra_values Contact form fields not included in $all_values
		 */
		do_action( 'grunion_pre_message_sent', $post_id, $all_values, $extra_values );

		// schedule deletes of old spam feedbacks
		if ( ! wp_next_scheduled( 'grunion_scheduled_delete' ) ) {
			wp_schedule_event( time() + 250, 'daily', 'grunion_scheduled_delete' );
		}

		if (
			$is_spam !== true &&
			/**
			 * Filter to choose whether an email should be sent after each successful contact form submission.
			 *
			 * @module contact-form
			 *
			 * @since 2.6.0
			 *
			 * @param bool true Should an email be sent after a form submission. Default to true.
			 * @param int $post_id Post ID.
			 */
			true === apply_filters( 'grunion_should_send_email', true, $post_id )
		) {
			Contact_Form::wp_mail( $to, "{$spam}{$subject}", $message, $headers );
		} elseif (
			true === $is_spam &&
			/**
			 * Choose whether an email should be sent for each spam contact form submission.
			 *
			 * @module contact-form
			 *
			 * @since 1.3.1
			 *
			 * @param bool false Should an email be sent after a spam form submission. Default to false.
			 */
			apply_filters( 'grunion_still_email_spam', false )
		) { // don't send spam by default.  Filterable.
			Contact_Form::wp_mail( $to, "{$spam}{$subject}", $message, $headers );
		}

		/**
		 * Fires an action hook right after the email(s) have been sent.
		 *
		 * @module contact-form
		 *
		 * @since 7.3.0
		 *
		 * @param int $post_id Post contact form lives on.
		 * @param string|array $to Array of valid email addresses, or single email address.
		 * @param string $subject Feedback email subject.
		 * @param string $message Feedback email message.
		 * @param string|array $headers Optional. Additional headers.
		 * @param array $all_values Contact form fields.
		 * @param array $extra_values Contact form fields not included in $all_values
		 */
		do_action( 'grunion_after_message_sent', $post_id, $to, $subject, $message, $headers, $all_values, $extra_values );

		if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
			return $this->success_message( $post_id );
		}

		$redirect        = '';
		$custom_redirect = false;
		if ( 'redirect' === $form_submission_data['customThankYou'] ) {
			$custom_redirect = true;
			$redirect        = esc_url_raw( $form_submission_data['customThankYouRedirect'] );
		}

		if ( ! $redirect ) {
			$custom_redirect = false;
			$redirect        = wp_get_referer();
		}

		if ( ! $redirect ) { // wp_get_referer() returns false if the referer is the same as the current page.
			$custom_redirect = false;
			$redirect        = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		}

		if ( ! $custom_redirect ) {
			$redirect = add_query_arg(
				urlencode_deep(
					array(
						'contact-form-id'   => $this->id,
						'contact-form-sent' => $post_id,
						'contact-form-hash' => $this->hash,
						'_wpnonce'          => wp_create_nonce( "contact-form-sent-{$post_id}" ), // wp_nonce_url HTMLencodes :( .
					)
				),
				$redirect
			);
		}

		/**
		 * Filter the URL where the reader is redirected after submitting a form.
		 *
		 * @module contact-form
		 *
		 * @since 1.9.0
		 *
		 * @param string $redirect Post submission URL.
		 * @param int $id Contact Form ID.
		 * @param int $post_id Post ID.
		 */
		$redirect = apply_filters( 'grunion_contact_form_redirect_url', $redirect, $this->id, $post_id );

		// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- We intentially allow external redirects here.
		wp_redirect( $redirect );
		exit( 0 );
	}
}
