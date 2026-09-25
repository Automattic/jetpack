<?php
/**
 * The subscribe options each host offers.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

/**
 * Reads the host's own subscribe checkboxes back.
 */
class Subscriptions {

	/**
	 * The subscribe checkboxes the host would have drawn, to draw in the dialog under the host's own field names.
	 *
	 * Jetpack Subscriptions appends its checkboxes to the submit field at priority
	 * 10; WordPress.com has a function. Reading both back keeps each host's gating,
	 * and its handlers read the same names on submit.
	 *
	 * @param string $submit_field The submit field after the filters before this package's.
	 * @return array Each with the field `name`, the `label` to show and whether it starts `checked`.
	 */
	public static function checkboxes( $submit_field ) {
		$drawn = $submit_field;

		if ( function_exists( 'subscription_comment_form' ) ) {
			$drawn .= (string) subscription_comment_form( Comment_Form::post_id(), false );
		}

		$labels = array(
			'subscribe_comments' => __( 'Notify me of new comments by email.', 'jetpack-comments' ),
			'subscribe'          => __( 'Notify me of new comments by email.', 'jetpack-comments' ),
			'subscribe_blog'     => sprintf(
				/* translators: %s is the site's name. */
				__( 'Subscribe to keep up with %s.', 'jetpack-comments' ),
				get_bloginfo( 'name' )
			),
		);

		$checkboxes = array();

		foreach ( $labels as $name => $label ) {
			if ( preg_match( '/<input\b[^>]*\bname="' . $name . '"[^>]*>/', $drawn, $input ) ) {
				$checkboxes[] = array(
					'name'    => $name,
					'label'   => $label,
					'checked' => false !== strpos( $input[0], 'checked' ),
				);
			}
		}

		return $checkboxes;
	}
}
