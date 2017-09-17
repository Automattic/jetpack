<?php
/*
Plugin Name: Simple Payments
Description: Simple Payments button implemented as a widget.
Version: 1.0
Author: Automattic Inc.
Author URI: http://automattic.com/
License: GPLv2 or later
*/

function jetpack_register_widget_simple_payments() {
	register_widget( 'Simple_Payments_Widget' );
}
add_action( 'widgets_init', 'jetpack_register_widget_simple_payments' );

class Simple_Payments_Widget extends WP_Widget {
	private static $dir       = null;
	private static $url       = null;

	private static $currencies = array(
		'USD' => array(
			'symbol' => '$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'EUR' => array(
			'symbol' => '€',
			'grouping' => '.',
			'decimal' => ',',
			'precision' => 2,
		),
		'AUD' => array(
			'symbol' => 'A$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'BRL' => array(
			'symbol' => 'R$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'CAD' => array(
			'symbol' => 'C$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'CZK' => array(
			'symbol' => 'Kč',
			'grouping' => ' ',
			'decimal' => ',',
			'precision' => 2,
		),
		'DKK' => array(
			'symbol' => 'kr.',
			'grouping' => '',
			'decimal' => ',',
			'precision' => 2,
		),
		'HKD' => array(
			'symbol' => 'HK$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'HUF' => array(
			'symbol' => 'Ft',
			'grouping' => '.',
			'decimal' => ',',
			'precision' => 0,
		),
		'ILS' => array(
			'symbol' => '₪',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'JPY' => array(
			'symbol' => '¥',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 0,
		),
		'MYR' => array(
			'symbol' => 'RM',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'MXN' => array(
			'symbol' => 'MX$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'TWD' => array(
			'symbol' => 'NT$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'NZD' => array(
			'symbol' => 'NZ$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'NOK' => array(
			'symbol' => 'kr',
			'grouping' => ' ',
			'decimal' => ',',
			'precision' => 2,
		),
		'PHP' => array(
			'symbol' => '₱',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'PLN' => array(
			'symbol' => 'zł',
			'grouping' => ' ',
			'decimal' => ',',
			'precision' => 2,
		),
		'GBP' => array(
			'symbol' => '£',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'RUB' => array(
			'symbol' => '₽',
			'grouping' => ' ',
			'decimal' => ',',
			'precision' => 2,
		),
		'SGD' => array(
			'symbol' => '$',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'SEK' => array(
			'symbol' => 'kr',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
		'CHF' => array(
			'symbol' => 'CHF',
			'grouping' => '\'',
			'decimal' => '.',
			'precision' => 2,
		),
		'THB' => array(
			'symbol' => '฿',
			'grouping' => ',',
			'decimal' => '.',
			'precision' => 2,
		),
	);

	function __construct() {
		$widget = array(
			'classname'   => 'simple-payments',
			'description' => __( 'Add a simple payment button.', 'jetpack' ),
		);

		parent::__construct(
			'Simple_Payments_Widget',
			/** This filter is documented in modules/widgets/facebook-likebox.php */
			apply_filters( 'jetpack_widget_name', __( 'Simple Payments', 'jetpack' ) ),
			$widget
		);

		self::$dir = trailingslashit( dirname( __FILE__ ) );
		self::$url = plugin_dir_url( __FILE__ );

		add_action( 'admin_enqueue_scripts', array( __class__, 'enqueue_admin_styles' ) );
	}

	public static function enqueue_admin_styles( $hook_suffix ) {
		if ( 'widgets.php' == $hook_suffix ) {
			wp_enqueue_style( 'simple-payments-widget-admin', self::$url . '/simple-payments/style-admin.css', array() );
			wp_enqueue_media();
			wp_enqueue_script( 'simple-payments-widget-admin', self::$url . '/simple-payments/admin.js', array( 'jquery' ), false, true );
		}
	}

	protected function get_product_args( $product_id ) {
		$product = $product_id ? get_post( $product_id ) : null;
		$product_args = array();
		if ( $product && ! is_wp_error( $product ) && $product->post_type === Jetpack_Simple_Payments::$post_type_product ) {
			$product_args = array(
				'name' => get_the_title( $product ),
				'description' => $product->post_content,
				'currency' => get_post_meta( $product->ID, 'spay_currency', true ),
				'price' => get_post_meta( $product->ID, 'spay_price', true ),
				'multiple' => get_post_meta( $product->ID, 'spay_multiple', true ),
				'email' => get_post_meta( $product->ID, 'spay_email', true ),
			);
		} else {
			$product_id = null;
		}

		$current_user = wp_get_current_user();
		return wp_parse_args( $product_args, array(
			'name' => '',
			'description' => '',
			'currency' => 'USD', // TODO: Geo-locate?
			'price' => '',
			'multiple' => '0',
			'email' => $current_user->user_email,
		) );
	}

    /**
     * Widget
     */
    function widget( $args, $instance ) {
		$instance = wp_parse_args( $instance, array(
			'title' => '',
			'product_id' => null,
		) );

		$product_args = $this->get_product_args( $instance['product_id'] );

		echo $args['before_widget'];

		$title = apply_filters( 'widget_title', $instance['title'] );
		if ( ! empty( $title ) ) {
			echo $args['before_title'] . $title . $args['after_title'];
		}

		echo '<div class="simple-payments-content">';

		$attrs = array( 'id' => $instance['product_id'] );

		$JSP = Jetpack_Simple_Payments::getInstance();
		echo $JSP->parse_shortcode( $attrs );

		echo '</div><!--simple-payments-->';

		echo $args['after_widget'];

	    /** This action is documented in modules/widgets/gravatar-profile.php */
	    do_action( 'jetpack_stats_extra', 'widget_view', 'simple-payments' );
    }

    protected function sanitize_price( $currency_code, $price ) {
		if ( '-' === substr( $price, 0, 1 ) ) {
			return false;
		}
		$currency = self::$currencies[ $currency_code ];
		$decimal = $currency['decimal'];
		$precision = $currency['precision'];
		$chars = count_chars( $price, 1 );
		for( $i = 0; $i <= 9; $i++ ) {
			unset( $chars[ ord( (string) $i ) ] );
		}
		if ( count( $chars ) > 1 || reset( $chars ) > 1 ) {
			return false;
		}

		// Allow the decimal separator to be the currency decimal separator or "."
		if ( ! empty( $chars ) ) {
			$decimal_char = chr( key( $chars ) );
			if ( $decimal_char !== $decimal && $decimal_char !== '.' ) {
				return false;
			}
			$price = str_replace( $decimal_char, '.', $price );
		}

		return round( (float) $price, $precision );
	}

	protected function format_price( $currency_code, $price ) {
		$currency = self::$currencies[ $currency_code ];
		if ( ! $currency ) {
			return $price . ' ' . $currency_code;
		}
		return number_format( $price, $currency['precision'], $currency['decimal'], $currency['grouping'] ) . ' ' . $currency['symbol'];
	}

	protected function format_price_amount( $currency_code, $price ) {
		$currency = self::$currencies[ $currency_code ];
		if ( ! $currency ) {
			return number_format( $price, 2, '.', '' );
		}
		return number_format( $price, $currency['precision'], $currency['decimal'], '' );
	}

	/**
	 * Update
	 */
	function update( $new_instance, $old_instance ) {
    	if ( $new_instance['product_id'] ) {
    		$product_id = $new_instance['product_id'];
		} else {
    		if ( ! isset( $new_instance['name'] ) ) {
    			return array(); // The user didn't pick a product in the list. Don't save anything.
			}
			$product_id = isset( $old_instance['product_id'] ) ? $old_instance['product_id'] : null;
		}
		$product = $product_id ? get_post( $product_id ) : 0;
		if ( ! $product || is_wp_error( $product ) || $product->post_type !== Jetpack_Simple_Payments::$post_type_product ) {
			$product_id = 0;
		}

		if ( isset( $new_instance['name'] ) ) {
			$product_id = wp_insert_post( array(
				'ID' => $product_id,
				'post_type' => Jetpack_Simple_Payments::$post_type_product,
				'post_status' => 'publish',
				'post_title' => sanitize_text_field( $new_instance['name'] ),
				'post_content' => sanitize_textarea_field( $new_instance['description'] ),
				'_thumbnail_id' => isset( $new_instance['image'] ) ? $new_instance['image'] : -1,
				'meta_input' => array(
					'spay_currency' => isset( self::$currencies[ $new_instance['currency'] ] ) ? $new_instance['currency'] : 'USD',
					'spay_price' => $this->sanitize_price( $new_instance['currency'], $new_instance['price'] ),
					'spay_multiple' => isset( $new_instance['multiple'] ) ? intval( $new_instance['multiple'] ) : 0,
					'spay_email' => is_email( $new_instance['email'] ),
				),
			) );
		}

		return array(
			'title' => $new_instance['title'] ? $new_instance['title'] : '',
			'product_id' => $product_id,
		);
    }


    /**
     * Form
     */
    function form( $instance ) {
		$instance = wp_parse_args( $instance, array(
			'title' => '',
			'product_id' => null,
		) );

		?>
		<div class="simple-payments">
			<p>
				<label for="<?php esc_attr_e( $this->get_field_id( 'title' ) ); ?>">
					<?php esc_html_e( 'Title', 'jetpack' ); ?></label>
				<input class="widefat" id="<?php esc_attr_e( $this->get_field_id( 'title' ) ); ?>" name="<?php esc_attr_e( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php esc_attr_e( $instance['title'] ); ?>" />
			</p>
			<?php
				$products = null;
				if ( ! $instance['product_id'] ) {
					// list existing products + add button
					$args = array(
						'numberposts' => -1,
						'orderby' => 'date',
						'post_type' => Jetpack_Simple_Payments::$post_type_product,
					);

					$products = get_posts( $args );
					if ( ! empty( $products ) ) {
						?>
						<div class="simple-payments-product-list">
							<button class="button simple-payments-add-product"><?php esc_html_e( 'Add New', 'jetpack' ); ?></button>
							<ul class="simple-payments-products">
								<?php
								foreach ( $products as $product ):
									$product_args = $this->get_product_args( $product->ID );
									$image = '';
									if ( has_post_thumbnail( $product->ID ) ) {
										$image = get_the_post_thumbnail( $product->ID, 'thumbnail' );
										$image_id = get_post_thumbnail_id( $product->ID );
									}
									$field_id = $this->get_field_id( 'product_id' ) . '_' . esc_attr( $product->ID );
								?>
								<li>
									<label for="<?php echo $field_id; ?>">
										<input type="radio" id="<?php echo $field_id; ?>" name="<?php echo $this->get_field_name( 'product_id' ); ?>" value="<?php esc_html_e( $product->ID ); ?>">
										<div class="product-info">
											<?php esc_html_e( $product_args['name'] ); ?><br>
											<?php esc_html_e( $this->format_price( $product_args['currency'], $product_args['price'] ) ); ?>
										</div>
										<div class="image"><?php echo $image; ?></div>
										<button class="button simple-payments-edit-product"
												data-name="<?php esc_attr_e( $product_args['name'] ); ?>"
												data-description="<?php esc_attr_e( $product_args['description'] ); ?>"
												data-currency="<?php esc_attr_e( $product_args['currency'] ); ?>"
												data-price="<?php esc_attr_e( $this->format_price_amount( $product_args['currency'], $product_args['price'] ) ); ?>"
												data-multiple="<?php esc_attr_e( $product_args['multiple'] ); ?>"
												data-email="<?php esc_attr_e( $product_args['email'] ); ?>"
												<?php if ( ! empty( $image ) ) { ?>
													data-image-url="<?php echo esc_url( wp_get_attachment_image_url( $image_id, 'full' ) ); ?>"
													data-image-id="<?php echo $image_id; ?>"
												<?php } ?>
										>
											<?php _e( 'Edit', 'jetpack' ); ?>
										</button>
									</label>
								</li>
								<?php endforeach; ?>
							</ul>
						</div>
						<?php
					}
				}

				// form code for adding a new product
				$product_args = $this->get_product_args( $instance['product_id'] );

				$price = ( $product_args['price'] ) ? esc_attr(  $this->format_price_amount( $product_args['currency'], $product_args['price'] ) ) : '';
				?>

				<div class="simple-payments-form" <?php if ( ! empty( $products ) ) echo 'style="display:none;"'; ?>>
					<?php if ( ! empty( $products ) ) { ?>
						<button class="button simple-payments-back-product-list"><?php _e( 'Cancel', 'jetpack' ); ?></button>
					<?php } ?>
					<p>
						<label for="<?php esc_attr_e( $this->get_field_id( 'name' ) ); ?>"><?php esc_html_e( 'What are you selling?', 'jetpack' ); ?></label>
						<input <?php echo empty( $products ) ? '' : 'disabled'; ?> class="widefat field-name" id="<?php esc_attr_e( $this->get_field_id( 'name' ) ); ?>" name="<?php esc_attr_e( $this->get_field_name( 'name' ) ); ?>" type="text" placeholder="<?php esc_attr_e( 'Product name', 'jetpack' ); ?>" value="<?php esc_attr_e( $product_args['name'] ); ?>" />
					</p>
					<div class="simple-payments-image-fieldset">
						<label><?php esc_html_e( 'Product image', 'jetpack' ); ?></label>
						<div class="placeholder" <?php if ( has_post_thumbnail( $instance['product_id'] ) ) echo 'style="display:none;"'; ?>><?php esc_html_e( 'Select an image', 'jetpack' ); ?></div> <!-- TODO: actual placeholder -->
						<div class="simple-payments-image" data-image-field="<?php esc_attr_e( $this->get_field_name( 'image' ) ); ?>"> <!-- TODO: hide if empty, CSS? -->
							<?php
								if ( has_post_thumbnail( $instance['product_id'] ) ) {
									$image_id = get_post_thumbnail_id( $instance['product_id'] );
									echo '<img src="' . esc_url( wp_get_attachment_image_url( $image_id, 'full' ) ) . '" />';
									echo '<input type="hidden" name="' . $this->get_field_name( 'image' ) . '" value="' . esc_attr( $image_id ) . '" />';
								}
							?>
							<button class="button simple-payments-remove-image"><span class="screen-reader-text"><?php esc_html_e( 'Remove image', 'jetpack' ); ?></span></button>
						</div>
					</div>
					<p>
						<label for="<?php esc_attr_e( $this->get_field_id( 'description' ) ); ?>"><?php esc_html_e( 'Description', 'jetpack' ); ?></label>
						<textarea class="field-description widefat" rows=5 id="<?php esc_attr_e( $this->get_field_id( 'description' ) ); ?>" name="<?php esc_attr_e( $this->get_field_name( 'description' ) ); ?>"><?php  esc_html_e( $product_args['description'] ); ?></textarea>
					</p>
					<p class="cost">
						<label for="<?php esc_attr_e( $this->get_field_id( 'price' ) ); ?>"><?php esc_html_e( 'Price', 'jetpack' ); ?></label>
						<select class="field-currency widefat" id="<?php esc_attr_e( $this->get_field_id( 'currency' ) ); ?>" name="<?php esc_attr_e( $this->get_field_name( 'currency' ) ); ?>">
							<?php foreach( self::$currencies as $code => $currency ) { ?>
								<option value="<?php esc_attr_e( $code ) ?>"<?php selected( $product_args['currency'], $code ); ?>>
									<?php esc_html_e( $currency['symbol'] === $code ? $code : ( $code . ' ' . rtrim( $currency['symbol'], '.' ) ) ) ?>
								</option>
							<?php } ?>
						</select>
						<input class="field-price widefat" id="<?php esc_attr_e( $this->get_field_id( 'price' ) ); ?>" name="<?php esc_attr_e( $this->get_field_name( 'price' ) ); ?>" type="text" value="<?php esc_attr_e( $price ); ?>" />
					</p>
					<p>
						<input class="field-multiple" id="<?php esc_attr_e( $this->get_field_id( 'multiple' ) ); ?>" name="<?php esc_attr_e( $this->get_field_name( 'multiple' ) ); ?>" type="checkbox" value="1"<?php checked( $product_args['multiple'], '1' ); ?>/>
						<label for="<?php esc_attr_e( $this->get_field_id( 'multiple' ) ); ?>"><?php esc_html_e( 'Allow people to buy more than one item at a time.', 'jetpack' ); ?></label>
					</p>
					<p>
						<label for="<?php esc_attr_e( $this->get_field_id( 'email' ) ); ?>"><?php esc_html_e( 'Email', 'jetpack' ); ?></label>
						<input class="field-email widefat" id="<?php esc_attr_e( $this->get_field_id( 'email' ) ); ?>" name="<?php esc_attr_e( $this->get_field_name( 'email' ) ); ?>" type="email" value="<?php  esc_attr_e( $product_args['email'] ); ?>" />
						<em><?php printf( esc_html__( 'This is where PayPal will send your money. To claim a payment, you\'ll need a %1$sPayPal account%2$s connected to a bank account.', 'jetpack' ), '<a href="https://paypal.com" target="_blank">', '</a>' ) ?></em>
					</p>
				</div>
			</div>
		<?php
	}
}
