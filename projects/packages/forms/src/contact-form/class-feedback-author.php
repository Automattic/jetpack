<?php
/**
 * Feedback class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

/**
 * Class Feedback_Author
 *
 * Represents the author of a feedback entry, including their name, email, and URL.
 */
class Feedback_Author {

	/**
	 * The name of the author.
	 *
	 * @var string
	 */
	private $name;

	/**
	 * The email of the author.
	 *
	 * @var string
	 */
	private $email;

	/**
	 * The url of the author.
	 *
	 * @var string
	 */
	private $url;

	/**
	 * Constructor for Feedback_Author.
	 *
	 * @param string $name  The name of the author.
	 * @param string $email The email of the author.
	 * @param string $url   The URL of the author.
	 */
	public function __construct( $name = '', $email = '', $url = '' ) {
		$this->name  = $name;
		$this->email = $email;
		$this->url   = $url;
	}

	/**
	 * Compute author name from either submission data (array + form) or stored fields (Feedback).
	 *
	 * Rules:
	 * - If First/Last name fields exist (by known ids), return "First Last" trimmed.
	 * - Otherwise, return the single Name field value.
	 * - Applies the pre_comment_author_name filter and standard sanitization.
	 *
	 * @param Feedback|array    $source Submission array or Feedback instance.
	 * @param Contact_Form|null $form The form object (required when $source is submission array).
	 * @return string Filtered display name.
	 */
	public static function get_computed_author_name( $source, $form = null ) {
		$is_from_feedback_object = is_object( $source ) && $source instanceof Feedback;
		$final_name              = '';

		if ( $is_from_feedback_object ) {
			$first_name  = $source->get_field_value_by_form_field_id( 'first-name' );
			$last_name   = $source->get_field_value_by_form_field_id( 'last-name' );
			$full_name   = trim( $first_name . ' ' . $last_name );
			$single_name = '';
			if ( method_exists( $source, 'get_fields' ) ) {
				foreach ( $source->get_fields() as $field ) {
					if ( method_exists( $field, 'get_type' ) && $field->get_type() === 'name' ) {
						$single_name = $field->get_render_value();
						break;
					}
				}
			}

			// Return the full name if it exists, otherwise return the single name.
			$final_name = $full_name ? $full_name : $single_name;
		} elseif ( is_array( $source ) ) {
			$first_name = isset( $source['first-name'] ) ? wp_unslash( $source['first-name'] ) : '';
			$last_name  = isset( $source['last-name'] ) ? wp_unslash( $source['last-name'] ) : '';
			$full_name  = trim( $first_name . ' ' . $last_name );

			$single_name = '';
			if ( $form && method_exists( $form, 'get_field_ids' ) ) {
				$field_ids = $form->get_field_ids();
				if ( isset( $field_ids['name'] ) && isset( $source[ $field_ids['name'] ] ) ) {
					$single_name = wp_unslash( $source[ $field_ids['name'] ] );
				}
			}

			// Return the full name if it exists, otherwise return the single name.
			$final_name = $full_name ? $full_name : $single_name;
		}

		// Apply standard filtering/sanitization used for author names.
		return Contact_Form_Plugin::strip_tags(
			stripslashes(
				/** This filter is already documented in core/wp-includes/comment-functions.php */
				apply_filters( 'pre_comment_author_name', addslashes( $final_name ) )
			)
		);
	}

	/**
	 * Create a Feedback_Author instance from the submission data.
	 *
	 * @param array        $post_data The post data from the form submission.
	 * @param Contact_Form $form      The form object.
	 * @return Feedback_Author The Feedback_Author instance.
	 */
	public static function from_submission( $post_data, $form ) {
		return new self(
			self::get_computed_author_info( $post_data, 'name', 'pre_comment_author_name', $form ),
			self::get_computed_author_info( $post_data, 'email', 'pre_comment_author_email', $form ),
			self::get_computed_author_info( $post_data, 'url', 'pre_comment_author_url', $form )
		);
	}

	/**
	 * Gets the computed author.
	 *
	 * @param array        $post_data The post data from the form submission.
	 * @param string       $type The type of author information to retrieve (e.g., 'name', 'email', 'url').
	 * @param string       $filter Optional filter to apply to the value.
	 * @param Contact_Form $form The form object.
	 *
	 * @return string Filter value for the author information.
	 */
	private static function get_computed_author_info( $post_data, $type, $filter, $form ) {
		// Handle name specially to support First/Last variations.
		if ( $type === 'name' ) {
			return self::get_computed_author_name( $post_data, $form );
		}
		$field_ids = $form->get_field_ids();
		if ( isset( $field_ids[ $type ] ) ) {
			$key   = $field_ids[ $type ];
			$value = isset( $post_data[ $key ] ) ? sanitize_text_field( wp_unslash( $post_data[ $key ] ) ) : '';
			if ( is_string( $value ) ) {
				return Contact_Form_Plugin::strip_tags(
					stripslashes(
						/**
						 *
						 * Listed to help search find the filters.
						 * apply_filters( ''pre_comment_author_name', $value )
						 * apply_filters( ''pre_comment_author_email', $value )
						 * apply_filters( ''pre_comment_author_url', $value )
						*/
						apply_filters( $filter, addslashes( $value ) )
					)
				);

			}
		}
		return '';
	}

	/**
	 * Get the display name of the author.
	 *
	 * If the name is not set, it will return the email.
	 *
	 * @return string The display name of the author.
	 */
	public function get_display_name(): string {
		return empty( $this->name ) ? $this->email : $this->name;
	}

	/**
	 * Get the avatar URL of the author.
	 *
	 * If the email is not set, it will return an empty string.
	 *
	 * @return string The avatar URL of the author.
	 */
	public function get_avatar_url(): string {
		return ! empty( $this->email ) ? get_avatar_url( $this->email ) : '';
	}

	/**
	 * Get the name of the author.
	 *
	 * @return string The name of the author.
	 */
	public function get_name() {
		return $this->name;
	}

	/**
	 * Get the email of the author.
	 *
	 * @return string The email of the author.
	 */
	public function get_email() {
		return $this->email;
	}

	/**
	 * Get the URL of the author.
	 *
	 * @return string The URL of the author.
	 */
	public function get_url() {
		return $this->url;
	}
}
