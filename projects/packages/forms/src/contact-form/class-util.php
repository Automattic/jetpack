<?php

namespace Automattic\Jetpack\Forms\ContactForm;

class Util {

	/**
	 * Registers all relevant actions and filters for this class.
	 */
	public static function init() {
		if ( is_admin() ) {
			Admin::init();
		}

		add_filter( 'template_include', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_attribute' );

		add_action( 'render_block_core_template_part_post', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_part_id_global' );
		add_action( 'render_block_core_template_part_file', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_part_id_global' );
		add_action( 'render_block_core_template_part_none', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_part_id_global' );
		add_action( 'gutenberg_render_block_core_template_part_post', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_part_id_global' );
		add_action( 'gutenberg_render_block_core_template_part_file', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_part_id_global' );
		add_action( 'gutenberg_render_block_core_template_part_none', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_set_block_template_part_id_global' );


		add_filter( 'render_block', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_unset_block_template_part_id_global', 10, 2 );
		add_filter( 'widget_block_content', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_contact_form_filter_widget_block_content', 1, 3 );

		add_action( 'init', '\Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin::init', 9 );
		add_action( 'grunion_scheduled_delete', '\Automattic\Jetpack\Forms\ContactForm\Util::grunion_delete_old_spam' );
		add_action( 'grunion_pre_message_sent', '\Automattic\Jetpack\Forms\ContactForm\Util::jetpack_tracks_record_grunion_pre_message_sent', 12, 3 );
	}

	/**
	 * Sets the 'block_template' attribute on all instances of wp:jetpack/contact-form in
	 * the $_wp_current_template_content global variable.
	 *
	 * The $_wp_current_template_content global variable is hydrated immediately prior to
	 * 'template_include' in wp-includes/template-loader.php.
	 *
	 * This fixes Contact Form Blocks added to FSE _templates_ (e.g. Single or 404).
	 *
	 * @param string $template Template to be loaded.
	 */
	public static function grunion_contact_form_set_block_template_attribute( $template ) {
		global $_wp_current_template_content;
		if ( 'template-canvas.php' === basename( $template ) ) {
			Contact_Form::style_on();
			$_wp_current_template_content = Util::grunion_contact_form_apply_block_attribute(
				$_wp_current_template_content,
				array(
					'block_template' => 'canvas',
				)
			);
		}
		return $template;
	}

	/**
	 * Sets the $grunion_block_template_part_id global.
	 *
	 * This is part of the fix for Contact Form Blocks added to FSE _template parts_ (e.g footer).
	 * The global is processed in Grunion_Contact_Form::parse().
	 *
	 * @param string $template_part_id ID for the currently rendered template part.
	 */
	public static function grunion_contact_form_set_block_template_part_id_global( $template_part_id ) {
		$GLOBALS['grunion_block_template_part_id'] = $template_part_id;
	}

	/**
	 * Unsets the global when block is done rendering.
	 *
	 * @param string $content Rendered block content.
	 * @param array  $block   The full block, including name and attributes.
	 * @return string
	 */
	public static function grunion_contact_form_unset_block_template_part_id_global( $content, $block ) {
		if ( 'core/template-part' === $block['blockName']
			&& isset( $GLOBALS['grunion_block_template_part_id'] ) ) {
			unset( $GLOBALS['grunion_block_template_part_id'] );
		}
		return $content;
	}

	/**
	 * Sets the 'widget' attribute on all instances of the contact form in the widget block.
	 *
	 * @param string          $content  Existing widget block content.
	 * @param array           $instance Array of settings for the current widget.
	 * @param WP_Widget_Block $widget   Current Block widget instance.
	 * @return string
	 */
	public static function grunion_contact_form_filter_widget_block_content( $content, $instance, $widget ) {
		Contact_Form::style_on();
		// Inject 'block_template' => <widget-id> into all instances of the contact form block.
		return Util::grunion_contact_form_apply_block_attribute(
			$content,
			array(
				'widget' => $widget->id,
			)
		);
	}

	/**
	 * Deletes old spam feedbacks to keep the posts table size under control.
	 */
	public static function grunion_delete_old_spam() {
		global $wpdb;

		$grunion_delete_limit = 100;

		$now_gmt  = current_time( 'mysql', 1 );
		$sql      = $wpdb->prepare(
			"
			SELECT `ID`
			FROM $wpdb->posts
			WHERE DATE_SUB( %s, INTERVAL 15 DAY ) > `post_date_gmt`
				AND `post_type` = 'feedback'
				AND `post_status` = 'spam'
			LIMIT %d
		",
			$now_gmt,
			$grunion_delete_limit
		);
		$post_ids = $wpdb->get_col( $sql ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

		foreach ( (array) $post_ids as $post_id ) {
			// force a full delete, skip the trash
			wp_delete_post( $post_id, true );
		}

		if (
			/**
			 * Filter if the module run OPTIMIZE TABLE on the core WP tables.
			 *
			 * @module contact-form
			 *
			 * @since 1.3.1
			 * @since 6.4.0 Set to false by default.
			 *
			 * @param bool $filter Should Jetpack optimize the table, defaults to false.
			 */
			apply_filters( 'grunion_optimize_table', false )
		) {
			$wpdb->query( "OPTIMIZE TABLE $wpdb->posts" );
		}

		// if we hit the max then schedule another run
		if ( count( $post_ids ) >= $grunion_delete_limit ) {
			wp_schedule_single_event( time() + 700, 'grunion_scheduled_delete' );
		}
	}

	/**
	 * Send an event to Tracks on form submission.
	 *
	 * @param int   $post_id - the post_id for the CPT that is created.
	 * @param array $all_values - fields from the default contact form.
	 * @param array $extra_values - extra fields added to from the contact form.
	 *
	 * @return null|void
	 */
	public static function jetpack_tracks_record_grunion_pre_message_sent( $post_id, $all_values, $extra_values ) {
		// Do not do anything if the submission is not from a block.
		if (
			! isset( $extra_values['is_block'] )
			|| ! $extra_values['is_block']
		) {
			return;
		}

		/*
		 * Event details.
		 */
		$event_user  = wp_get_current_user();
		$event_name  = 'contact_form_block_message_sent';
		$event_props = array(
			'entry_permalink' => esc_url( $all_values['entry_permalink'] ),
			'feedback_id'     => esc_attr( $all_values['feedback_id'] ),
		);

		/*
		 * Record event.
		 * We use different libs on wpcom and Jetpack.
		 */
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$event_name             = 'wpcom_' . $event_name;
			$event_props['blog_id'] = get_current_blog_id();
			// If the form was sent by a logged out visitor, record event with blog owner.
			if ( empty( $event_user->ID ) ) {
				$event_user_id = wpcom_get_blog_owner( $event_props['blog_id'] );
				$event_user    = get_userdata( $event_user_id );
			}

			require_lib( 'tracks/client' );
			tracks_record_event( $event_user, $event_name, $event_props );
		} else {
			// If the form was sent by a logged out visitor, record event with Jetpack master user.
			if ( empty( $event_user->ID ) ) {
				$master_user_id = Jetpack_Options::get_option( 'master_user' );
				if ( ! empty( $master_user_id ) ) {
					$event_user = get_userdata( $master_user_id );
				}
			}

			$tracking = new \Automattic\Jetpack\Tracking();
			$tracking->record_user_event( $event_name, $event_props, $event_user );
		}
	}

	/**
	 * Adds a given attribute to all instances of the Contact Form block.
	 *
	 * @param string $content  Existing content to process.
	 * @param array  $new_attr New attributes to add.
	 * @return string
	 */
	public static function grunion_contact_form_apply_block_attribute( $content, $new_attr ) {
		if ( false === stripos( $content, 'wp:jetpack/contact-form' ) ) {
			return $content;
		}
		return preg_replace_callback(
			'/<!--\s+(?P<closer>\/)?wp:jetpack\/?contact-form\s+(?P<attrs>{(?:(?:[^}]+|}+(?=})|(?!}\s+\/?-->).)*+)?}\s+)?(?P<void>\/)?-->/s',
			function ( $match ) use ( $new_attr ) {
				// Ignore block closers.
				if ( ! empty( $match['closer'] ) ) {
					return $match[0];
				}
				// If block doesn't have attributes, add our own.
				if ( empty( $match['attrs'] ) ) {
					return str_replace(
						'wp:jetpack/contact-form ',
						'wp:jetpack/contact-form ' . wp_json_encode( $new_attr ) . ' ',
						$match[0]
					);
				}
				// $match['attrs'] includes trailing space: '{"customThankyou":"message"} '.
				$attrs = json_decode( rtrim( $match['attrs'], ' ' ), true );
				$attrs = array_merge( $attrs, $new_attr );
				return str_replace(
					$match['attrs'],
					wp_json_encode( $attrs ) . ' ',
					$match[0]
				);
			},
			$content
		);
	}
}
