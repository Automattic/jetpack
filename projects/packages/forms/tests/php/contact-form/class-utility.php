<?php
/**
 * Utility functions for Contact Form tests.
 */

namespace Automattic\Jetpack\Forms\ContactForm;

class Utility {
	/**
	 * Create a legacy feedback post.
	 *
	 * This function creates a mock feedback post in the legacy format used by Jetpack Contact Form.
	 *
	 * @param array        $all_values               An associative array of field values.
	 * @param string|null  $comment_content          The content of the comment.
	 * @param string|null  $comment_author           The name of the comment author.
	 * @param string|null  $comment_author_email     The email of the comment author.
	 * @param string|null  $comment_author_url       The URL of the comment author.
	 * @param string|null  $comment_ip_text          The IP address of the comment author.
	 * @param string|null  $subject                  The subject of the feedback.
	 * @param string|null  $status                   The status of the post (default is 'publish').
	 * @param boolean|null $strip_new_lines          Whether to strip new lines from the content (default is false).
	 *
	 * @return int|\WP_Error The ID of the created post on success, or a WP_Error object on failure.
	 */
	public static function create_legacy_feedback(
		$all_values = array(),
		$comment_content = 'This is a test comment content.',
		$comment_author = 'Test User',
		$comment_author_email = 'test@email.com',
		$comment_author_url = 'http://example.com',
		$comment_ip_text = 'https://127.0.0.1',
		$subject = 'Test Subject',
		$status = 'publish',
		$strip_new_lines = false,
		$is_unread = false
	) {
		global $post;
		$feedback_time  = current_time( 'mysql' );
		$feedback_title = "{$comment_author} - {$feedback_time}";
		$feedback_id    = md5( $feedback_title );

		if ( empty( $all_values ) ) {
			$all_values = array(
				'field1'                  => 'value1',
				'field2'                  => 'value2',
				'email_marketing_consent' => 'yes',
			);
		}
		// Ensure all_values is an array and has the necessary keys.
		$entry_values = array(
			'entry_title'     => 'Cool Post Title',
			'entry_permalink' => 'https://example.com/post/123',
			'feedback_id'     => $feedback_id,
		);

		if ( isset( $_POST['page'] ) ) {
			$entry_values['entry_page'] = absint( wp_unslash( $_POST['page'] ) );
		}

		if ( ! isset( $all_values['email_marketing_consent'] ) ) {
			$all_values['email_marketing_consent'] = false;
		}

		$all_values = array_merge(
			$all_values,
			$entry_values
		);

		$content = addslashes( wp_kses( "$comment_content\n<!--more-->\nAUTHOR: {$comment_author}\nAUTHOR EMAIL: {$comment_author_email}\nAUTHOR URL: {$comment_author_url}\nSUBJECT: {$subject}\nIP: {$comment_ip_text}\nJSON_DATA\n" . wp_json_encode( $all_values, JSON_UNESCAPED_SLASHES ), array() ) );
		if ( $strip_new_lines ) {
			$content = str_replace( array( "\n", "\r" ), ' ', $content );
		}
		// Create a mock post with JSON_DATA format
		return wp_insert_post(
			array(
				'post_date'      => addslashes( $feedback_time ),
				'post_type'      => 'feedback',
				'post_status'    => addslashes( $status ),
				'post_parent'    => $post ? $post->ID : 0,
				'post_title'     => addslashes( wp_kses( $feedback_title, array() ) ),
				'post_content'   => $content, // so that search will pick up this data
				'post_name'      => $feedback_id,
				'comment_status' => $is_unread ? Feedback::STATUS_UNREAD : Feedback::STATUS_READ,
			)
		);
	}

	public static function create_legacy_feedback_v2(
		$all_values = array(),
		$comment_author = 'Test User',
		$comment_ip_text = 'https://127.0.0.1',
		$subject = 'Test Subject',
		$status = 'publish'
	) {
		global $post;
		$feedback_time  = current_time( 'mysql' );
		$feedback_title = "{$comment_author} - {$feedback_time}";
		$feedback_id    = md5( $feedback_title );

		if ( empty( $all_values ) ) {
			$all_values = array(
				'field1'                  => 'value1',
				'field2'                  => 'value2',
				'email_marketing_consent' => 'yes',
			);
		}

		$entry_values = array(
			'entry_title'     => 'Cool Post Title',
			'entry_permalink' => 'https://example.com/post/123',
			'feedback_id'     => $feedback_id,
		);

		if ( isset( $_POST['page'] ) ) {
			$entry_values['entry_page'] = absint( wp_unslash( $_POST['page'] ) );
		}

		$fields = array();
		$i      = 1;
		foreach ( $all_values as $key => $value ) {
			$field    = new Feedback_Field( $i . '_' . $key, $key, $value, 'textarea', array(), $key );
			$fields[] = $field->serialize();
			++$i;
		}

		$content = array(
			'subject'     => $subject,
			'ip'          => $comment_ip_text,
			'entry_title' => $entry_values['entry_title'],
			'entry_page'  => $entry_values['entry_page'] ?? 1,
			'fields'      => $fields,
		);

		// Create a mock post with JSON_DATA format
		return wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => $status,
				'post_title'     => addslashes( wp_kses( $feedback_title, array() ) ),
				'post_date'      => $feedback_time,
				'post_name'      => $feedback_id,
				'post_content'   => wp_json_encode( $content, JSON_UNESCAPED_SLASHES ),
				'post_mime_type' => 'v2', // a way to help us identify what version of the data this is.
				'post_parent'    => $post ? $post->ID : 0,
			)
		);
	}

	/**
	 * Adds the field values to the global $_POST value.
	 *
	 * @param array  $values Array of form fields and values.
	 * @param string $form_id Optional form ID. If not provided, will use $post_id.
	 */
	public static function add_post_request( $values, $form_id = null, $post_id = 0 ) {
		$post_data = self::get_post_request( $values, $form_id, $post_id );
		foreach ( $post_data as $key => $value ) {
			$_POST[ $key ] = $value;
		}
	}

	/**
	 * Gets the form ID from the attributes.
	 *
	 * @param array $attributes The form attributes.
	 * @return string The form ID.
	 */
	public static function get_form_id( $attributes = array() ) {
		global $post, $page;
		return Contact_Form::compute_id( $attributes, $post, $page );
	}

	public static function get_post_request( $values, $form_id = null, $post_id = 0 ) {
		$prefix    = $form_id ? $form_id : 'g' . $post_id;
		$post_data = array();
		foreach ( $values as $key => $val ) {
			if ( strpos( $key, 'contact-form' ) === 0 || strpos( $key, 'action' ) === 0 ) {
				$post_data[ $key ] = $val;
			} else {
				$post_data[ $prefix . '-' . $key ] = $val;
			}
		}
		return $post_data;
	}

	public static function create_post_context() {
		$author_id = wp_insert_user(
			array(
				'user_email' => 'john@example.com',
				'user_login' => 'test_user',
				'user_pass'  => 'abc123',
			)
		);

		$post_id = wp_insert_post(
			array(
				'post_title'   => 'POST TITLE ' . microtime(),
				'post_content' => 'POST CONTENT',
				'post_status'  => 'publish',
				'post_author'  => $author_id,
			),
			true
		);

		global $post;
		$post = get_post( $post_id );
		return $post;
	}
	/**
	 * Destroys the post context.
	 *
	 * @param \WP_Post $post The post object to destroy.
	 */
	public static function destroy_post_context( $post ) {
		if ( $post ) {
			if ( is_int( $post->post_author ) ) {
				wp_delete_user( (int) $post->post_author );
			}
			wp_delete_post( $post->ID, true );
		}
	}
}
