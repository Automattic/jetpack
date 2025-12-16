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
	 * The first name of the author.
	 *
	 * @var string
	 */
	private $first_name = '';

	/**
	 * The last name of the author.
	 *
	 * @var string
	 */
	private $last_name = '';

	/**
	 * Constructor for Feedback_Author.
	 *
	 * @param string $name  The name of the author.
	 * @param string $email The email of the author.
	 * @param string $url   The URL of the author.
	 * @param string $first_name The first name of the author.
	 * @param string $last_name  The last name of the author.
	 */
	public function __construct( $name = '', $email = '', $url = '', $first_name = '', $last_name = '' ) {
		$this->name       = $name;
		$this->email      = $email;
		$this->url        = $url;
		$this->first_name = $first_name;
		$this->last_name  = $last_name;
	}

	/**
	 * Create a Feedback_Author instance from the submission data.
	 *
	 * @param array        $post_data The post data from the form submission.
	 * @param Contact_Form $form      The form object.
	 * @return Feedback_Author The Feedback_Author instance.
	 */
	public static function from_submission( $post_data, $form ) {
		$first = isset( $post_data['first-name'] ) ? wp_unslash( $post_data['first-name'] ) : '';
		$last  = isset( $post_data['last-name'] ) ? wp_unslash( $post_data['last-name'] ) : '';
		return new self(
			self::get_computed_author_info( $post_data, 'name', 'pre_comment_author_name', $form ),
			self::get_computed_author_info( $post_data, 'email', 'pre_comment_author_email', $form ),
			self::get_computed_author_info( $post_data, 'url', 'pre_comment_author_url', $form ),
			$first,
			$last
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
		$name = $this->get_name();
		return empty( $name ) ? $this->email : $name;
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
		if ( $this->first_name && $this->last_name ) {
			$raw = trim( $this->first_name . ' ' . $this->last_name );
			return Contact_Form_Plugin::strip_tags(
				stripslashes(
					/** This filter is already documented in core/wp-includes/comment-functions.php */
					apply_filters( 'pre_comment_author_name', addslashes( $raw ) )
				)
			);
		}
		// This name value is filtered upstream when class is instantiated.
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

	/**
	 * Get the first name of the author (if provided separately).
	 *
	 * @return string
	 */
	public function get_first_name() {
		return $this->first_name;
	}

	/**
	 * Get the last name of the author (if provided separately).
	 *
	 * @return string
	 */
	public function get_last_name() {
		return $this->last_name;
	}
}
