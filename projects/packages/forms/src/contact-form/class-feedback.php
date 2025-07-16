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
	 * Does the response have files attached to it?
	 *
	 * @var bool
	 */
	protected $has_file = false;

	/**
	 * The current post object, if available.
	 *
	 * Usallyt this is accostied with the global $post object.
	 *
	 * @var WP_Post|null
	 */
	protected $current_post;

	/**
	 * The current page number associated with the feedback entry.
	 *
	 * This is used to track the page number of the form that the feedback was submitted from.
	 *
	 * Usally this is accosited with the global $page number varieble.
	 *
	 * @var int
	 */
	protected $current_page_number = 1;

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
	 * @todo: figure out how this is used if at all.
	 *
	 * @var string
	 */
	protected $feedback_id = '';

	/**
	 * The title of the feedback entry.
	 *
	 * This is used to store the title of the feedback entry.
	 *
	 * @var string
	 */
	protected $feedback_title = '';

	/**
	 * The time of the feedback entry.
	 *
	 * This is used to store the title of the feedback entry.
	 *
	 * @var string
	 */
	protected $feedback_time = '';

	/**
	 * The author of the feedback entry.
	 *
	 * @var string
	 */
	protected $author = '';

	/**
	 * The author email of the feedback entry.
	 *
	 * @var string
	 */
	protected $author_email = '';

	/**
	 * The author url of the feedback entry.
	 *
	 * @var string
	 */
	protected $author_url = '';

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
	 * @var Feedback_Entry
	 */
	protected $entry;

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

		$instance = new self();
		$instance->load_from_post( $feedback_post );
		return $instance;
	}

	/**
	 * Create a Feedback object from a feedback post.
	 *
	 * @param WP_Post $feedback_post The feedback post object.
	 */
	private function load_from_post( WP_Post $feedback_post ) {

		$parsed_content = $this->parse_content( $feedback_post->post_content, $feedback_post->post_mime_type );

		$this->status        = $feedback_post->post_status;
		$this->feedback_id   = $feedback_post->post_name;
		$this->feedback_time = $feedback_post->post_date;

		$this->entry = new Feedback_Entry(
			$feedback_post->post_parent,
			$parsed_content['entry_title'] ?? '',
			$parsed_content['entry_page'] ?? 1
		);

		$this->fields          = isset( $parsed_content['fields'] ) ? $parsed_content['fields'] : array();
		$this->ip_address      = isset( $parsed_content['ip'] ) ? $parsed_content['ip'] : $this->get_first_field_of_type( 'ip' );
		$this->subject         = isset( $parsed_content['subject'] ) ? $parsed_content['subject'] : $this->get_first_field_of_type( 'subject' );
		$this->author          = $this->get_first_field_of_type( 'name', 'pre_comment_author_name' );
		$this->author_email    = $this->get_first_field_of_type( 'email', 'pre_comment_author_email' );
		$this->author_url      = $this->get_first_field_of_type( 'url', 'pre_comment_author_url' );
		$this->comment_content = $this->get_first_field_of_type( 'textarea' );
		$this->has_consent     = $this->get_first_field_of_type( 'consent' ) === 'Yes' ? true : false;

		$this->feedback_title = $feedback_post->post_title ? $feedback_post->post_title : $this->get_author() . ' - ' . $feedback_post->post_date;
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
	 * @param array        $post_data The $_POST recieved during the form submission.
	 * @param Contact_Form $form  The form object.
	 * @param WP_Post|null $current_post The current post object, if available.
	 * @param int          $current_page_number The current page number associated with the current post object entry.
	 */
	private function load_from_submission( $post_data, $form, $current_post = null, $current_page_number = 1 ) {

		$this->entry = Feedback_Entry::from_submission( $current_post, $current_page_number );
		// If post_data is provided, use it to populate fields.
		$this->status          = $this->status;
		$this->fields          = $this->get_computed_fields( $post_data, $form );
		$this->ip_address      = Contact_Form_Plugin::get_ip_address();
		$this->subject         = $this->get_computed_subject( $post_data, $form );
		$this->author          = $this->get_computer_author_info( $post_data, 'name', 'pre_comment_author_name', $form );
		$this->author_email    = $this->get_computer_author_info( $post_data, 'email', 'pre_comment_author_email', $form );
		$this->author_url      = $this->get_computer_author_info( $post_data, 'url', 'pre_comment_author_url', $form );
		$this->comment_content = $this->get_computed_comment_content( $post_data, $form );
		$this->has_consent     = $this->get_computed_consent( $post_data, $form );

		$this->feedback_time  = current_time( 'mysql' );
		$this->feedback_title = "{$this->get_author()} - {$this->feedback_time}";
		$this->feedback_id    = md5( $this->feedback_title );
	}

	/**
	 * Get a sanitized value from the post data.
	 *
	 * @param string $key The key to look for in the post data.
	 * @param array  $post_data The post data array, typically $_POST.
	 *
	 * @return string|array The sanitized value, or an empty string if the key is not found.
	 */
	private function get_field_value( $key, $post_data ) {
		if ( isset( $post_data[ $key ] ) ) {
			if ( is_array( $post_data[ $key ] ) ) {
				return array_map( 'sanitize_text_field', wp_unslash( $post_data[ $key ] ) );
			} else {
				return sanitize_text_field( wp_unslash( $post_data[ $key ] ) );
			}
		}
		return '';
	}

	/**
	 * Get the computed fields from the post data.
	 *
	 * @param string $label The label of the field to look for.
	 *
	 * @return string The Value of the field.
	 */
	public function get_field_value_by_label( $label ) {
		// This method is used to get the value of a field by its label.
		foreach ( $this->fields as $field ) {
			if ( $field->get_label() === $label ) {
				return $field->get_render_value();
			}
		}
		return '';
	}
	/**
	 * Get the value of the field based on the first type found.
	 *
	 * @param string      $type The type of the field to look for.
	 * @param string|null $filter Optional filter to apply to the value.
	 *
	 * @return string The value of the first field of the specified type, or an empty string if not found.
	 */
	private function get_first_field_of_type( $type, $filter = null ) {
		// This method is used to get the first field of a specific type.
		foreach ( $this->fields as $field ) {
			if ( $field->get_type() === $type ) {
				if ( $filter ) {
					return self::strip_tags(
						stripslashes(
							/** This filter is already documented in core/wp-includes/comment-functions.php */
							\apply_filters( $filter, addslashes( $field->get_render_value() ) )
						)
					);
				}
				return $field->get_render_value();
			}
		}
		return null;
	}

	/**
	 * Get all the fields of the response.
	 */
	public function get_fields() {
		return $this->fields;
	}

	/**
	 * Get all the values of the response.
	 *
	 * This is a convenience method to get all values in a simple array format.
	 *
	 * This is done for backwards compatibility. Use `get_fields()` instead.
	 *
	 * @return array
	 */
	private function get_all_values() {
		$values = array();
		foreach ( $this->fields as $field ) {
			if ( $field->get_meta_key_value( 'render' ) === false ) {
				continue; // Skip fields that are not meant to be rendered.
			}
			$values[ $field->get_key() ] = $field->get_render_value();
		}
		return $values;
	}

	/**
	 * Get the field name for the CSV export.
	 *
	 * @return array An array of field names.
	 */
	public function get_csv_field_names() {
		$values = array();
		foreach ( $this->fields as $field ) {
			if ( $field->get_meta_key_value( 'render' ) === false ) {
				continue; // Skip fields that are not meant to be rendered.
			}
			$values[] = $field->get_label();
		}
		return $values;
	}

	/**
	 * Get the values related to where the form was submitted from.
	 *
	 * @return $array
	 */
	private function get_entry_values() {
		// This is a convenience method to get the entry values in a simple array format.
		$entry_values = array(
			'email_marketing_consent' => (string) $this->has_consent,
			'entry_title'             => $this->entry->get_title(),
			'entry_permalink'         => $this->entry->get_permalink(),
			'feedback_id'             => $this->feedback_id,
		);

		if ( $this->entry->get_page_number() > 1 ) {
			$entry_values['entry_page'] = $this->entry->get_page_number();
		}
		return $entry_values;
	}

	/**
	 * Get all values of the response.
	 *
	 * @return array
	 */
	public function get_old_all_values() {
		// This is a legacy method to maintain compatibility with older code.
		// It returns the same values as get_all_values() but is kept for backward compatibility.
		return array_merge( $this->get_all_values(), $this->get_entry_values() );
	}

	/**
	 * Get the field values for the API Response.
	 *
	 * @return array
	 */
	public function get_api_fields_values() {
		// This is a legacy method to maintain compatibility with older code.
		// It returns the same values as get_all_values() but is kept for backward compatibility.
		return array_merge( $this->get_api_all_values() );
	}

	/**
	 * Get the computed fields
	 *
	 * Computed fields is an array of fields that have a label and a value.
	 *
	 * @return array
	 */
	public function get_compiled_fields() {
		$compiled_fields = array();
		foreach ( $this->fields as $field ) {
			if ( $field->get_meta_key_value( 'render' ) === false ) {
				continue; // Skip fields that are not meant to be rendered.
			}
			$compiled_fields[ $field->get_key() ] = array(
				'label' => $field->get_label(),
				'value' => $field->get_render_value(),
			);
		}
		return $compiled_fields;
	}

	/**
	 * Get all the values of the response for API.
	 */
	private function get_api_all_values() {
		$values = array();
		foreach ( $this->fields as $field ) {
			if ( $field->get_meta_key_value( 'render' ) === false ) {
				continue; // Skip fields that are not meant to be rendered.
			}
			$values[ $field->get_key() ] = $field->get_render_api_value();
		}
		return $values;
	}

	/**
	 * Get the feedback ID of the response.
	 * Which is the same as the post name for feedback entries.
	 * Please note that this is not the same as the feedback post ID.
	 *
	 * @return string
	 */
	public function get_feedback_id() {
		return $this->feedback_id;
	}

	/**
	 * Get the feedback title of the response.
	 *
	 * This is mostly used for legacy reasons.
	 *
	 * @return string
	 */
	public function get_title() {
		return $this->feedback_title;
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
			'comment_author'       => $this->author,
			'comment_author_email' => $this->get_author_email(),
			'comment_author_url'   => $this->get_author_url(),
			'contact_form_subject' => $this->get_subject(),
			'comment_author_ip'    => $this->get_ip_address(),
			'comment_content'      => empty( $this->get_comment_content() ) ? null : $this->get_comment_content(),
		);

		$field_ids = $this->form->get_field_ids();

		foreach ( array_merge( $field_ids['all'], $field_ids['extra'] ) as $field_id ) {
			$field = $this->form->fields[ $field_id ];

			// Skip any fields that are just a choice from a pre-defined list. They wouldn't have any value
			// from a spam-filtering point of view.
			if ( in_array( $field->get_attribute( 'type' ), array( 'select', 'checkbox', 'checkbox-multiple', 'radio', 'file' ), true ) ) {
				continue;
			}

			// Normalize the label into a slug.
			$field_slug = trim( // Strip all leading/trailing dashes.
				preg_replace(   // Normalize everything to a-z0-9_-
					'/[^a-z0-9_]+/',
					'-',
					strtolower( $field->get_attribute( 'label' ) ) // Lowercase
				),
				'-'
			);

			$field_value = ( is_array( $field->value ) ) ? trim( implode( ', ', $field->value ) ) : trim( $field->value );

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
		if ( ! empty( $this->author ) ) {
			return $this->author;
		}
		if ( ! empty( $this->author_email ) ) {
			return $this->author_email;
		}
		return '';
	}

	/**
	 * Get the author email of a feedback entry.
	 *
	 * @return string
	 */
	public function get_author_email() {
		return $this->author_email;
	}

	/**
	 * Get the author's gravatar URL.
	 *
	 * This is a convenience method to get the author's gravatar URL.
	 *
	 * @return string
	 */
	public function get_author_avatar() {
		// This is a convenience method to get the author's gravatar URL.
		if ( ! empty( $this->author_email ) ) {
			return get_avatar_url( $this->author_email );
		}
		return '';
	}

	/**
	 * Get the author url of a feedback entry.
	 *
	 * @return string
	 */
	public function get_author_url() {
		return $this->author_url;
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
		return $this->entry->get_id();
	}

	/**
	 * Get the entry title of the post that the feedback was submitted from.
	 *
	 * This is the title of the post or page that the feedback was submitted from.
	 *
	 * @return string
	 */
	public function get_entry_title() {
		return $this->entry->get_title();
	}

	/**
	 * Get the permalink of the post or page that the feedback was submitted from.
	 * This includes the page number if the feedback was submitted from a paginated form.
	 *
	 * @return string
	 */
	public function get_entry_permalink() {
		return $this->entry->get_permalink();
	}
	/**
	 * Get the short permalink of a post.
	 *
	 * @return string
	 */
	public function get_entry_short_permalink() {
		return $this->entry->get_relative_permalink();
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
				'post_title'     => $this->feedback_title,
				'post_date'      => $this->feedback_time,
				'post_name'      => $this->feedback_id,
				'post_content'   => $this->serialize(),
				'post_mime_type' => 'v2', // a way to help us identify what version of the data this is.
				'post_parent'    => $this->entry->get_id(),
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
			$this->entry->serialize()
		);

		$fields_to_serialize['fields'] = array();
		foreach ( $this->fields as $field ) {
			if ( ! $field instanceof Feedback_Field ) {
				continue;
			}
			$fields_to_serialize['fields'][] = $field->serialize();
		}

		// Check if the IP should be included.
		if ( apply_filters( 'jetpack_contact_form_forget_ip_address', false, $this->ip_address ) ) {
			$fields_to_serialize['ip'] = null;
		}

		return wp_json_encode( $fields_to_serialize );
	}

	/**
	 * Helper function to parse the post content.
	 *
	 * @param string      $post_content The post content to parse.
	 * @param string|null $version The version of the content format.
	 * @return array Parsed fields.
	 */
	private function parse_content( $post_content = '', $version = null ) {
		if ( $version === 'v2' ) {
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
				$fields[ $field['key'] ] = Feedback_Field::from_serialized( $field );
				if ( ! $this->has_file && $fields[ $field['key'] ]->has_file() ) {
					$this->has_file = true;
				}
			}
			$decoded_content['fields'] = $fields;
			return $decoded_content;
		}

		// parse_feedback_content
		$all_values      = array();
		$content         = explode( '<!--more-->', $post_content );
		$lines           = array();
		$comment_content = '';
		if ( count( $content ) > 1 ) {
			$comment_content = $content[0];
			$content         = str_ireplace( array( '<br />', ')</p>' ), '', $content[1] );

			if ( str_contains( $content, 'JSON_DATA' ) ) {
				$chunks = explode( "\nJSON_DATA", $content );

				$all_values = json_decode( $chunks[1], true );

				if ( $all_values === null ) {
					// If JSON decoding fails, try to decode the second try with stripslashes and trim.
					// This is a workaround for some cases where the JSON data is not properly formatted.
					$all_values = json_decode( stripslashes( trim( $chunks[1] ) ), true );
				}
				$lines = array_filter( explode( "\n", $chunks[0] ) );
			} else {
				$fields_array = preg_replace( '/.*Array\s\( (.*)\)/msx', '$1', $content );

				// This line of code is used to parse a string containing key-value pairs formatted as [Key] => Value and extract the keys and values into an array.
				// The regular expression ensures that each key-value pair is correctly identified and captured.
				// Given an input string
				// [Key1] => Value1
				// [Key2] => Value2
				// it  $matches[1]: The keys (e.g., Key1, Key2 ).
				// and $matches[2]: The values (e.g., Value1, Value2 ).
				preg_match_all( '/^\s*\[([^\]]+)\] =\&gt\; (.*)(?=^\s*(\[[^\]]+\] =\&gt\;)|\z)/msU', $fields_array, $matches );

				if ( count( $matches ) > 1 ) {
					$all_values = array_combine( array_map( 'trim', $matches[1] ), array_map( 'trim', $matches[2] ) );
				}

				$lines = array_filter( explode( "\n", $content ) );
			}
		}

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

		$decoded_fields = array();

		foreach ( $lines as $line ) {

			list( $key, $value ) = explode( ': ', $line, 2 );

			if ( ! empty( $key ) ) {
				if ( isset( $var_map[ $key ] ) ) {
					$map_to_field                     = $var_map[ $key ];
					$value                            = self::strip_tags( trim( $value ) );
					$decoded_fields['fields'][ $key ] = new Feedback_Field( $key, $map_to_field['label'], $value, $map_to_field['type'], array( 'render' => false ) );
				}
			}
		}
		// All fields should always be an array, even if empty.
		if ( ! is_array( $all_values ) ) {
			$all_values = array();
		}

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
				$decoded_fields[ $key ] = $value;
				// Skip fields that are not user-submitted.
				continue;
			}
			$decoded_fields['fields'][ $key ] = new Feedback_Field( $key, $label, $value );

			if ( ! $this->has_file && $decoded_fields['fields'][ $key ]->has_file() ) {
				$this->has_file = true;
			}
		}

		$decoded_fields['fields']['comment_content'] = new Feedback_Field(
			'comment_content',
			'Comment Content',
			trim( self::strip_tags( $comment_content ) ),
			'textarea',
			array( 'render' => false )
		);

		return $decoded_fields;
	}

	/**
	 * Extract the label from a key that might be in the format "1_label".
	 *
	 * @param string $key The key to extract the label from.
	 * @return string The extracted label.
	 */
	private static function extract_label_from_key( $key ) {
		// Check if the key starts with a number followed by underscore
		if ( preg_match( '/^\d+_(.+)$/', $key, $matches ) ) {
			return $matches[1];
		}
		// If no number prefix, return the key as is
		return $key;
	}

	/**
	 * Strips HTML tags from input.  Output is NOT HTML safe.
	 *
	 * @param mixed $data_with_tags - data we're stripping HTML tags from.
	 * @return mixed
	 */
	public static function strip_tags( $data_with_tags ) {
		$data_without_tags = array();
		if ( is_array( $data_with_tags ) ) {
			foreach ( $data_with_tags as $index => $value ) {
				if ( is_array( $value ) ) {
					$data_without_tags[ $index ] = self::strip_tags( $value );
					continue;
				}

				$index = sanitize_text_field( (string) $index );
				$value = wp_kses_post( (string) $value );
				$value = str_replace( '&amp;', '&', $value ); // undo damage done by wp_kses_normalize_entities()

				$data_without_tags[ $index ] = $value;
			}
		} else {
			$data_without_tags = wp_kses_post( (string) $data_with_tags );
			$data_without_tags = str_replace( '&amp;', '&', $data_without_tags ); // undo damage done by wp_kses_normalize_entities()
		}

		return $data_without_tags;
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

			$value = $this->get_field_value( $field_id, $post_data );
			$label = wp_strip_all_tags( $field->get_attribute( 'label' ) );
			$key   = $i . '_' . $label;

			$fields[ $key ] = new Feedback_Field( $key, $label, $value, $type );
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
	 * Gets the computed author.
	 *
	 * @param array        $post_data The post data from the form submission.
	 * @param string       $type The type of author information to retrieve (e.g., 'name', 'email', 'url').
	 * @param string|null  $filter Optional filter to apply to the value.
	 * @param Contact_Form $form The form object.
	 * @return string
	 */
	private function get_computer_author_info( $post_data, $type, $filter, $form ) {
		$field_ids = $form->get_field_ids();
		if ( isset( $field_ids[ $type ] ) ) {
			$value = $this->get_field_value( $field_ids[ $type ], $post_data );
			if ( is_string( $value ) ) {
				if ( ! empty( $filter ) ) {
					return self::strip_tags(
						stripslashes(
							/** This filter is already documented in core/wp-includes/comment-functions.php */
							apply_filters( $filter, addslashes( $value ) )
						)
					);
				}
				return self::strip_tags( stripslashes( $value ) );
			}
		}
		return '';
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
				return trim( self::strip_tags( stripslashes( $value ) ) );
			}
		}
		return '';
	}

	/**
	 * Gets the computed consent.
	 *
	 * @param array        $post_data The post data from the form submission.
	 * @param Contact_Form $form The form object.
	 * @return string
	 */
	private function get_computed_consent( $post_data, $form ) {
		$field_ids = $form->get_field_ids();

		if ( isset( $field_ids['email_marketing_consent_field'] ) && $field_ids['email_marketing_consent_field'] !== null ) {
			return (bool) $this->get_field_value( $field_ids['email_marketing_consent_field'], $post_data );
		}

		return false;
	}
}
