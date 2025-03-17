<?php
/**
 * Dashboard_Widget class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Forms\Dashboard\Dashboard_View_Switch;

/**
 * Class manages the dashboard widget for displaying the latest form entries in the admin dashboard.
 */
class Dashboard_Widget {
	/**
	 * Initialize the dashboard widget.
	 */
	public static function init() {
		add_action( 'wp_dashboard_setup', array( __CLASS__, 'add_widget' ) );
	}

	/**
	 * Register the dashboard widget.
	 */
	public static function add_widget() {
		wp_add_dashboard_widget( 'jetpack_forms_responses_widget', __( 'Latest Form Responses', 'jetpack-forms' ), array( __CLASS__, 'display_widget' ) );
	}

	/**
	 * Display the latest form responses in the dashboard widget.
	 */
	public static function display_widget() {

		$args = array(
			'post_type'      => 'feedback',
			'posts_per_page' => 6,
			'post_status'    => 'publish',
			'orderby'        => 'date',
			'order'          => 'DESC',
		);

		$entries   = get_posts( $args );
		$admin_url = ( new Dashboard_View_Switch() )->get_forms_admin_url();
		$has_more  = count( $entries ) > 5 ? true : false;

		// only show 5 entries
		$entries = array_slice( $entries, 0, 5 );
		if ( $entries ) {
			echo '<ul style="margin: 0 -12px;">';
			foreach ( $entries as $entry ) {
				echo '<li style="padding: 8px 12px; border-bottom: 1px solid #EEE; display: flex; gap: 4px;">';
				echo '<a href="' . esc_url( $admin_url . '#/responses?status=inbox&r=' . $entry->ID ) . '">' . esc_html( self::get_from( $entry ) ) . '</a>';
				echo '<span>&middot;</span> <time style="color: #646970;" datetime="' . esc_attr( $entry->post_date ) . '">' . esc_html( human_time_diff( strtotime( $entry->post_date_gmt ) ) ) . '</time>';
				echo '</li>';
			}
			echo '</ul>';
			echo ( $has_more ? '<a href="' . esc_url( $admin_url ) . '">' . esc_html__( 'View all responses', 'jetpack-forms' ) . '</a>' : '' );
		} else {
			echo '<p>' . esc_html__( 'No recent form responses found.', 'jetpack-forms' ) . '</p>';
		}
	}

	/**
	 * Returns the from strin for a form entry.
	 *
	 * @param \WP_Post $entry The form entry.
	 * @return string The from string.
	 */
	private static function get_from( $entry ) {
		$content_fields = Contact_Form_Plugin::parse_fields_from_content( $entry->ID );

		if ( ! empty( $content_fields['_feedback_author'] ) ) {
			return $content_fields['_feedback_author'];
		}

		if ( ! empty( $content_fields['_feedback_author_email'] ) ) {
			return $content_fields['_feedback_author_email'];
		}

		if ( ! empty( $content_fields['_feedback_ip'] ) ) {
			return $content_fields['_feedback_ip'];
		}

		return __( 'Unknown', 'jetpack-forms' );
	}
}
