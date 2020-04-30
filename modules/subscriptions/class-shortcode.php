<?php
/**
 * Display the Subscriptions shortcode
 * on WordPress.com or in Jetpack
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Subscriptions;

use Automattic\Jetpack\Subscriptions\Helpers;
use Automattic\Jetpack\Subscriptions\Widget;

add_shortcode( 'jetpack_subscription_form', array( 'Automattic\\Jetpack\\Subscriptions\\Shortcode', 'render_form' ) );
add_shortcode( 'blog_subscription_form', array( 'Automattic\\Jetpack\\Subscriptions\\Shortcode', 'render_form' ) );

/*
 * This may be worth trying, it is shorter, looks better
 * add_shortcode( 'jetpack_subscription_form', array( __NAMESPACE__ . '\\Shortcode', 'render_form' ) );
 * add_shortcode( 'blog_subscription_form', array( __NAMESPACE__ . '\\Shortcode', 'render_form' ) );
 */

/**
 * Render a shortcode based on the Subscriptions Widget.
 */
class Shortcode {
	/**
	 * Render form.
	 *
	 * @param array $instance Shortcode parameters.
	 */
	public static function render_form( $instance ) {
		if ( empty( $instance ) || ! is_array( $instance ) ) {
			$instance = array();
		}

		if ( empty( $instance['show_subscribers_total'] ) || 'false' === $instance['show_subscribers_total'] ) {
			$instance['show_subscribers_total'] = false;
		} else {
			$instance['show_subscribers_total'] = true;
		}

		$show_only_email_and_button = isset( $instance['show_only_email_and_button'] ) ? $instance['show_only_email_and_button'] : false;
		$submit_button_text         = isset( $instance['submit_button_text'] ) ? $instance['submit_button_text'] : '';

		/*
		 * Build up a string
		 * with the submit button's classes and styles
		 * and set it on the instance
		 */
		$submit_button_classes = isset( $instance['submit_button_classes'] ) ? $instance['submit_button_classes'] : '';
		$submit_button_styles  = '';
		if ( isset( $instance['custom_background_button_color'] ) ) {
			$submit_button_styles .= 'background-color: ' . $instance['custom_background_button_color'] . '; ';
		}
		if ( isset( $instance['custom_text_button_color'] ) ) {
			$submit_button_styles .= 'color: ' . $instance['custom_text_button_color'] . ';';
		}

		$instance = shortcode_atts(
			Widget::defaults(),
			$instance,
			'jetpack_subscription_form'
		);

		// These must come after the call to shortcode_atts().
		$instance['submit_button_text']         = $submit_button_text;
		$instance['show_only_email_and_button'] = $show_only_email_and_button;
		if ( ! empty( $submit_button_classes ) ) {
			$instance['submit_button_classes'] = $submit_button_classes;
		}
		if ( ! empty( $submit_button_styles ) ) {
			$instance['submit_button_styles'] = $submit_button_styles;
		}

		$args = array(
			'before_widget' => '<div class="jetpack_subscription_widget">',
		);

		ob_start();

		the_widget( Helpers::widget_classname(), $instance, $args );

		$output = ob_get_clean();

		return $output;
	}
}
