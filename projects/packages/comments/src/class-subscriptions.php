<?php
/**
 * The subscribe options each host offers, and where a reader manages them.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

/**
 * Reads the host's own subscribe checkboxes back, and links to its own management pages.
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

	/**
	 * Where a reader manages their subscriptions to this site, the way the Action Bar links it.
	 *
	 * A WordPress.com account manages them in the Reader: the subscription itself
	 * when the site knows it exists, else the list filtered to this site. Anyone
	 * else manages them by email address. The page is cached for a reader the popup
	 * signs in, so the browser picks `signedInUrl` for them.
	 *
	 * @return array `url` and `byEmail` for the reader the page rendered for, and `signedInUrl`. All empty where the host offers no subscriptions.
	 */
	public static function manage_links() {
		$links = array(
			'url'         => '',
			'byEmail'     => true,
			'signedInUrl' => '',
		);

		if ( ! function_exists( 'subscription_comment_form' ) && ! class_exists( 'Jetpack_Subscriptions' ) ) {
			return $links;
		}

		$host = (string) wp_parse_url( home_url(), PHP_URL_HOST );

		$links['url']         = 'https://subscribe.wordpress.com/';
		$links['signedInUrl'] = 'https://wordpress.com/reader/subscriptions?s=' . rawurlencode( $host );

		if ( ! is_user_logged_in() || ! function_exists( 'wpcom_subs_is_subscribed' ) ) {
			return $links;
		}

		$subscription_id = wpcom_subs_is_subscribed(
			array(
				'user_id' => get_current_user_id(),
				'blog_id' => Checkpoint::blog_id(),
			)
		);

		$links['byEmail'] = false;
		$links['url']     = $subscription_id
			? 'https://wordpress.com/reader/subscriptions/' . (int) $subscription_id
			: $links['signedInUrl'];

		return $links;
	}
}
