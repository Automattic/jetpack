<?php
/**
 * Feedback class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WP_Post;
/**
 * Handles the response for a contact form submission.
 *
 * Feedback objects are there to help us interact with the form response data.
 */
class Feedback {

	const POST_TYPE = 'feedback';

	/**
	 * The form field values.
	 *
	 * @var array
	 */
	protected $fields = array();

	/**
	 * Static cache for feedback fields.
	 *
	 * This is used to avoid recomputing the feedback fields for the same post ID.
	 *
	 * @var array
	 */
	private static $feedback_fields = array();

	/**
	 * Does the response have files attached to it?
	 *
	 * @var bool
	 */
	protected $has_file = false;

	/**
	 * The status of the feedback entry.
	 *
	 * @var string
	 */
	protected $status = 'publish'; // Default status is 'publish' or other statuses as needed.

	/**
	 * The IP address of the user who submitted the feedback.
	 *
	 * This is only available on form submissions, and might not be available when retrieving existing feedback posts in case the site admin decides to not store the IP address.
	 *
	 * @var string|null
	 */
	protected $ip_address = null;

	/**
	 * The subject of the feedback entry.
	 *
	 * @var string
	 */
	protected $subject = '';

	/**
	 * Feedback ID of the feedback entry.
	 *
	 * Marked as legacy because it is not used in the new feedback system.
	 *
	 * @var string
	 */
	protected $legacy_feedback_id = '';

	/**
	 * The title of the feedback entry.
	 *
	 * Marked as legacy because it is not used in the new feedback system.
	 *
	 * @var string
	 */
	protected $legacy_feedback_title = '';

	/**
	 * The time of the feedback entry.
	 *
	 * This is used to store the title of the feedback entry.
	 *
	 * @var string
	 */
	protected $feedback_time = '';

	/**
	 * The Feedback_Author of the feedback entry.
	 *
	 * @var Feedback_Author
	 */
	protected $author_data;

	/**
	 * The comment content of the feedback entry.
	 *
	 * @var string
	 */
	protected $comment_content = '';

	/**
	 * Whether the user has given consent for data processing.
	 *
	 * @var bool
	 */
	protected $has_consent = false;

	/**
	 * The entry object of the post that the feedback was submitted from.
	 *
	 * This is used to store the entry object of the post that the feedback was submitted from.
	 *
	 * @var Feedback_Source
	 */
	protected $source;

	/**
	 * Create a response object from a feedback post ID.
	 *
	 * @param int $feedback_post_id The ID of the feedback post.
	 * @return static|null
	 */
	public static function get( $feedback_post_id ) {
		$feedback_post = get_post( $feedback_post_id );
		if ( ! $feedback_post || self::POST_TYPE !== $feedback_post->post_type ) {
			return null;
		}

		if ( isset( self::$feedback_fields[ $feedback_post->ID ] ) ) {
			return self::$feedback_fields[ $feedback_post->ID ];
		}

		$instance = new self();
		$instance->load_from_post( $feedback_post );
		self::$feedback_fields[ $feedback_post->ID ] = $instance;
		return $instance;
	}

	/**
	 * Create a Feedback object from a feedback post.
	 *
	 * @param WP_Post $feedback_post The feedback post object.
	 */
	private function load_from_post( WP_Post $feedback_post ) {

		$parsed_content = $this->parse_content( $feedback_post->post_content, $feedback_post->post_mime_type );

		$this->status             = $feedback_post->post_status;
		$this->legacy_feedback_id = $feedback_post->post_name;
		$this->feedback_time      = $feedback_post->post_date;

		$this->fields = $parsed_content['fields'] ?? array();

		$this->source = new Feedback_Source(
			$feedback_post->post_parent,
			$parsed_content['entry_title'] ?? '',
			$parsed_content['entry_page'] ?? 1
		);

		$this->ip_address = $parsed_content['ip'] ?? $this->get_first_field_of_type( 'ip' );
		$this->subject    = $parsed_content['subject'] ?? $this->get_first_field_of_type( 'subject' );

		$this->author_data = new Feedback_Author(
			$this->get_first_field_of_type( 'name', 'pre_comment_author_name' ),
			$this->get_first_field_of_type( 'email', 'pre_comment_author_email' ),
			$this->get_first_field_of_type( 'url', 'pre_comment_author_url' )
		);

		$this->comment_content = $this->get_first_field_of_type( 'textarea' );
		$this->has_consent     = (bool) $this->get_first_field_of_type( 'consent' );

		$this->legacy_feedback_title = $feedback_post->post_title ? $feedback_post->post_title : $this->get_author() . ' - ' . $feedback_post->post_date;
	}

	/**
	 * Create a response object from a form submission.
	 *
	 * @param array        $post_data Typically $_POST.
	 * @param Contact_Form $form      The form object.
	 * @param WP_Post|null $current_post The current post object, if available.
	 * @param int          $current_page_number The current page number associated with the current post object entry.
	 *
	 * @return static
	 */
	public static function from_submission( $post_data, $form, $current_post = null, $current_page_number = 1 ) {
		$instance = new self();
		$instance->load_from_submission( $post_data, $form, $current_post, $current_page_number );
		return $instance;
	}

	/**
	 * Load from Form Submission.
	 *
	 * @param array        $post_data The $_POST received during the form submission.
	 * @param Contact_Form $form  The form object.
	 * @param WP_Post|null $current_post The current post object, if available.
	 * @param int          $current_page_number The current page number associated with the current post object entry.
	 */
	private function load_from_submission( $post_data, $form, $current_post = null, $current_page_number = 1 ) {

		$this->source = Feedback_Source::from_submission( $current_post, $current_page_number );
		// If post_data is provided, use it to populate fields.
		$this->fields          = $this->get_computed_fields( $post_data, $form );
		$this->ip_address      = Contact_Form_Plugin::get_ip_address();
		$this->subject         = $this->get_computed_subject( $post_data, $form );
		$this->author_data     = Feedback_Author::from_submission( $post_data, $form );
		$this->comment_content = $this->get_computed_comment_content( $post_data, $form );
		$this->has_consent     = $this->get_computed_consent( $post_data, $form );

		$this->feedback_time         = current_time( 'mysql' );
		$this->legacy_feedback_title = "{$this->get_author()} - {$this->feedback_time}";
		$this->legacy_feedback_id    = md5( $this->legacy_feedback_title );
	}

	/**
	 * Get a sanitized value from the post data.
	 *
	 * @param string      $key The key to look for in the post data.
	 * @param array       $post_data The post data array, typically $_POST.
	 * @param string|null $type The type of the field, if applicable (e.g., 'file').
	 *
	 * @return string|array The sanitized value, or an empty string if the key is not found.
	 */
	private function get_field_value( $key, $post_data, $type = null ) {
		if ( $type === 'file' ) {
			if ( isset( $post_data[ $key ] ) ) {
				return self::process_file_field_value( $post_data[ $key ] );
			}
			return array( 'files' => array() );
		}

		if ( $type === 'image-select' ) {
			if ( isset( $post_data[ $key ] ) ) {
				return self::process_image_select_field_value( $post_data[ $key ] );
			}

			return array(
				'type'    => 'image-select',
				'choices' => array(),
			);
		}

		if ( isset( $post_data[ $key ] ) ) {
			if ( is_array( $post_data[ $key ] ) ) {
				return array_map( 'sanitize_textarea_field', wp_unslash( $post_data[ $key ] ) );
			} else {
				return sanitize_textarea_field( wp_unslash( $post_data[ $key ] ) );
			}
		}
		return '';
	}

	/**
	 * Process the file field value.
	 *
	 * @param array $raw_data The raw post data from the file field.
	 *
	 * @return array The processed file data.
	 */
	public static function process_file_field_value( $raw_data ) {
		$file_data_array = is_array( $raw_data )
			? array_map(
				function ( $json_str ) {
					$decoded = json_decode( stripslashes( $json_str ), true );
					return array(
						'file_id' => isset( $decoded['file_id'] ) ? sanitize_text_field( $decoded['file_id'] ) : '',
						'name'    => isset( $decoded['name'] ) ? sanitize_text_field( $decoded['name'] ) : '',
						'size'    => isset( $decoded['size'] ) ? absint( $decoded['size'] ) : 0,
						'type'    => isset( $decoded['type'] ) ? sanitize_text_field( $decoded['type'] ) : '',
					);
				},
				$raw_data
			) : array();

		if ( empty( $file_data_array ) ) {
			return array(
				'files' => array(),
			);
		}

		return array(
			'files' => $file_data_array,
		);
	}

	/**
	 * Process the image select field value.
	 *
	 * @param array $raw_data The raw post data from the image select field.
	 *
	 * @return array The processed image select data.
	 */
	public static function process_image_select_field_value( $raw_data ) {
		$value = array(
			'type'    => 'image-select',
			'choices' => array(),
		);

		$selection_data_array = is_array( $raw_data )
			? array_map(
				function ( $json_str ) {
					return json_decode( stripslashes( $json_str ), true );
				},
				$raw_data
			) : array( json_decode( stripslashes( $raw_data ), true ) );

		if ( ! empty( $selection_data_array ) ) {
			$value['choices'] = $selection_data_array;
		}

		return $value;
	}

	/**
	 * Get the computed fields from the post data.
	 *
	 * @param string $label The label of the field to look for.
	 * @param string $context The context in which the value is being rendered (default is 'default').
	 *
	 * @return string The Value of the field.
	 */
	public function get_field_value_by_label( $label, $context = 'default' ) {
		// This method is used to get the value of a field by its label.
		foreach ( $this->fields as $field ) {
			if ( $field->get_label( $context ) === $label ) {
				return $field->get_render_value( $context );
			}
		}
		return '';
	}

	/**
	 * Get the value of the field based on the first type found.
	 *
	 * @param string      $type The type of the field to look for.
	 * @param string|null $filter Optional filter to apply to the value.
	 * @param string      $context The context in which the value is being rendered (default is 'default').
	 *
	 * @return string The value of the first field of the specified type, or an empty string if not found.
	 */
	private function get_first_field_of_type( $type, $filter = null, $context = 'default' ) {
		// This method is used to get the first field of a specific type.
		foreach ( $this->fields as $field ) {
			if ( $field->get_type() === $type ) {
				if ( $filter ) {
					return Contact_Form_Plugin::strip_tags(
						stripslashes(
							/** This filter is already documented in core/wp-includes/comment-functions.php */
							\apply_filters( $filter, addslashes( $field->get_render_value( $context ) ) )
						)
					);
				}
				return $field->get_render_value( $context );
			}
		}
		return '';
	}

	/**
	 * Get all the fields of the response.
	 */
	public function get_fields() {
		return $this->fields;
	}

	/**
	 * Check whether this feedback contains at least one field of a given type.
	 *
	 * @param string $type Field type to check for (e.g. 'consent', 'email', 'textarea').
	 * @return bool True if a field of the given type exists; false otherwise.
	 */
	public function has_field_type( $type ) {
		foreach ( $this->fields as $field ) {
			if ( $field->get_type() === $type ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Get the values related to where the form was submitted from.
	 *
	 * @return array An array of entry values.
	 */
	public function get_entry_values() {
		// This is a convenience method to get the entry values in a simple array format.
		$entry_values = array(
			'email_marketing_consent' => (string) $this->has_consent ? 'yes' : 'no',
			'entry_title'             => $this->source->get_title(),
			'entry_permalink'         => $this->source->get_permalink(),
			'feedback_id'             => $this->legacy_feedback_id,
		);

		if ( $this->source->get_page_number() > 1 ) {
			$entry_values['entry_page'] = $this->source->get_page_number();
		}
		return $entry_values;
	}

	/**
	 * Get all values of the response.
	 *
	 * @param string $context The context in which the values are being retrieved.
	 *
	 * @return array An array of all values, including fields and entry values.
	 */
	public function get_all_values( $context = 'default' ) {
		// This is a legacy method to maintain compatibility with older code.
		return array_merge( $this->get_compiled_fields( $context, 'key-value' ), $this->get_entry_values() );
	}

	/**
	 * Get extra values.
	 * This is a legacy method to maintain compatibility with older code.
	 *
	 * @param string $context The context in which the values are being retrieved.
	 *
	 * @return array An array of extra values, including entry values
	 */
	public function get_legacy_extra_values( $context = 'default' ) {
		$count            = 1;
		$_extra_fields    = array();
		$special_fields   = array();
		$non_extra_fields = array( 'email', 'name', 'url', 'subject', 'textarea', 'ip' );

		// Create a map of special fields to check agains their values.
		foreach ( $this->fields as $field ) {
			if ( in_array( $field->get_type(), $non_extra_fields, true ) && $field->get_render_value( $context ) ) {
				$special_fields[ $field->get_render_value( $context ) ] = true;
			}
		}

		foreach ( $this->fields as $field ) {
			if ( $field->compile_field( 'default' ) ) {
				continue;
			}
			if ( $field->get_type() === 'basic' && isset( $special_fields[ $field->get_render_value() ] ) ) {
				++$count;
				continue; // Skip fields that are already present in the non-extra fields.
			}
			$_extra_fields[] = $field;
			++$count; // Increment count to ensure unique keys for extra values.
		}
		$extra_values       = array();
		$extra_fields_count = $count;
		$is_present         = array(); // Used to store the value only once.

		foreach ( $_extra_fields as $field ) {
			if ( ! in_array( $field->get_type(), $non_extra_fields, true ) || isset( $is_present[ $field->get_type() ] ) ) {
				$extra_values[ $extra_fields_count . '_' . $field->get_label() ] = $field->get_render_value( $context );
				++$extra_fields_count; // Increment count to ensure unique keys for extra values.
			} else {
				$is_present[ $field->get_type() ] = true;
			}
		}
		return $extra_values;
	}

	/**
	 * Get all values of the response.
	 *
	 * @return array An array of all values, including fields and entry values.
	 */
	public function get_all_legacy_values() {
		return array(
			'_feedback_author'       => $this->get_author(),
			'_feedback_author_email' => $this->get_author_email(),
			'_feedback_author_url'   => $this->get_author_url(),
			'_feedback_subject'      => $this->get_subject(),
			'_feedback_ip'           => $this->get_ip_address(),
			'_feedback_all_fields'   => $this->get_all_values(),
		);
	}
	/**
	 * Return the compiled fields for the given context.
	 *
	 * @param string $context The context in which the fields are compiled.
	 * @param string $array_shape The shape of the array to return. Can be 'all', 'value', 'label', or 'key-value'.
	 *
	 * @return array An array of compiled fields with labels and values.
	 */
	public function get_compiled_fields( $context = 'default', $array_shape = 'all' ) {
		$compiled_fields = array();

		$count_field_labels = array();
		foreach ( $this->fields as $field ) {
			if ( $field->compile_field( $context ) ) {
				continue; // Skip fields that are not meant to be rendered.
			}

			// Don't show the hidden fields in the user context.
			if ( in_array( $context, array( 'web', 'ajax' ), true ) ) {
				if ( $field->is_of_type( 'hidden' ) ) {
					continue;
				}
			}

			$label = $field->get_label( $context );

			if ( ! isset( $count_field_labels[ $label ] ) ) {
				$count_field_labels[ $label ] = 1;
			} else {
				++$count_field_labels[ $label ];
			}

			// Compile the field based on the requested shape.
			switch ( $array_shape ) {
				case 'default':
				case 'all':
					$compiled_fields[ $field->get_key() ] = array(
						'label' => $label,
						'value' => $field->get_render_value( $context ),
					);
					break;
				case 'label|value':
					$compiled_fields[] = array(
						'label' => $label,
						'value' => $field->get_render_value( $context ),
					);
					break;
				case 'value':
					$compiled_fields[] = $field->get_render_value( $context );
					break;
				case 'label':
					$compiled_fields[] = $label;
					break;
				case 'key-value':
					$compiled_fields[ $field->get_key() ] = $field->get_render_value( $context );
					break;
				case 'label-value':
						$compiled_fields[ $field->get_label( $context, $count_field_labels[ $label ] ) ] = $field->get_render_value( $context );
					break;
			}
		}

		return $compiled_fields;
	}

	/**
	 * Get the feedback ID of the response.
	 * Which is the same as the post name for feedback entries.
	 * Please note that this is not the same as the feedback post ID.
	 *
	 * @return string
	 */
	public function get_feedback_id() {
		return $this->legacy_feedback_id;
	}

	/**
	 * Get the feedback title of the response.
	 *
	 * This is mostly used for legacy reasons.
	 *
	 * @return string
	 */
	public function get_title() {
		return $this->legacy_feedback_title;
	}

	/**
	 * Get the time of the feedback entry.
	 *
	 * @return string
	 */
	public function get_time() {
		return $this->feedback_time;
	}

	/**
	 * Get the askimet vars that are used to check for spam.
	 *
	 * These are the variables that are sent to Akismet to check if the feedback is spam or not.
	 *
	 * @return array
	 */
	public function get_akismet_vars() {
		$akismet_vars = array(
			'comment_author'       => $this->author_data->get_name(),
			'comment_author_email' => $this->author_data->get_email(),
			'comment_author_url'   => $this->author_data->get_url(),
			'contact_form_subject' => $this->get_subject(),
			'comment_author_ip'    => $this->get_ip_address(),
			'comment_content'      => empty( $this->get_comment_content() ) ? null : $this->get_comment_content(),
		);

		foreach ( $this->fields as $field ) {

			// Skip any fields that are just a choice from a pre-defined list. They wouldn't have any value
			// from a spam-filtering point of view.
			if ( in_array( $field->get_type(), array( 'select', 'checkbox', 'checkbox-multiple', 'radio', 'file', 'image-select' ), true ) ) {
				continue;
			}

			// Normalize the label into a slug.
			$field_slug = trim( // Strip all leading/trailing dashes.
				preg_replace(   // Normalize everything to a-z0-9_-
					'/[^a-z0-9_]+/',
					'-',
					strtolower( $field->get_label() ) // Lowercase
				),
				'-'
			);

			$field_value = $field->get_render_value( 'akismet' );

			// Skip any values that are already in the array we're sending.
			if ( $field_value && in_array( $field_value, $akismet_vars, true ) ) {
				continue;
			}

			$akismet_vars[ 'contact_form_field_' . $field_slug ] = $field_value;
		}

		return $akismet_vars;
	}

	/**
	 * Get the author name of the feedback entry.
	 * If the author is not provided we will use the email instead.
	 *
	 * @return string
	 */
	public function get_author() {
		return $this->author_data->get_display_name();
	}

	/**
	 * Get the author email of a feedback entry.
	 *
	 * @return string
	 */
	public function get_author_email() {
		return $this->author_data->get_email();
	}

	/**
	 * Get the author's gravatar URL.
	 *
	 * This is a convenience method to get the author's gravatar URL.
	 *
	 * @return string
	 */
	public function get_author_avatar() {
		return $this->author_data->get_avatar_url();
	}

	/**
	 * Get the author url of a feedback entry.
	 *
	 * @return string
	 */
	public function get_author_url() {
		return $this->author_data->get_url();
	}

	/**
	 * Get the comment content of a feedback entry.
	 *
	 * @return string
	 */
	public function get_comment_content() {
		return $this->comment_content;
	}

	/**
	 * Get the IP address of the submitted feedback request.
	 *
	 * @return string|null
	 */
	public function get_ip_address() {
		return $this->ip_address;
	}

	/**
	 * Get the email subject.
	 *
	 * @return string
	 */
	public function get_subject() {
		return $this->subject;
	}

	/**
	 * Gets the value of the consent field.
	 *
	 * @return bool
	 */
	public function has_consent() {
		return $this->has_consent;
	}

	/**
	 * Gets the value of the consent field.
	 *
	 * @return bool
	 */
	public function has_file() {
		return $this->has_file;
	}

	/**
	 * Get the uploaded files from the feedback entry.
	 *
	 * @return array
	 */
	public function get_files() {
		$files = array();
		foreach ( $this->fields as $field ) {
			if ( $field->get_type() === 'file' ) {
				$field_value = $field->get_value();
				if ( ! empty( $field_value['files'] ) && is_array( $field_value['files'] ) ) {
					$field_value['files'] = array_filter(
						$field_value['files'],
						function ( $file ) {
							if ( empty( $file['file_id'] ) ) {
								return false;
							}
							if ( empty( $file['name'] ) ) {
								return false;
							}
							if ( empty( $file['size'] ) ) {
								return false;
							}
							if ( empty( $file['type'] ) ) {
								return false;
							}
							return true;
						}
					);

					$files = array_merge( $files, $field_value['files'] );
				}
			}
		}
		return $files;
	}

	/**
	 * Get the feedback status. For example 'publish', 'spam' or 'trash'.
	 *
	 * @return string
	 */
	public function get_status() {
		return $this->status;
	}

	/**
	 * Sets the status of the feedback.
	 *
	 * @param string $status The status to set for the feedback entry.
	 * @return void
	 */
	public function set_status( $status ) {
		$this->status = $status;
	}

	/**
	 * Get the entry ID of the post that the feedback was submitted from.
	 *
	 * This is the post ID of the post or page that the feedback was submitted from.
	 *
	 * @return int|null
	 */
	public function get_entry_id() {
		return $this->source->get_id();
	}

	/**
	 * Get the entry title of the post that the feedback was submitted from.
	 *
	 * This is the title of the post or page that the feedback was submitted from.
	 *
	 * @return string
	 */
	public function get_entry_title() {
		return $this->source->get_title();
	}

	/**
	 * Get the permalink of the post or page that the feedback was submitted from.
	 * This includes the page number if the feedback was submitted from a paginated form.
	 *
	 * @return string
	 */
	public function get_entry_permalink() {
		return $this->source->get_permalink();
	}
	/**
	 * Get the short permalink of a post.
	 *
	 * @return string
	 */
	public function get_entry_short_permalink() {
		return $this->source->get_relative_permalink();
	}
	/**
	 * Save the feedback entry to the database.
	 *
	 * @return int
	 */
	public function save() {
		$post_id = wp_insert_post(
			array(
				'post_type'      => self::POST_TYPE,
				'post_status'    => $this->status,
				'post_title'     => $this->legacy_feedback_title,
				'post_date'      => $this->feedback_time,
				'post_name'      => $this->legacy_feedback_id,
				'post_content'   => $this->serialize(), // In V3 we started to addslashes.
				'post_mime_type' => 'v3', // a way to help us identify what version of the data this is.
				'post_parent'    => $this->source->get_id(),
			)
		);

		$feedback_post = get_post( $post_id );
		return $feedback_post ?? 0;
	}

	/**
	 * Serialize the fields to JSON format.
	 *
	 * @return string
	 */
	public function serialize() {

		$fields_to_serialize = array_merge(
			array(
				'subject' => $this->subject,
				'ip'      => $this->ip_address,
			),
			$this->source->serialize()
		);

		$fields_to_serialize['fields'] = array();
		foreach ( $this->fields as $field ) {
			$fields_to_serialize['fields'][] = $field->serialize();
		}

		// Check if the IP should be included.
		if ( apply_filters( 'jetpack_contact_form_forget_ip_address', false, $this->ip_address ) ) {
			$fields_to_serialize['ip'] = null;
		}

		return addslashes( wp_json_encode( $fields_to_serialize ) );
	}

	/**
	 * Helper function to parse the post content.
	 *
	 * @param string      $post_content The post content to parse.
	 * @param string|null $version The version of the content format.
	 * @return array Parsed fields.
	 */
	private function parse_content( $post_content = '', $version = null ) {
		if ( $version === 'v3' ) {
			return $this->parse_content_v3( $post_content );
		}
		if ( $version === 'v2' ) {
			return $this->parse_content_v2( $post_content );
		}
		return $this->parse_legacy_content( $post_content );
	}

	/**
	 * Parse the content in the v2 format.
	 *
	 * V2 Format was a short lived format that accidently contains slash escaped unicode characters.
	 *
	 * @param string $post_content The post content to parse.
	 *
	 * @return array Parsed fields.
	 */
	private function parse_content_v2( $post_content = '' ) {
		$decoded_content = json_decode( $post_content, true );
		if ( $decoded_content === null ) {
			// If JSON decoding still fails, try with stripslashes and trim as a fallback
			// This is a workaround for some cases where the JSON data is not properly formatted
			$decoded_content = json_decode( stripslashes( trim( $post_content ) ), true );
		}

		if ( $decoded_content === null ) {
			// Final fallback: attempt to fix malformed JSON with unescaped quotes
			// Apply stripslashes first, then fix remaining issues
			$stripped_content = stripslashes( trim( $post_content ) );
			$fixed_content    = self::fix_malformed_json( $stripped_content );
			$decoded_content  = json_decode( $fixed_content, true );
		}

		if ( $decoded_content === null ) {
			return array();
		}
		$fields = array();
		foreach ( $decoded_content['fields'] as $field ) {
			$feedback_field = Feedback_Field::from_serialized_v2( $field );
			if ( $feedback_field instanceof Feedback_Field ) {
				$fields[ $feedback_field->get_key() ] = $feedback_field;
				if ( ! $this->has_file && $feedback_field->has_file() ) {
					$this->has_file = true;
				}
			}
		}
		$decoded_content['fields'] = $fields;
		return $decoded_content;
	}

	/**
	 * Parse the content in the v3 format.
	 *
	 * @param string $post_content The post content to parse.
	 *
	 * @return array Parsed fields.
	 */
	private function parse_content_v3( $post_content = '' ) {
		$decoded_content = json_decode( $post_content, true );
		if ( $decoded_content === null ) {
			// If JSON decoding fails, try to decode the second try with stripslashes and trim.
			// This is a workaround for some cases where the JSON data is not properly formatted.
			$decoded_content = json_decode( stripslashes( trim( $post_content ) ), true );
		}
		if ( $decoded_content === null ) {
			return array();
		}
		$fields = array();
		foreach ( $decoded_content['fields'] as $field ) {
			$feedback_field = Feedback_Field::from_serialized( $field );
			if ( $feedback_field instanceof Feedback_Field ) {
				$fields[ $feedback_field->get_key() ] = $feedback_field;
				if ( ! $this->has_file && $feedback_field->has_file() ) {
					$this->has_file = true;
				}
			}
		}
		$decoded_content['fields'] = $fields;
		return $decoded_content;
	}

	/**
	 * Parse the legacy content format.
	 *
	 * @param string $post_content The post content to parse.
	 *
	 * @return array Parsed fields.
	 */
	private function parse_legacy_content( $post_content = '' ) {
		$content_parts   = $this->split_legacy_content( $post_content );
		$comment_content = $content_parts['comment_content'];
		$field_content   = $content_parts['field_content'];

		$all_values = $this->extract_legacy_values( $field_content );
		$lines      = $this->extract_legacy_lines( $field_content );

		$decoded_fields           = array();
		$decoded_fields['fields'] = array();

		// Process lines for specific field types
		$this->process_legacy_lines( $lines, $decoded_fields );

		// Process all other values
		$this->process_legacy_values( $all_values, $decoded_fields );

		// Add comment content field
		$this->add_comment_content_field( $comment_content, $decoded_fields );

		return $decoded_fields;
	}

	/**
	 * Attempt to fix malformed JSON by escaping unescaped quotes in string values.
	 *
	 * This method handles cases where JSON contains unescaped quotes within string values,
	 * which causes json_decode to fail.
	 *
	 * @param string $json malformed JSON string.
	 * @return string The JSON string with escaped quotes.
	 */
	public static function fix_malformed_json( $json ) {

		$find    = array();
		$replace = array();

		// Start of JSON object
		$find[]    = '{\"';
		$replace[] = '{"';

		// Key-value separator
		$find[]    = '\":\"';
		$replace[] = '":"';

		$find[]    = '\\\"';
		$replace[] = '\"';

		$find[]    = '\":[\"';
		$replace[] = '":["';

		$find[]    = '\"],';
		$replace[] = '"],';

		$find[]    = ',[\"';
		$replace[] = ',["';

		$find[]    = '\",\"';
		$replace[] = '","';

		$find[]    = ',\"';
		$replace[] = ',"';

		$find[]    = '\", \"';
		$replace[] = '", "';

		$find[]    = '\"],\"';
		$replace[] = '"],"';

		$find[]    = '\"],"';
		$replace[] = '"],"';

		$find[]    = '\":[]';
		$replace[] = '":[]';

		$find[]    = '\"]}';
		$replace[] = '"]}';

		$find[]    = '\":[';
		$replace[] = '":[';

		$find[]    = '\":{';
		$replace[] = '":{';

		$find[]    = '\":true';
		$replace[] = '":true';

		$find[]    = '\":false';
		$replace[] = '":false';

		$find[]    = '\":null';
		$replace[] = '":null';

		for ( $i = 0; $i <= 9; $i++ ) {
			$find[]    = '\":' . $i;
			$replace[] = '":' . $i;

			$find[]    = '\",' . $i;
			$replace[] = '",' . $i;
		}

		$find[]    = '\",true';
		$replace[] = '",true';

		$find[]    = '\",false';
		$replace[] = '",false';

		$find[]    = '\",null';
		$replace[] = '",null';

		$find[]    = "\'";
		$replace[] = "'";

		// End of Json object
		$find[]    = '\"}';
		$replace[] = '"}';

		// Remove any slashes that are there to start a new string.
		return str_replace( $find, $replace, addslashes( $json ) );
	}

	/**
	 * Split legacy content into comment and field sections.
	 *
	 * @param string $post_content The post content to parse.
	 * @return array Array with 'comment_content' and 'field_content' keys.
	 */
	private function split_legacy_content( $post_content ) {
		$content         = explode( '<!--more-->', $post_content );
		$comment_content = '';
		$field_content   = '';

		if ( count( $content ) > 1 ) {
			$comment_content = $content[0];
			$field_content   = str_ireplace( array( '<br />', ')</p>' ), '', $content[1] );
		}

		return array(
			'comment_content' => $comment_content,
			'field_content'   => $field_content,
		);
	}

	/**
	 * Extract values from legacy field content.
	 *
	 * @param string $field_content The field content to parse.
	 * @return array Extracted values.
	 */
	private function extract_legacy_values( $field_content ) {
		$all_values = array();

		if ( str_contains( $field_content, 'JSON_DATA' ) ) {
			$all_values = $this->parse_json_data( $field_content );
		} else {
			$all_values = $this->parse_array_format( $field_content );
		}

		// Ensure all_values is always an array
		if ( ! is_array( $all_values ) ) {
			$all_values = array();
		}

		return $all_values;
	}

	/**
	 * Extract lines from legacy field content.
	 *
	 * @param string $field_content The field content to parse.
	 * @return array Filtered lines.
	 */
	private function extract_legacy_lines( $field_content ) {
		if ( str_contains( $field_content, 'JSON_DATA' ) ) {
			$chunks = explode( "\nJSON_DATA", $field_content );
			return array_filter( explode( "\n", $chunks[0] ) );
		} else {
			return array_filter( explode( "\n", $field_content ) );
		}
	}

	/**
	 * Parse JSON data from field content.
	 *
	 * @param string $field_content The field content containing JSON data.
	 * @return array Parsed JSON data.
	 */
	private function parse_json_data( $field_content ) {
		$chunks = explode( "\nJSON_DATA", $field_content );

		if ( ! isset( $chunks[1] ) ) {
			// Try with 'JSON_DATA' without the newline as a fallback.
			$chunks = explode( 'JSON_DATA', $field_content );
			if ( ! isset( $chunks[1] ) ) {
				// If JSON_DATA is still not found, return an empty array.
				return array();
			}
		}

		$json_data = $chunks[1];

		$all_values = json_decode( $json_data, true );

		if ( $all_values === null ) {
			// Fallback for improperly formatted JSON
			$all_values = json_decode( stripslashes( trim( $json_data ) ), true );
		}

		return $all_values === null ? array() : $all_values;
	}

	/**
	 * Parse array format from field content.
	 *
	 * @param string $field_content The field content in array format.
	 * @return array Parsed array data.
	 */
	private function parse_array_format( $field_content ) {
		$fields_array = preg_replace( '/.*Array\s\( (.*)\)/msx', '$1', $field_content );

		// Parse key-value pairs formatted as [Key] => Value
		preg_match_all( '/^\s*\[([^\]]+)\] =\&gt\; (.*)(?=^\s*(\[[^\]]+\] =\&gt\;)|\z)/msU', $fields_array, $matches );

		if ( count( $matches ) > 1 ) {
			return array_combine( array_map( 'trim', $matches[1] ), array_map( 'trim', $matches[2] ) );
		}

		return array();
	}

	/**
	 * Process legacy lines into field objects.
	 *
	 * We do this so that we can extract specific fields but we don't display the values in the UI.
	 *
	 * @param array $lines The lines to process.
	 * @param array &$decoded_fields Reference to the decoded fields array.
	 */
	private function process_legacy_lines( $lines, &$decoded_fields ) {
		$var_map = array(
			'AUTHOR'       => array(
				'type'  => 'name',
				'label' => 'Author',
			),
			'AUTHOR EMAIL' => array(
				'type'  => 'email',
				'label' => 'Email',
			),
			'AUTHOR URL'   => array(
				'type'  => 'url',
				'label' => 'Url',
			),
			'SUBJECT'      => array(
				'type'  => 'subject',
				'label' => 'Subject',
			),
			'IP'           => array(
				'type'  => 'ip',
				'label' => 'IP',
			),
		);

		foreach ( $lines as $line ) {
			$line_parts = explode( ': ', $line, 2 );

			if ( count( $line_parts ) !== 2 ) {
				continue;
			}

			list( $key, $value ) = $line_parts;

			if ( ! empty( $key ) && isset( $var_map[ $key ] ) ) {
				$map_to_field = $var_map[ $key ];
				$value        = Contact_Form_Plugin::strip_tags( trim( $value ) );

				$decoded_fields['fields'][ $key ] = new Feedback_Field(
					$key,
					$map_to_field['label'],
					$value,
					$map_to_field['type'],
					array( 'render' => false )
				);
			}
		}
	}

	/**
	 * Check if the field is a legacy file upload.
	 *
	 * @param array $field The field to check.
	 *
	 * @return bool True if it's a legacy file upload, false otherwise.
	 */
	private function is_legacy_file_upload( $field ) {
		return (
			is_array( $field ) &&
			! empty( $field['field_id'] ) &&
			isset( $field['files'] ) &&
			is_array( $field['files'] )
		);
	}

	/**
	 * Process legacy values into field objects.
	 *
	 * @param array $all_values The values to process.
	 * @param array &$decoded_fields Reference to the decoded fields array.
	 */
	private function process_legacy_values( $all_values, &$decoded_fields ) {
		$non_user_fields = array(
			'email_marketing_consent',
			'entry_title',
			'entry_permalink',
			'entry_page',
			'feedback_id',
		);

		foreach ( $all_values as $key => $value ) {
			$key   = wp_strip_all_tags( $key );
			$label = self::extract_label_from_key( $key );

			if ( in_array( $key, $non_user_fields, true ) ) {
				if ( $key === 'email_marketing_consent' ) {
					$decoded_fields['fields'][ $key ] = new Feedback_Field(
						$key,
						$label,
						$value,
						'consent',
						array( 'render' => false )
					);
					continue;
				}
				$decoded_fields[ $key ] = $value;
				continue;
			}

			// check for file upload data and then set it as a file type field.
			if ( $this->is_legacy_file_upload( $value ) ) {
				// If the value is a file upload, we need to handle it differently.
				$decoded_fields['fields'][ $key ] = new Feedback_Field(
					$key,
					$label,
					$value,
					'file'
				);
				$this->has_file                   = ! empty( $value['files'] ); // Set has_file to true if any file upload is found.
			} else {
				$decoded_fields['fields'][ $key ] = new Feedback_Field( $key, $label, $value );
			}
		}
	}

	/**
	 * Add comment content as a field.
	 *
	 * @param string $comment_content The comment content.
	 * @param array  &$decoded_fields Reference to the decoded fields array.
	 */
	private function add_comment_content_field( $comment_content, &$decoded_fields ) {
		$decoded_fields['fields']['comment_content'] = new Feedback_Field(
			'comment_content',
			'Comment Content',
			trim( Contact_Form_Plugin::strip_tags( $comment_content ) ),
			'textarea',
			array( 'render' => false )
		);
	}

	/**
	 * Extract the label from a key that might be in the format "1_label".
	 *
	 * @param string $key The key to extract the label from.
	 * @return string The extracted label.
	 */
	private static function extract_label_from_key( $key ) {
		// Check if the key starts with a number followed by underscore and has content after underscore
		if ( preg_match( '/^\d+_(.+)$/', $key, $matches ) ) {
			return $matches[1];
		}
		// If the key is just a number followed by underscore (like "2_"), return empty string
		if ( preg_match( '/^\d+_$/', $key ) ) {
			return '';
		}
		// If the key doesn't start with a number followed by underscore, return the key as is
		return $key;
	}

	/**
	 * Get all the fields of the response, computed from the post data.
	 *
	 * @param array        $post_data The post data from the form submission.
	 * @param Contact_Form $form The form object.
	 * @return array An array of Feedback_Field objects.
	 */
	private function get_computed_fields( $post_data, $form ) {

		$fields = array();

		$field_ids = $form->get_field_ids();
		// For all fields, grab label and value
		$i = 1;
		foreach ( $field_ids['all'] as $field_id ) {
			$field = $form->fields[ $field_id ];
			$type  = $field->get_attribute( 'type' );
			if ( ! $field->is_field_renderable( $type ) ) {
				continue;
			}

			$value = $this->get_field_value( $field_id, $post_data, $type );
			$label = wp_strip_all_tags( $field->get_attribute( 'label' ) );
			$key   = $i . '_' . $label;

			$meta           = array();
			$fields[ $key ] = new Feedback_Field( $key, $label, $value, $type, $meta, $field_id );
			if ( ! $this->has_file && $fields[ $key ]->has_file() ) {
				$this->has_file = true;
			}
			++$i; // Increment prefix counter for the next field.
		}

		return $fields;
	}

	/**
	 * Gets the computed subject.
	 *
	 * @param array        $post_data The post data from the form submission.
	 * @param Contact_Form $form The form object.
	 * @return string
	 */
	private function get_computed_subject( $post_data, $form ) {

		$contact_form_subject = $form->get_attribute( 'subject' );
		$field_ids            = $form->get_field_ids();

		if ( isset( $field_ids['subject'] ) ) {
			$value = $this->get_field_value( $field_ids['subject'], $post_data );
			if ( ! empty( $value ) ) {
				$contact_form_subject = $value;
			}
		}

		return apply_filters( 'contact_form_subject', $contact_form_subject, $this->get_all_values() );
	}

	/**
	 * Gets the computed comment content.
	 *
	 * @param array        $post_data The post data from the form submission.
	 * @param Contact_Form $form The form object.
	 * @return string
	 */
	private function get_computed_comment_content( $post_data, $form ) {
		$field_ids = $form->get_field_ids();
		if ( isset( $field_ids['textarea'] ) ) {
			$value = $this->get_field_value( $field_ids['textarea'], $post_data );
			if ( is_string( $value ) ) {
				return trim( Contact_Form_Plugin::strip_tags( stripslashes( $value ) ) );
			}
		}
		return '';
	}

	/**
	 * Gets the computed consent.
	 *
	 * @param array        $post_data The post data from the form submission.
	 * @param Contact_Form $form The form object.
	 * @return bool
	 */
	private function get_computed_consent( $post_data, $form ) {
		$field_ids = $form->get_field_ids();

		if ( isset( $field_ids['email_marketing_consent_field'] ) && $field_ids['email_marketing_consent_field'] !== null ) {
			return (bool) $this->get_field_value( $field_ids['email_marketing_consent_field'], $post_data );
		}

		return false;
	}

	/**
	 * Get a field by its original form ID.
	 *
	 * @since 5.5.0
	 *
	 * @param string $id Original form field ID.
	 * @return Feedback_Field|null
	 */
	public function get_field_by_form_field_id( $id ) {
		if ( ! is_string( $id ) || $id === '' ) {
			return null;
		}
		foreach ( $this->fields as $field ) {
			if ( $field->get_form_field_id() === $id ) {
				return $field;
			}
		}
		return null;
	}

	/**
	 * Get a field render value by its original form ID.
	 *
	 * @since 5.5.0
	 *
	 * @param string $id Original form field ID.
	 * @param string $context Render context.
	 * @return string
	 */
	public function get_field_value_by_form_field_id( $id, $context = 'default' ) {
		$field = $this->get_field_by_form_field_id( $id );
		if ( ! $field ) {
			return '';
		}
		return (string) $field->get_render_value( $context );
	}
}
