<?php

if ( ! class_exists( 'Jetpack_Mailchimp_Widget' ) ) {

	//register Mailchimp widget
	function jetpack_mailchimp_widget_init() {
		register_widget( 'Jetpack_Mailchimp_Widget' );
	}

	add_action( 'widgets_init', 'jetpack_mailchimp_widget_init' );

	class Jetpack_Mailchimp_Widget extends WP_Widget {

		/**
		 * Constructor
		 */
		function __construct() { }

	}

}