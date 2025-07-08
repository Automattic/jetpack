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
	 * @param array  $all_values               An associative array of field values.
	 * @param string $comment_content          The content of the comment.
	 * @param string $comment_author           The name of the comment author.
	 * @param string $comment_author_email     The email of the comment author.
	 * @param string $comment_author_url       The URL of the comment author.
	 * @param string $comment_ip_text          The IP address of the comment author.
	 * @param string $subject                  The subject of the feedback.
	 * @param string $status                   The status of the post (default is 'publish').
	 * @return int|WP_Error The ID of the created post on success, or a WP_Error object on failure.
	 */
	public static function create_legacy_feedback(
		$all_values = array(),
		$comment_content = 'This is a test comment content.',
		$comment_author = 'Test User',
		$comment_author_email = 'test@email.com',
		$comment_author_url = 'http://example.com',
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

		$content = addslashes( wp_kses( "$comment_content\n<!--more-->\nAUTHOR: {$comment_author}\nAUTHOR EMAIL: {$comment_author_email}\nAUTHOR URL: {$comment_author_url}\nSUBJECT: {$subject}\nIP: {$comment_ip_text}\nJSON_DATA\n" . wp_json_encode( $all_values ), array() ) );

		// Create a mock post with JSON_DATA format
		return wp_insert_post(
			array(
				'post_date'    => addslashes( $feedback_time ),
				'post_type'    => 'feedback',
				'post_status'  => addslashes( $status ),
				'post_parent'  => $post ? $post->ID : 0,
				'post_title'   => addslashes( wp_kses( $feedback_title, array() ) ),
				'post_content' => $content, // so that search will pick up this data
				'post_name'    => $feedback_id,
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

	public static function get_form_id( $attributes = array() ) {
		global $post, $page;

		$count = Contact_Form::get_forms_count();

		if ( ! empty( $attributes['widget'] ) && $attributes['widget'] ) {
			$attributes['id'] = 'widget-' . $attributes['widget'];
		} elseif ( ! empty( $attributes['block_template'] ) && $attributes['block_template'] ) {

			$attributes['id'] = 'block-template-' . $attributes['block_template'];
		} elseif ( ! empty( $attributes['block_template_part'] ) && $attributes['block_template_part'] ) {
			$attributes['id'] = 'block-template-part-' . $attributes['block_template_part'];
		} elseif ( $post ) {
			$attributes['id'] = $post->ID;
		}

		if ( $count ) {
			// Ensure 'id' exists in $attributes before trying to modify it
			if ( ! isset( $attributes['id'] ) ) {
				$attributes['id'] = '';
			}

			// When submitting the page number is not always set, so we need to handle that: TODO: This is a hack, we need to find a better way to handle form identification
			$page_num = max( 1, intval( $page ) );

			$attributes['id'] = $attributes['id'] . '-' . ( $count + 1 ) . '-' . $page_num;
		}
		return $attributes['id'];
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
}
