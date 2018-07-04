<?php
/**
 * Disable direct access/execution to/of the widget code.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Jetpack_Simple_Payments_Widget' ) ) {
	/**
	 * Simple Payments Button
	 *
	 * Display a Simple Payment Button as a Widget.
	 */
	class Jetpack_Simple_Payments_Widget extends WP_Widget {
		// https://developer.paypal.com/docs/integration/direct/rest/currency-codes/
		private static $supported_currency_list = array(
			'USD' => '$',
			'GBP' => '&#163;',
			'JPY' => '&#165;',
			'BRL' => 'R$',
			'EUR' => '&#8364;',
			'NZD' => 'NZ$',
			'AUD' => 'A$',
			'CAD' => 'C$',
			'INR' => '₹',
			'ILS' => '₪',
			'RUB' => '₽',
			'MXN' => 'MX$',
			'SEK' => 'Skr',
			'HUF' => 'Ft',
			'CHF' => 'CHF',
			'CZK' => 'Kč',
			'DKK' => 'Dkr',
			'HKD' => 'HK$',
			'NOK' => 'Kr',
			'PHP' => '₱',
			'PLN' => 'PLN',
			'SGD' => 'S$',
			'TWD' => 'NT$',
			'THB' => '฿',
		);

		/**
		 * Constructor.
		 */
		function __construct() {
			parent::__construct(
				'jetpack_simple_payments_widget',
				/** This filter is documented in modules/widgets/facebook-likebox.php */
				apply_filters( 'jetpack_widget_name', __( 'Simple Payments', 'jetpack' ) ),
				array(
					'classname' => 'jetpack-simple-payments',
					'description' => __( 'Add a Simple Payment Button as a Widget.', 'jetpack' ),
					'customize_selective_refresh' => true,
				)
			);

			if ( is_customize_preview() ) {
				add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_styles_and_scripts' ) );

				add_filter( 'customize_refresh_nonces', array( $this, 'filter_nonces' ) );
				add_action( 'wp_ajax_customize-jetpack-simple-payments-buttons-get', array( $this, 'ajax_get_payment_buttons' ) );
				add_action( 'wp_ajax_customize-jetpack-simple-payments-button-save', array( $this, 'ajax_save_payment_button' ) );
				add_action( 'wp_ajax_customize-jetpack-simple-payments-button-delete', array( $this, 'ajax_delete_payment_button' ) );
			}

			if ( is_active_widget( false, false, $this->id_base ) || is_customize_preview() ) {
				add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_style' ) );
			}
		}

		/**
		 * Return an associative array of default values.
		 *
		 * These values are used in new widgets.
		 *
		 * @return array Default values for the widget options.
		 */
		private function defaults() {
			$current_user = wp_get_current_user();
			$default_product_id = $this->get_first_product_id();

			return array(
				'title' => '',
				'product_post_id' => $default_product_id,
				'form_action' => '',
				'form_product_id' => 0,
				'form_product_title' => '',
				'form_product_description' => '',
				'form_product_image_id' => 0,
				'form_product_image_src' => '',
				'form_product_currency' => '',
				'form_product_price' => '',
				'form_product_multiple' => '',
				'form_product_email' => $current_user->user_email,
			);
		}

		/**
		 * Adds a nonce for customizing menus.
		 *
		 * @param array $nonces Array of nonces.
		 * @return array $nonces Modified array of nonces.
		 */
		function filter_nonces( $nonces ) {
			$nonces['customize-jetpack-simple-payments'] = wp_create_nonce( 'customize-jetpack-simple-payments' );
			return $nonces;
		}

		function enqueue_style() {
			wp_enqueue_style( 'jetpack-simple-payments-widget-style', plugins_url( 'simple-payments/style.css', __FILE__ ), array(), '20180518' );
		}

		function admin_enqueue_styles_and_scripts(){
				wp_enqueue_style( 'jetpack-simple-payments-widget-customizer', plugins_url( 'simple-payments/customizer.css', __FILE__ ) );

				wp_enqueue_media();
				wp_enqueue_script( 'jetpack-simple-payments-widget-customizer', plugins_url( '/simple-payments/customizer.js', __FILE__ ), array( 'jquery' ), false, true );
				wp_localize_script( 'jetpack-simple-payments-widget-customizer', 'jpSimplePaymentsStrings', array(
					'deleteConfirmation' => __( 'Are you sure you want to delete this item? It will be disabled and removed from all locations where it currently appears.', 'jetpack' )
				) );
		}

		public function ajax_get_payment_buttons() {
			if ( ! check_ajax_referer( 'customize-jetpack-simple-payments', 'customize-jetpack-simple-payments-nonce', false ) ) {
				wp_send_json_error( 'bad_nonce', 400 );
			}

			if ( ! current_user_can( 'customize' ) ) {
				wp_send_json_error( 'customize_not_allowed', 403 );
			}

			$post_type_object = get_post_type_object( Jetpack_Simple_Payments::$post_type_product );
			if ( ! current_user_can( $post_type_object->cap->create_posts ) || ! current_user_can( $post_type_object->cap->publish_posts ) ) {
				wp_send_json_error( 'insufficient_post_permissions', 403 );
			}

			$product_posts = get_posts( array(
				'numberposts' => 100,
				'orderby' => 'date',
				'post_type' => Jetpack_Simple_Payments::$post_type_product,
				'post_status' => 'publish',
			 ) );

			 $formatted_products = array_map( array( $this, 'format_product_post_for_ajax_reponse' ), $product_posts );

			 wp_send_json_success( $formatted_products );
		}

		public function format_product_post_for_ajax_reponse( $product_post ) {
			return array(
				'ID' => $product_post->ID,
				'post_title' => $product_post->post_title,
			);
		}

		public function ajax_save_payment_button() {
			if ( ! check_ajax_referer( 'customize-jetpack-simple-payments', 'customize-jetpack-simple-payments-nonce', false ) ) {
				wp_send_json_error( 'bad_nonce', 400 );
			}

			if ( ! current_user_can( 'customize' ) ) {
				wp_send_json_error( 'customize_not_allowed', 403 );
			}

			$post_type_object = get_post_type_object( Jetpack_Simple_Payments::$post_type_product );
			if ( ! current_user_can( $post_type_object->cap->create_posts ) || ! current_user_can( $post_type_object->cap->publish_posts ) ) {
				wp_send_json_error( 'insufficient_post_permissions', 403 );
			}

			if ( empty( $_POST['params'] ) || ! is_array( $_POST['params'] ) ) {
				wp_send_json_error( 'missing_params', 400 );
			}

			$params = wp_unslash( $_POST['params'] );
			$errors = $this->validate_ajax_params( $params );
			if ( ! empty( $errors->errors ) ) {
				wp_send_json_error( $errors );
			}

			$product_post_id = isset( $params['product_post_id'] ) ? intval( $params['product_post_id'] ) : 0;

			$product_post = array(
				'ID' => $product_post_id,
				'post_type' => Jetpack_Simple_Payments::$post_type_product,
				'post_status' => 'publish',
				'post_title' => $params['post_title'],
				'post_content' => $params['post_content'],
				'_thumbnail_id' => ! empty( $params['image_id'] ) ? $params['image_id'] : -1,
				'meta_input' => array(
					'spay_currency' => $params['currency'],
					'spay_price' => $params['price'],
					'spay_multiple' => isset( $params['multiple'] ) ? intval( $params['multiple'] ) : 0,
					'spay_email' => is_email( $params['email'] ),
				),
			);

			if ( empty( $product_post_id ) ) {
				$product_post_id = wp_insert_post( $product_post );
			} else {
				$product_post_id = wp_update_post( $product_post );
			}

			if ( ! $product_post_id || is_wp_error( $product_post_id ) ) {
				wp_send_json_error( $product_post_id );
			}

			$tracks_properties = array(
				'id'       => $product_post_id,
				'currency' => $params['currency'],
				'price'    => $params['price']
			);
			if ( 0 === $product_post['ID'] ) {
				$this->record_event( 'created', 'create', $tracks_properties );
			} else {
				$this->record_event( 'updated', 'update', $tracks_properties );
			}

			wp_send_json_success( array(
				'product_post_id' => $product_post_id,
				'product_post_title' => $params['post_title'],
			) );
		}

		public function ajax_delete_payment_button() {
			if ( ! check_ajax_referer( 'customize-jetpack-simple-payments', 'customize-jetpack-simple-payments-nonce', false ) ) {
				wp_send_json_error( 'bad_nonce', 400 );
			}

			if ( ! current_user_can( 'customize' ) ) {
				wp_send_json_error( 'customize_not_allowed', 403 );
			}

			if ( empty( $_POST['params'] ) || ! is_array( $_POST['params'] ) ) {
				wp_send_json_error( 'missing_params', 400 );
			}

			$params = wp_unslash( $_POST['params'] );
			$illegal_params = array_diff( array_keys( $params ), array( 'product_post_id' ) );
			if ( ! empty( $illegal_params ) ) {
				wp_send_json_error( 'illegal_params', 400 );
			}

			$product_id = ( int ) $params['product_post_id'];
			$product_post = get_post( $product_id );

			$return = array( 'status' => $product_post->post_status );

			wp_delete_post( $product_id, true );
			$status = get_post_status( $product_id );
			if ( false === $status ) {
				$return['status'] = 'deleted';
			}

			$this->record_event( 'deleted', 'delete', array( 'id' => $product_id ) );

			wp_send_json_success( $return );
		}

		public function validate_ajax_params( $params ) {
			$errors = new WP_Error();

			$illegal_params = array_diff( array_keys( $params ), array( 'product_post_id', 'post_title', 'post_content', 'image_id', 'currency', 'price', 'multiple', 'email' ) );
			if ( ! empty( $illegal_params ) ) {
				$errors.add( 'illegal_params' );
			}

			if ( empty( $params['post_title'] ) ) {
				$errors->add( 'post_title', __( 'People need to know what they\'re paying for! Please add a brief title.' ) );
			}

			if ( empty( $params['price'] ) || floatval( $params['price'] ) <= 0 ) {
				$errors->add( 'price', __( 'Everything comes with a price tag these days. Please add a your product price.' ) );
			}

			if ( empty( $params['email'] ) || ! is_email( $params['email'] ) ) {
				$errors->add( 'email', __( 'We want to make sure payments reach you, so please add an email address.' ) );
			}

			return $errors;
		}

		function get_first_product_id() {
			$product_posts = get_posts( array(
				'numberposts' => 1,
				'orderby' => 'date',
				'post_type' => Jetpack_Simple_Payments::$post_type_product,
				'post_status' => 'publish',
			 ) );

			return ! empty( $product_posts ) ? $product_posts[0]->ID : null;
		}

		/**
		 * Front-end display of widget.
		 *
		 * @see WP_Widget::widget()
		 *
		 * @param array $args     Widget arguments.
		 * @param array $instance Saved values from database.
		 */
		function widget( $args, $instance ) {
			$instance = wp_parse_args( $instance, $this->defaults() );

			echo $args['before_widget'];

			/** This filter is documented in core/src/wp-includes/default-widgets.php */
			$title = apply_filters( 'widget_title', $instance['title'] );
			if ( ! empty( $title ) ) {
				echo $args['before_title'] . $title . $args['after_title'];
			}

			echo '<div class="jetpack-simple-payments-content">';

			if ( ! empty( $instance['form_action'] ) && in_array( $instance['form_action'], array( 'add', 'edit' ) ) && is_customize_preview() ) {
				require( dirname( __FILE__ ) . '/simple-payments/widget.php' );
			} else {
				$jsp = Jetpack_Simple_Payments::getInstance();
				$simple_payments_button = $jsp->parse_shortcode( array(
					'id' => $instance['product_post_id'],
				) );

				if ( ! is_null( $simple_payments_button ) || is_customize_preview() ) {
					echo $simple_payments_button;
				}
			}

			echo '</div><!--simple-payments-->';

			echo $args['after_widget'];

			/** This action is already documented in modules/widgets/gravatar-profile.php */
			do_action( 'jetpack_stats_extra', 'widget_view', 'simple_payments' );
		}

		/**
		 * Gets the latests field value from either the old instance or the new instance.
		 *
		 * @param array $mixed Array of values for the new form instance.
		 * @param array $mixed Array of values for the old form instance.
		 * @return mixed $mixed Field value.
		 */
		private function get_latest_field_value( $new_instance, $old_instance, $field) {
			return ! empty( $new_instance[ $field ] )
				? sanitize_text_field( $new_instance[ $field ] )
				: $old_instance[ $field ];
		}

		/**
		 * Gets the product fields from the product post. If no post found
		 * it returns the default values.
		 *
		 * @param int Product Post ID.
		 * @return array $fields Product Fields from the Product Post.
		 */
		private function get_product_from_post( $product_post_id ) {
			$product_post = get_post( $product_post_id );
			$form_product_id = $product_post_id;
			if( ! empty( $product_post ) ) {
				$form_product_image_id = get_post_thumbnail_id( $product_post_id );

				return array(
					'form_product_id' => $form_product_id,
					'form_product_title' => get_the_title( $product_post ),
					'form_product_description' => $product_post->post_content,
					'form_product_image_id' => $form_product_image_id,
					'form_product_image_src' => wp_get_attachment_image_url( $form_product_image_id, 'thumbnail' ),
					'form_product_currency' => get_post_meta( $product_post_id, 'spay_currency', true ),
					'form_product_price' => get_post_meta( $product_post_id, 'spay_price', true ),
					'form_product_multiple' => get_post_meta( $product_post_id, 'spay_multiple', true ) || '0',
					'form_product_email' => get_post_meta( $product_post_id, 'spay_email', true ),
				);
			}

			return $this->defaults();
		}

		/**
		 * Record a Track event and bump a MC stat.
		 *
		 * @param string $stat_name
		 * @param string $event_action
		 * @param array $event_properties
		 */
		private function record_event( $stat_name, $event_action, $event_properties = array() ) {
			$current_user = wp_get_current_user();

			// `bumps_stats_extra` only exists on .com
			if ( function_exists( 'bump_stats_extras' ) ) {
				require_lib( 'tracks/client' );
				tracks_record_event( $current_user, 'simple_payments_button_' . $event_action, $event_properties );
				/** This action is documented in modules/widgets/social-media-icons.php */
				do_action( 'jetpack_bump_stats_extra', 'jetpack-simple_payments', $stat_name );
				return;
			}

			jetpack_tracks_record_event( $current_user, 'jetpack_wpa_simple_payments_button_' . $event_action, $event_properties );
			$jetpack = Jetpack::init();
			// $jetpack->stat automatically prepends the stat group with 'jetpack-'
			$jetpack->stat( 'simple_payments', $stat_name ) ;
			$jetpack->do_stats( 'server_side' );
		}

		/**
		 * Sanitize widget form values as they are saved.
		 *
		 * @see WP_Widget::update()
		 *
		 * @param array $new_instance Values just sent to be saved.
		 * @param array $old_instance Previously saved values from database.
		 *
		 * @return array Updated safe values to be saved.
		 */
		function update( $new_instance, $old_instance ) {
			$defaults = $this->defaults();
			//do not overrite `product_post_id` for `$new_instance` with the defaults
			$new_instance = wp_parse_args( $new_instance, array_diff_key( $defaults, array( 'product_post_id' => 0 ) ) );
			$old_instance = wp_parse_args( $old_instance, $defaults );

			$required_widget_props = array(
				'title' => $this->get_latest_field_value( $new_instance, $old_instance, 'title' ),
				'product_post_id' => $this->get_latest_field_value( $new_instance, $old_instance, 'product_post_id' ),
				'form_action' => $this->get_latest_field_value( $new_instance, $old_instance, 'form_action' ),
			);

			if ( strcmp( $new_instance['form_action'], $old_instance['form_action'] ) !== 0 ) {
				if ( $new_instance['form_action'] == 'edit' ) {
					return array_merge( $this->get_product_from_post( ( int ) $old_instance['product_post_id'] ), $required_widget_props );
				}

				if ( $new_instance['form_action'] == 'clear' ) {
					return array_merge( $this->defaults(), $required_widget_props );
				}
			}

			$form_product_image_id = (int) $new_instance['form_product_image_id'];

			$form_product_email = ! empty( $new_instance['form_product_email'] )
				? sanitize_text_field( $new_instance['form_product_email'] )
				: $defaults['form_product_email'];

			return array_merge( $required_widget_props, array(
				'form_product_id' => ( int ) $new_instance['form_product_id'],
				'form_product_title' => sanitize_text_field( $new_instance['form_product_title'] ),
				'form_product_description' => sanitize_text_field( $new_instance['form_product_description'] ),
				'form_product_image_id' => $form_product_image_id,
				'form_product_image_src' => wp_get_attachment_image_url( $form_product_image_id, 'thumbnail' ),
				'form_product_currency' => sanitize_text_field( $new_instance['form_product_currency'] ),
				'form_product_price' => sanitize_text_field( $new_instance['form_product_price'] ),
				'form_product_multiple' => sanitize_text_field( $new_instance['form_product_multiple'] ),
				'form_product_email' => $form_product_email,
			) );
		}

		/**
		 * Back-end widget form.
		 *
		 * @see WP_Widget::form()
		 *
		 * @param array $instance Previously saved values from database.
		 */
		function form( $instance ) {
			$instance = wp_parse_args( $instance, $this->defaults() );

			$product_posts = get_posts( array(
				'numberposts' => 100,
				'orderby' => 'date',
				'post_type' => Jetpack_Simple_Payments::$post_type_product,
				'post_status' => 'publish',
			 ) );

			require( dirname( __FILE__ ) . '/simple-payments/form.php' );
		}
	}

	// Register Jetpack_Simple_Payments_Widget widget.
	function register_widget_jetpack_simple_payments() {
		$jetpack_simple_payments = Jetpack_Simple_Payments::getInstance();
		if ( ! $jetpack_simple_payments->is_enabled_jetpack_simple_payments() ) {
			return;
		}

		register_widget( 'Jetpack_Simple_Payments_Widget' );
	}
	add_action( 'widgets_init', 'register_widget_jetpack_simple_payments' );
}
