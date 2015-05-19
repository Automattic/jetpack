<?php
/**
 * WooCommerce Template
 *
 * Functions for the templating system.
 *
 * @author 		WooThemes
 * @category 	Core
 * @package 	WooCommerce/Functions
 * @version     2.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * Handle redirects before content is output - hooked into template_redirect so is_page works.
 *
 * @return void
 */
function wc_template_redirect() {
	global $wp_query, $wp;

	// When default permalinks are enabled, redirect shop page to post type archive url
	if ( ! empty( $_GET['page_id'] ) && get_option( 'permalink_structure' ) == "" && $_GET['page_id'] == wc_get_page_id( 'shop' ) ) {
		wp_safe_redirect( get_post_type_archive_link('product') );
		exit;
	}

	// When on the checkout with an empty cart, redirect to cart page
	elseif ( is_page( wc_get_page_id( 'checkout' ) ) && sizeof( WC()->cart->get_cart() ) == 0 && empty( $wp->query_vars['order-pay'] ) && ! isset( $wp->query_vars['order-received'] ) ) {
		wp_redirect( wc_get_page_permalink( 'cart' ) );
		exit;
	}

	// Logout
	elseif ( isset( $wp->query_vars['customer-logout'] ) ) {
		wp_redirect( str_replace( '&amp;', '&', wp_logout_url( wc_get_page_permalink( 'myaccount' ) ) ) );
		exit;
	}

	// Redirect to the product page if we have a single product
	elseif ( is_search() && is_post_type_archive( 'product' ) && apply_filters( 'woocommerce_redirect_single_search_result', true ) && $wp_query->found_posts == 1 ) {
		$product = wc_get_product( $wp_query->post );

		if ( $product && $product->is_visible() ) {
			wp_safe_redirect( get_permalink( $product->id ), 302 );
			exit;
		}
	}

	// Ensure payment gateways are loaded early
	elseif ( is_add_payment_method_page() ) {

		WC()->payment_gateways();

	}

	// Checkout pages handling
	elseif ( is_checkout() ) {
		// Buffer the checkout page
		ob_start();

		// Ensure gateways and shipping methods are loaded early
		WC()->payment_gateways();
		WC()->shipping();
	}
}
add_action( 'template_redirect', 'wc_template_redirect' );

/**
 * When the_post is called, put product data into a global.
 *
 * @param mixed $post
 * @return WC_Product
 */
function wc_setup_product_data( $post ) {
	unset( $GLOBALS['product'] );

	if ( is_int( $post ) )
		$post = get_post( $post );

	if ( empty( $post->post_type ) || ! in_array( $post->post_type, array( 'product', 'product_variation' ) ) )
		return;

	$GLOBALS['product'] = wc_get_product( $post );

	return $GLOBALS['product'];
}
add_action( 'the_post', 'wc_setup_product_data' );

if ( ! function_exists( 'woocommerce_reset_loop' ) ) {

	/**
	 * Reset the loop's index and columns when we're done outputting a product loop.
	 *
	 * @subpackage	Loop
	 */
	function woocommerce_reset_loop() {
		global $woocommerce_loop;
		// Reset loop/columns globals when starting a new loop
		$woocommerce_loop['loop'] = $woocommerce_loop['columns'] = '';
	}
}
add_filter( 'loop_end', 'woocommerce_reset_loop' );

/**
 * Products RSS Feed.
 *
 * @access public
 * @return void
 */
function wc_products_rss_feed() {
	// Product RSS
	if ( is_post_type_archive( 'product' ) || is_singular( 'product' ) ) {

		$feed = get_post_type_archive_feed_link( 'product' );

		echo '<link rel="alternate" type="application/rss+xml"  title="' . __( 'New products', 'woocommerce' ) . '" href="' . esc_url( $feed ) . '" />';

	} elseif ( is_tax( 'product_cat' ) ) {

		$term = get_term_by('slug', esc_attr( get_query_var('product_cat') ), 'product_cat');

		$feed = add_query_arg('product_cat', $term->slug, get_post_type_archive_feed_link( 'product' ));

		echo '<link rel="alternate" type="application/rss+xml"  title="' . sprintf(__( 'New products added to %s', 'woocommerce' ), urlencode($term->name)) . '" href="' . esc_url( $feed ) . '" />';

	} elseif ( is_tax( 'product_tag' ) ) {

		$term = get_term_by('slug', esc_attr( get_query_var('product_tag') ), 'product_tag');

		$feed = add_query_arg('product_tag', $term->slug, get_post_type_archive_feed_link( 'product' ));

		echo '<link rel="alternate" type="application/rss+xml"  title="' . sprintf(__( 'New products tagged %s', 'woocommerce' ), urlencode($term->name)) . '" href="' . esc_url( $feed ) . '" />';

	}
}

/**
 * Output generator tag to aid debugging.
 *
 * @access public
 * @return void
 */
function wc_generator_tag( $gen, $type ) {
	switch ( $type ) {
		case 'html':
			$gen .= "\n" . '<meta name="generator" content="WooCommerce ' . esc_attr( WC_VERSION ) . '">';
			break;
		case 'xhtml':
			$gen .= "\n" . '<meta name="generator" content="WooCommerce ' . esc_attr( WC_VERSION ) . '" />';
			break;
	}
	return $gen;
}

/**
 * Add body classes for WC pages
 *
 * @param  array $classes
 * @return array
 */
function wc_body_class( $classes ) {
	$classes = (array) $classes;

	if ( is_woocommerce() ) {
		$classes[] = 'woocommerce';
		$classes[] = 'woocommerce-page';
	}

	elseif ( is_checkout() ) {
		$classes[] = 'woocommerce-checkout';
		$classes[] = 'woocommerce-page';
	}

	elseif ( is_cart() ) {
		$classes[] = 'woocommerce-cart';
		$classes[] = 'woocommerce-page';
	}

	elseif ( is_account_page() ) {
		$classes[] = 'woocommerce-account';
		$classes[] = 'woocommerce-page';
	}

	if ( is_store_notice_showing() ) {
		$classes[] = 'woocommerce-demo-store';
	}

	return array_unique( $classes );
}

/**
 * Adds extra post classes for products
 *
 * @since 2.1.0
 * @param array $classes
 * @param string|array $class
 * @param int $post_id
 * @return array
 */
function wc_product_post_class( $classes, $class = '', $post_id = '' ) {
	if ( ! $post_id || 'product' !== get_post_type( $post_id ) ) {
		return $classes;
	}

	$product = wc_get_product( $post_id );

	if ( $product ) {
		if ( $product->is_on_sale() ) {
			$classes[] = 'sale';
		}
		if ( $product->is_featured() ) {
			$classes[] = 'featured';
		}
		if ( $product->is_downloadable() ) {
			$classes[] = 'downloadable';
		}
		if ( $product->is_virtual() ) {
			$classes[] = 'virtual';
		}
		if ( $product->is_sold_individually() ) {
			$classes[] = 'sold-individually';
		}
		if ( $product->is_taxable() ) {
			$classes[] = 'taxable';
		}
		if ( $product->is_shipping_taxable() ) {
			$classes[] = 'shipping-taxable';
		}
		if ( $product->is_purchasable() ) {
			$classes[] = 'purchasable';
		}
		if ( isset( $product->product_type ) ) {
			$classes[] = "product-type-" . $product->product_type;
		}

		// add category slugs
		$categories = get_the_terms( $product->id, 'product_cat' );
		if ( ! empty( $categories ) ) {
			foreach ( $categories as $key => $value ) {
				$classes[] = 'product-cat-' . $value->slug;
			}
		}

		// add tag slugs
		$tags = get_the_terms( $product->id, 'product_tag' );
		if ( ! empty( $tags ) ) {
			foreach ( $tags as $key => $value ) {
				$classes[] = 'product-tag-' . $value->slug;
			}
		}

		$classes[] = $product->stock_status;
	}

	if ( false !== ( $key = array_search( 'hentry', $classes ) ) ) {
		unset( $classes[ $key ] );
	}

	return $classes;
}

/** Template pages ********************************************************/

if ( ! function_exists( 'woocommerce_content' ) ) {

	/**
	 * Output WooCommerce content.
	 *
	 * This function is only used in the optional 'woocommerce.php' template
	 * which people can add to their themes to add basic woocommerce support
	 * without hooks or modifying core templates.
	 *
	 */
	function woocommerce_content() {

		if ( is_singular( 'product' ) ) {

			while ( have_posts() ) : the_post();

				wc_get_template_part( 'content', 'single-product' );

			endwhile;

		} else { ?>

			<?php if ( apply_filters( 'woocommerce_show_page_title', true ) ) : ?>

				<h1 class="page-title"><?php woocommerce_page_title(); ?></h1>

			<?php endif; ?>

			<?php do_action( 'woocommerce_archive_description' ); ?>

			<?php if ( have_posts() ) : ?>

				<?php do_action('woocommerce_before_shop_loop'); ?>

				<?php woocommerce_product_loop_start(); ?>

					<?php woocommerce_product_subcategories(); ?>

					<?php while ( have_posts() ) : the_post(); ?>

						<?php wc_get_template_part( 'content', 'product' ); ?>

					<?php endwhile; // end of the loop. ?>

				<?php woocommerce_product_loop_end(); ?>

				<?php do_action('woocommerce_after_shop_loop'); ?>

			<?php elseif ( ! woocommerce_product_subcategories( array( 'before' => woocommerce_product_loop_start( false ), 'after' => woocommerce_product_loop_end( false ) ) ) ) : ?>

				<?php wc_get_template( 'loop/no-products-found.php' ); ?>

			<?php endif;

		}
	}
}

/** Global ****************************************************************/

if ( ! function_exists( 'woocommerce_output_content_wrapper' ) ) {

	/**
	 * Output the start of the page wrapper.
	 *
	 */
	function woocommerce_output_content_wrapper() {
		wc_get_template( 'global/wrapper-start.php' );
	}
}
if ( ! function_exists( 'woocommerce_output_content_wrapper_end' ) ) {

	/**
	 * Output the end of the page wrapper.
	 *
	 */
	function woocommerce_output_content_wrapper_end() {
		wc_get_template( 'global/wrapper-end.php' );
	}
}

if ( ! function_exists( 'woocommerce_get_sidebar' ) ) {

	/**
	 * Get the shop sidebar template.
	 *
	 */
	function woocommerce_get_sidebar() {
		wc_get_template( 'global/sidebar.php' );
	}
}

if ( ! function_exists( 'woocommerce_demo_store' ) ) {

	/**
	 * Adds a demo store banner to the site if enabled
	 *
	 */
	function woocommerce_demo_store() {
		if ( !is_store_notice_showing() )
			return;

		$notice = get_option( 'woocommerce_demo_store_notice' );
		if ( empty( $notice ) )
			$notice = __( 'This is a demo store for testing purposes &mdash; no orders shall be fulfilled.', 'woocommerce' );

		echo apply_filters( 'woocommerce_demo_store', '<p class="demo_store">' . $notice . '</p>'  );
	}
}

/** Loop ******************************************************************/

if ( ! function_exists( 'woocommerce_page_title' ) ) {

	/**
	 * woocommerce_page_title function.
	 *
	 * @param  boolean $echo
	 * @return string
	 */
	function woocommerce_page_title( $echo = true ) {

		if ( is_search() ) {
			$page_title = sprintf( __( 'Search Results: &ldquo;%s&rdquo;', 'woocommerce' ), get_search_query() );

			if ( get_query_var( 'paged' ) )
				$page_title .= sprintf( __( '&nbsp;&ndash; Page %s', 'woocommerce' ), get_query_var( 'paged' ) );

		} elseif ( is_tax() ) {

			$page_title = single_term_title( "", false );

		} else {

			$shop_page_id = wc_get_page_id( 'shop' );
			$page_title   = get_the_title( $shop_page_id );

		}

		$page_title = apply_filters( 'woocommerce_page_title', $page_title );

		if ( $echo )
	    	echo $page_title;
	    else
	    	return $page_title;
	}
}

if ( ! function_exists( 'woocommerce_product_loop_start' ) ) {

	/**
	 * Output the start of a product loop. By default this is a UL
	 *
	 * @param bool $echo
	 * @return string
	 */
	function woocommerce_product_loop_start( $echo = true ) {
		ob_start();
		wc_get_template( 'loop/loop-start.php' );
		if ( $echo )
			echo ob_get_clean();
		else
			return ob_get_clean();
	}
}
if ( ! function_exists( 'woocommerce_product_loop_end' ) ) {

	/**
	 * Output the end of a product loop. By default this is a UL
	 *
	 * @param bool $echo
	 * @return string
	 */
	function woocommerce_product_loop_end( $echo = true ) {
		ob_start();

		wc_get_template( 'loop/loop-end.php' );

		if ( $echo )
			echo ob_get_clean();
		else
			return ob_get_clean();
	}
}
if ( ! function_exists( 'woocommerce_taxonomy_archive_description' ) ) {

	/**
	 * Show an archive description on taxonomy archives
	 *
	 * @subpackage	Archives
	 */
	function woocommerce_taxonomy_archive_description() {
		if ( is_tax( array( 'product_cat', 'product_tag' ) ) && get_query_var( 'paged' ) == 0 ) {
			$description = wc_format_content( term_description() );
			if ( $description ) {
				echo '<div class="term-description">' . $description . '</div>';
			}
		}
	}
}
if ( ! function_exists( 'woocommerce_product_archive_description' ) ) {

	/**
	 * Show a shop page description on product archives
	 *
	 * @subpackage	Archives
	 */
	function woocommerce_product_archive_description() {
		if ( is_post_type_archive( 'product' ) && get_query_var( 'paged' ) == 0 ) {
			$shop_page   = get_post( wc_get_page_id( 'shop' ) );
			if ( $shop_page ) {
				$description = wc_format_content( $shop_page->post_content );
				if ( $description ) {
					echo '<div class="page-description">' . $description . '</div>';
				}
			}
		}
	}
}

if ( ! function_exists( 'woocommerce_template_loop_add_to_cart' ) ) {

	/**
	 * Get the add to cart template for the loop.
	 *
	 * @subpackage	Loop
	 */
	function woocommerce_template_loop_add_to_cart( $args = array() ) {
		wc_get_template( 'loop/add-to-cart.php' , $args );
	}
}
if ( ! function_exists( 'woocommerce_template_loop_product_thumbnail' ) ) {

	/**
	 * Get the product thumbnail for the loop.
	 *
	 * @subpackage	Loop
	 */
	function woocommerce_template_loop_product_thumbnail() {
		echo woocommerce_get_product_thumbnail();
	}
}
if ( ! function_exists( 'woocommerce_template_loop_price' ) ) {

	/**
	 * Get the product price for the loop.
	 *
	 * @subpackage	Loop
	 */
	function woocommerce_template_loop_price() {
		wc_get_template( 'loop/price.php' );
	}
}
if ( ! function_exists( 'woocommerce_template_loop_rating' ) ) {

	/**
	 * Display the average rating in the loop
	 *
	 * @subpackage	Loop
	 */
	function woocommerce_template_loop_rating() {
		wc_get_template( 'loop/rating.php' );
	}
}
if ( ! function_exists( 'woocommerce_show_product_loop_sale_flash' ) ) {

	/**
	 * Get the sale flash for the loop.
	 *
	 * @subpackage	Loop
	 */
	function woocommerce_show_product_loop_sale_flash() {
		wc_get_template( 'loop/sale-flash.php' );
	}
}

if ( ! function_exists( 'woocommerce_get_product_schema' ) ) {

	/**
	 * Get a products Schema
	 * @return string
	 */
	function woocommerce_get_product_schema() {
		global $product;

		$schema = "Product";

		// Downloadable product schema handling
		if ( $product->is_downloadable() ) {
			switch ( $product->download_type ) {
				case 'application' :
					$schema = "SoftwareApplication";
				break;
				case 'music' :
					$schema = "MusicAlbum";
				break;
				default :
					$schema = "Product";
				break;
			}
		}

		return 'http://schema.org/' . $schema;
	}
}

if ( ! function_exists( 'woocommerce_get_product_thumbnail' ) ) {

	/**
	 * Get the product thumbnail, or the placeholder if not set.
	 *
	 * @subpackage	Loop
	 * @param string $size (default: 'shop_catalog')
	 * @param int $placeholder_width (default: 0)
	 * @param int $placeholder_height (default: 0)
	 * @return string
	 */
	function woocommerce_get_product_thumbnail( $size = 'shop_catalog', $placeholder_width = 0, $placeholder_height = 0  ) {
		global $post;

		if ( has_post_thumbnail() ) {
			return get_the_post_thumbnail( $post->ID, $size );
		} elseif ( wc_placeholder_img_src() ) {
			return wc_placeholder_img( $size );
		}
	}
}

if ( ! function_exists( 'woocommerce_result_count' ) ) {

	/**
	 * Output the result count text (Showing x - x of x results).
	 *
	 * @subpackage	Loop
	 */
	function woocommerce_result_count() {
		wc_get_template( 'loop/result-count.php' );
	}
}

if ( ! function_exists( 'woocommerce_catalog_ordering' ) ) {

	/**
	 * Output the product sorting options.
	 *
	 * @subpackage	Loop
	 */
	function woocommerce_catalog_ordering() {
		global $wp_query;

		if ( 1 == $wp_query->found_posts || ! woocommerce_products_will_display() ) {
			return;
		}

		$orderby                 = isset( $_GET['orderby'] ) ? wc_clean( $_GET['orderby'] ) : apply_filters( 'woocommerce_default_catalog_orderby', get_option( 'woocommerce_default_catalog_orderby' ) );
		$show_default_orderby    = 'menu_order' === apply_filters( 'woocommerce_default_catalog_orderby', get_option( 'woocommerce_default_catalog_orderby' ) );
		$catalog_orderby_options = apply_filters( 'woocommerce_catalog_orderby', array(
			'menu_order' => __( 'Default sorting', 'woocommerce' ),
			'popularity' => __( 'Sort by popularity', 'woocommerce' ),
			'rating'     => __( 'Sort by average rating', 'woocommerce' ),
			'date'       => __( 'Sort by newness', 'woocommerce' ),
			'price'      => __( 'Sort by price: low to high', 'woocommerce' ),
			'price-desc' => __( 'Sort by price: high to low', 'woocommerce' )
		) );

		if ( ! $show_default_orderby ) {
			unset( $catalog_orderby_options['menu_order'] );
		}

		if ( get_option( 'woocommerce_enable_review_rating' ) === 'no' ) {
			unset( $catalog_orderby_options['rating'] );
		}

		wc_get_template( 'loop/orderby.php', array( 'catalog_orderby_options' => $catalog_orderby_options, 'orderby' => $orderby, 'show_default_orderby' => $show_default_orderby ) );
	}
}

if ( ! function_exists( 'woocommerce_pagination' ) ) {

	/**
	 * Output the pagination.
	 *
	 * @subpackage	Loop
	 */
	function woocommerce_pagination() {
		wc_get_template( 'loop/pagination.php' );
	}
}

/** Single Product ********************************************************/

if ( ! function_exists( 'woocommerce_show_product_images' ) ) {

	/**
	 * Output the product image before the single product summary.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_show_product_images() {
		wc_get_template( 'single-product/product-image.php' );
	}
}
if ( ! function_exists( 'woocommerce_show_product_thumbnails' ) ) {

	/**
	 * Output the product thumbnails.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_show_product_thumbnails() {
		wc_get_template( 'single-product/product-thumbnails.php' );
	}
}
if ( ! function_exists( 'woocommerce_output_product_data_tabs' ) ) {

	/**
	 * Output the product tabs.
	 *
	 * @subpackage	Product/Tabs
	 */
	function woocommerce_output_product_data_tabs() {
		wc_get_template( 'single-product/tabs/tabs.php' );
	}
}
if ( ! function_exists( 'woocommerce_template_single_title' ) ) {

	/**
	 * Output the product title.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_template_single_title() {
		wc_get_template( 'single-product/title.php' );
	}
}
if ( ! function_exists( 'woocommerce_template_single_rating' ) ) {

	/**
	 * Output the product rating.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_template_single_rating() {
		wc_get_template( 'single-product/rating.php' );
	}
}
if ( ! function_exists( 'woocommerce_template_single_price' ) ) {

	/**
	 * Output the product price.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_template_single_price() {
		wc_get_template( 'single-product/price.php' );
	}
}
if ( ! function_exists( 'woocommerce_template_single_excerpt' ) ) {

	/**
	 * Output the product short description (excerpt).
	 *
	 * @subpackage	Product
	 */
	function woocommerce_template_single_excerpt() {
		wc_get_template( 'single-product/short-description.php' );
	}
}
if ( ! function_exists( 'woocommerce_template_single_meta' ) ) {

	/**
	 * Output the product meta.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_template_single_meta() {
		wc_get_template( 'single-product/meta.php' );
	}
}
if ( ! function_exists( 'woocommerce_template_single_sharing' ) ) {

	/**
	 * Output the product sharing.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_template_single_sharing() {
		wc_get_template( 'single-product/share.php' );
	}
}
if ( ! function_exists( 'woocommerce_show_product_sale_flash' ) ) {

	/**
	 * Output the product sale flash.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_show_product_sale_flash() {
		wc_get_template( 'single-product/sale-flash.php' );
	}
}

if ( ! function_exists( 'woocommerce_template_single_add_to_cart' ) ) {

	/**
	 * Trigger the single product add to cart action.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_template_single_add_to_cart() {
		global $product;
		do_action( 'woocommerce_' . $product->product_type . '_add_to_cart'  );
	}
}
if ( ! function_exists( 'woocommerce_simple_add_to_cart' ) ) {

	/**
	 * Output the simple product add to cart area.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_simple_add_to_cart() {
		wc_get_template( 'single-product/add-to-cart/simple.php' );
	}
}
if ( ! function_exists( 'woocommerce_grouped_add_to_cart' ) ) {

	/**
	 * Output the grouped product add to cart area.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_grouped_add_to_cart() {
		global $product;

		wc_get_template( 'single-product/add-to-cart/grouped.php', array(
			'grouped_product'    => $product,
			'grouped_products'   => $product->get_children(),
			'quantites_required' => false
		) );
	}
}
if ( ! function_exists( 'woocommerce_variable_add_to_cart' ) ) {

	/**
	 * Output the variable product add to cart area.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_variable_add_to_cart() {
		global $product;

		// Enqueue variation scripts
		wp_enqueue_script( 'wc-add-to-cart-variation' );

		// Load the template
		wc_get_template( 'single-product/add-to-cart/variable.php', array(
				'available_variations'  => $product->get_available_variations(),
				'attributes'   			=> $product->get_variation_attributes(),
				'selected_attributes' 	=> $product->get_variation_default_attributes()
			) );
	}
}
if ( ! function_exists( 'woocommerce_external_add_to_cart' ) ) {

	/**
	 * Output the external product add to cart area.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_external_add_to_cart() {
		global $product;

		if ( ! $product->get_product_url() )
			return;

		wc_get_template( 'single-product/add-to-cart/external.php', array(
				'product_url' => $product->get_product_url(),
				'button_text' => $product->single_add_to_cart_text()
			) );
	}
}

if ( ! function_exists( 'woocommerce_quantity_input' ) ) {

	/**
	 * Output the quantity input for add to cart forms.
	 *
	 * @param  array $args Args for the input
	 * @param  WC_Product|null $product
	 * @param  boolean $echo Whether to return or echo|string
	 */
	function woocommerce_quantity_input( $args = array(), $product = null, $echo = true ) {
		if ( is_null( $product ) )
			$product = $GLOBALS['product'];

		$defaults = array(
			'input_name'  	=> 'quantity',
			'input_value'  	=> '1',
			'max_value'  	=> apply_filters( 'woocommerce_quantity_input_max', '', $product ),
			'min_value'  	=> apply_filters( 'woocommerce_quantity_input_min', '', $product ),
			'step' 			=> apply_filters( 'woocommerce_quantity_input_step', '1', $product )
		);

		$args = apply_filters( 'woocommerce_quantity_input_args', wp_parse_args( $args, $defaults ), $product );

		ob_start();

		wc_get_template( 'global/quantity-input.php', $args );

		if ( $echo ) {
			echo ob_get_clean();
		} else {
			return ob_get_clean();
		}
	}
}

if ( ! function_exists( 'woocommerce_product_description_tab' ) ) {

	/**
	 * Output the description tab content.
	 *
	 * @subpackage	Product/Tabs
	 */
	function woocommerce_product_description_tab() {
		wc_get_template( 'single-product/tabs/description.php' );
	}
}
if ( ! function_exists( 'woocommerce_product_additional_information_tab' ) ) {

	/**
	 * Output the attributes tab content.
	 *
	 * @subpackage	Product/Tabs
	 */
	function woocommerce_product_additional_information_tab() {
		wc_get_template( 'single-product/tabs/additional-information.php' );
	}
}
if ( ! function_exists( 'woocommerce_product_reviews_tab' ) ) {

	/**
	 * Output the reviews tab content.
	 *
	 * @subpackage	Product/Tabs
	 */
	function woocommerce_product_reviews_tab() {
		wc_get_template( 'single-product/tabs/reviews.php' );
	}
}

if ( ! function_exists( 'woocommerce_default_product_tabs' ) ) {

	/**
	 * Add default product tabs to product pages.
	 *
	 * @param array $tabs
	 * @return array
	 */
	function woocommerce_default_product_tabs( $tabs = array() ) {
		global $product, $post;

		// Description tab - shows product content
		if ( $post->post_content ) {
			$tabs['description'] = array(
				'title'    => __( 'Description', 'woocommerce' ),
				'priority' => 10,
				'callback' => 'woocommerce_product_description_tab'
			);
		}

		// Additional information tab - shows attributes
		if ( $product && ( $product->has_attributes() || ( $product->enable_dimensions_display() && ( $product->has_dimensions() || $product->has_weight() ) ) ) ) {
			$tabs['additional_information'] = array(
				'title'    => __( 'Additional Information', 'woocommerce' ),
				'priority' => 20,
				'callback' => 'woocommerce_product_additional_information_tab'
			);
		}

		// Reviews tab - shows comments
		if ( comments_open() ) {
			$tabs['reviews'] = array(
				'title'    => sprintf( __( 'Reviews (%d)', 'woocommerce' ), $product->get_review_count() ),
				'priority' => 30,
				'callback' => 'comments_template'
			);
		}

		return $tabs;
	}
}

if ( ! function_exists( 'woocommerce_sort_product_tabs' ) ) {

	/**
	 * Sort tabs by priority
	 *
	 * @param array $tabs
	 * @return array
	 */
	function woocommerce_sort_product_tabs( $tabs = array() ) {

		// Make sure the $tabs parameter is an array
		if ( ! is_array( $tabs ) ) {
			trigger_error( "Function woocommerce_sort_product_tabs() expects an array as the first parameter. Defaulting to empty array." );
			$tabs = array( );
		}

		// Re-order tabs by priority
		if ( ! function_exists( '_sort_priority_callback' ) ) {
			function _sort_priority_callback( $a, $b ) {
				if ( $a['priority'] == $b['priority'] )
			        return 0;
			    return ( $a['priority'] < $b['priority'] ) ? -1 : 1;
			}
		}

		uasort( $tabs, '_sort_priority_callback' );

		return $tabs;
	}
}

if ( ! function_exists( 'woocommerce_comments' ) ) {

	/**
	 * Output the Review comments template.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_comments( $comment, $args, $depth ) {
		$GLOBALS['comment'] = $comment;
		wc_get_template( 'single-product/review.php', array( 'comment' => $comment, 'args' => $args, 'depth' => $depth ) );
	}
}

if ( ! function_exists( 'woocommerce_output_related_products' ) ) {

	/**
	 * Output the related products.
	 *
	 * @subpackage	Product
	 */
	function woocommerce_output_related_products() {

		$args = array(
			'posts_per_page' => 2,
			'columns' => 2,
			'orderby' => 'rand'
		);

		woocommerce_related_products( apply_filters( 'woocommerce_output_related_products_args', $args ) );
	}
}

if ( ! function_exists( 'woocommerce_related_products' ) ) {

	/**
	 * Output the related products.
	 *
	 * @param array Provided arguments
	 * @param bool Columns argument for backwards compat
	 * @param bool Order by argument for backwards compat
	 */
	function woocommerce_related_products( $args = array(), $columns = false, $orderby = false ) {
		if ( ! is_array( $args ) ) {
			_deprecated_argument( __FUNCTION__, '2.1', __( 'Use $args argument as an array instead. Deprecated argument will be removed in WC 2.2.', 'woocommerce' ) );

			$argsvalue = $args;

			$args = array(
				'posts_per_page' => $argsvalue,
				'columns'        => $columns,
				'orderby'        => $orderby,
			);
		}

		$defaults = array(
			'posts_per_page' => 2,
			'columns'        => 2,
			'orderby'        => 'rand'
		);

		$args = wp_parse_args( $args, $defaults );

		wc_get_template( 'single-product/related.php', $args );
	}
}

if ( ! function_exists( 'woocommerce_upsell_display' ) ) {

	/**
	 * Output product up sells.
	 *
	 * @param int $posts_per_page (default: -1)
	 * @param int $columns (default: 2)
	 * @param string $orderby (default: 'rand')
	 */
	function woocommerce_upsell_display( $posts_per_page = '-1', $columns = 2, $orderby = 'rand' ) {
		wc_get_template( 'single-product/up-sells.php', array(
				'posts_per_page'	=> $posts_per_page,
				'orderby'			=> apply_filters( 'woocommerce_upsells_orderby', $orderby ),
				'columns'			=> $columns
			) );
	}
}

/** Cart ******************************************************************/

if ( ! function_exists( 'woocommerce_shipping_calculator' ) ) {

	/**
	 * Output the cart shipping calculator.
	 *
	 * @subpackage	Cart
	 */
	function woocommerce_shipping_calculator() {
		wc_get_template( 'cart/shipping-calculator.php' );
	}
}

if ( ! function_exists( 'woocommerce_cart_totals' ) ) {

	/**
	 * Output the cart totals.
	 *
	 * @subpackage	Cart
	 */
	function woocommerce_cart_totals() {
		wc_get_template( 'cart/cart-totals.php' );
	}
}

if ( ! function_exists( 'woocommerce_cross_sell_display' ) ) {

	/**
	 * Output the cart cross-sells.
	 *
	 * @param  integer $posts_per_page
	 * @param  integer $columns
	 * @param  string $orderby
	 */
	function woocommerce_cross_sell_display( $posts_per_page = 2, $columns = 2, $orderby = 'rand' ) {
		wc_get_template( 'cart/cross-sells.php', array(
				'posts_per_page' => $posts_per_page,
				'orderby'        => $orderby,
				'columns'        => $columns
			) );
	}
}

if ( ! function_exists( 'woocommerce_button_proceed_to_checkout' ) ) {

	/**
	 * Output the proceed to checkout button.
	 *
	 * @subpackage	Cart
	 */
	function woocommerce_button_proceed_to_checkout() {
		$checkout_url = WC()->cart->get_checkout_url();

		?>
		<a href="<?php echo $checkout_url; ?>" class="checkout-button button alt wc-forward"><?php _e( 'Proceed to Checkout', 'woocommerce' ); ?></a>
		<?php
	}
}



/** Mini-Cart *************************************************************/

if ( ! function_exists( 'woocommerce_mini_cart' ) ) {

	/**
	 * Output the Mini-cart - used by cart widget
	 *
	 */
	function woocommerce_mini_cart( $args = array() ) {

		$defaults = array(
			'list_class' => ''
		);

		$args = wp_parse_args( $args, $defaults );

		wc_get_template( 'cart/mini-cart.php', $args );
	}
}

/** Login *****************************************************************/

if ( ! function_exists( 'woocommerce_login_form' ) ) {

	/**
	 * Output the WooCommerce Login Form
	 *
	 * @subpackage	Forms
	 */
	function woocommerce_login_form( $args = array() ) {

		$defaults = array(
			'message'  => '',
			'redirect' => '',
			'hidden'   => false
		);

		$args = wp_parse_args( $args, $defaults  );

		wc_get_template( 'global/form-login.php', $args );
	}
}

if ( ! function_exists( 'woocommerce_checkout_login_form' ) ) {

	/**
	 * Output the WooCommerce Checkout Login Form
	 *
	 * @subpackage	Checkout
	 */
	function woocommerce_checkout_login_form() {
		wc_get_template( 'checkout/form-login.php', array( 'checkout' => WC()->checkout() ) );
	}
}

if ( ! function_exists( 'woocommerce_breadcrumb' ) ) {

	/**
	 * Output the WooCommerce Breadcrumb
	 */
	function woocommerce_breadcrumb( $args = array() ) {
		$args = wp_parse_args( $args, apply_filters( 'woocommerce_breadcrumb_defaults', array(
			'delimiter'   => '&nbsp;&#47;&nbsp;',
			'wrap_before' => '<nav class="woocommerce-breadcrumb" ' . ( is_single() ? 'itemprop="breadcrumb"' : '' ) . '>',
			'wrap_after'  => '</nav>',
			'before'      => '',
			'after'       => '',
			'home'        => _x( 'Home', 'breadcrumb', 'woocommerce' )
		) ) );

		$breadcrumbs = new WC_Breadcrumb();

		if ( $args['home'] ) {
			$breadcrumbs->add_crumb( $args['home'], apply_filters( 'woocommerce_breadcrumb_home_url', home_url() ) );
		}

		$args['breadcrumb'] = $breadcrumbs->generate();

		wc_get_template( 'global/breadcrumb.php', $args );
	}
}

if ( ! function_exists( 'woocommerce_order_review' ) ) {

	/**
	 * Output the Order review table for the checkout.
	 *
	 * @subpackage	Checkout
	 */
	function woocommerce_order_review( $deprecated = false ) {
		wc_get_template( 'checkout/review-order.php', array( 'checkout' => WC()->checkout() ) );
	}
}

if ( ! function_exists( 'woocommerce_checkout_payment' ) ) {

	/**
	 * Output the Payment Methods on the checkout
	 *
	 * @subpackage	Checkout
	 */
	function woocommerce_checkout_payment() {
		if ( WC()->cart->needs_payment() ) {
			$available_gateways = WC()->payment_gateways()->get_available_payment_gateways();
			WC()->payment_gateways()->set_current_gateway( $available_gateways );
		} else {
			$available_gateways = array();
		}

		wc_get_template( 'checkout/payment.php', array(
			'checkout'           => WC()->checkout(),
			'available_gateways' => WC()->payment_gateways()->get_available_payment_gateways(),
			'order_button_text'  => apply_filters( 'woocommerce_order_button_text', __( 'Place order', 'woocommerce' ) )
		) );
	}
}

if ( ! function_exists( 'woocommerce_checkout_coupon_form' ) ) {

	/**
	 * Output the Coupon form for the checkout.
	 *
	 * @subpackage	Checkout
	 */
	function woocommerce_checkout_coupon_form() {
		wc_get_template( 'checkout/form-coupon.php', array( 'checkout' => WC()->checkout() ) );
	}
}

if ( ! function_exists( 'woocommerce_products_will_display' ) ) {

	/**
	 * Check if we will be showing products or not (and not subcats only)
	 *
	 * @subpackage	Loop
	 * @return bool
	 */
	function woocommerce_products_will_display() {
		if ( is_shop() )
			return get_option( 'woocommerce_shop_page_display' ) != 'subcategories';

		if ( ! is_product_taxonomy() )
			return false;

		if ( is_search() || is_filtered() || is_paged() )
			return true;

		$term = get_queried_object();

		if ( is_product_category() ) {
			switch ( get_woocommerce_term_meta( $term->term_id, 'display_type', true ) ) {
				case 'subcategories' :
					// Nothing - we want to continue to see if there are products/subcats
				break;
				case 'products' :
				case 'both' :
					return true;
				break;
				default :
					// Default - no setting
					if ( get_option( 'woocommerce_category_archive_display' ) != 'subcategories' )
						return true;
				break;
			}
		}

		// Begin subcategory logic
		global $wpdb;

		$parent_id             = empty( $term->term_id ) ? 0 : $term->term_id;
		$taxonomy              = empty( $term->taxonomy ) ? '' : $term->taxonomy;

		if ( ! $parent_id && ! $taxonomy ) {
			return true;
		}

		$transient_name = 'wc_products_will_display_' . $parent_id . WC_Cache_Helper::get_transient_version( 'product_query' );

		if ( false === ( $products_will_display = get_transient( $transient_name ) ) ) {
			$has_children = $wpdb->get_col( $wpdb->prepare( "SELECT term_id FROM {$wpdb->term_taxonomy} WHERE parent = %d AND taxonomy = %s", $parent_id, $taxonomy ) );

			if ( $has_children ) {
				// Check terms have products inside - parents first. If products are found inside, subcats will be shown instead of products so we can return false.
				if ( sizeof( get_objects_in_term( $has_children, $taxonomy ) ) > 0 ) {
					$products_will_display = false;
				} else {
					// If we get here, the parents were empty so we're forced to check children
					foreach ( $has_children as $term ) {
						$children = get_term_children( $term, $taxonomy );

						if ( sizeof( get_objects_in_term( $children, $taxonomy ) ) > 0 ) {
							$products_will_display = false;
							break;
						}
					}
				}
			} else {
				$products_will_display = true;
			}
		}

		set_transient( $transient_name, $products_will_display, DAY_IN_SECONDS * 30 );

		return $products_will_display;
	}
}

if ( ! function_exists( 'woocommerce_product_subcategories' ) ) {

	/**
	 * Display product sub categories as thumbnails.
	 *
	 * @subpackage	Loop
	 * @param array $args
	 * @return null|boolean
	 */
	function woocommerce_product_subcategories( $args = array() ) {
		global $wp_query;

		$defaults = array(
			'before'        => '',
			'after'         => '',
			'force_display' => false
		);

		$args = wp_parse_args( $args, $defaults );

		extract( $args );

		// Main query only
		if ( ! is_main_query() && ! $force_display ) {
			return;
		}

		// Don't show when filtering, searching or when on page > 1 and ensure we're on a product archive
		if ( is_search() || is_filtered() || is_paged() || ( ! is_product_category() && ! is_shop() ) ) {
			return;
		}

		// Check categories are enabled
		if ( is_shop() && get_option( 'woocommerce_shop_page_display' ) == '' ) {
			return;
		}

		// Find the category + category parent, if applicable
		$term 			= get_queried_object();
		$parent_id 		= empty( $term->term_id ) ? 0 : $term->term_id;

		if ( is_product_category() ) {
			$display_type = get_woocommerce_term_meta( $term->term_id, 'display_type', true );

			switch ( $display_type ) {
				case 'products' :
					return;
				break;
				case '' :
					if ( get_option( 'woocommerce_category_archive_display' ) == '' ) {
						return;
					}
				break;
			}
		}

		// NOTE: using child_of instead of parent - this is not ideal but due to a WP bug ( http://core.trac.wordpress.org/ticket/15626 ) pad_counts won't work
		$product_categories = get_categories( apply_filters( 'woocommerce_product_subcategories_args', array(
			'parent'       => $parent_id,
			'menu_order'   => 'ASC',
			'hide_empty'   => 0,
			'hierarchical' => 1,
			'taxonomy'     => 'product_cat',
			'pad_counts'   => 1
		) ) );

		if ( ! apply_filters( 'woocommerce_product_subcategories_hide_empty', false ) ) {
			$product_categories = wp_list_filter( $product_categories, array( 'count' => 0 ), 'NOT' );
		}

		if ( $product_categories ) {
			echo $before;

			foreach ( $product_categories as $category ) {
				wc_get_template( 'content-product_cat.php', array(
					'category' => $category
				) );
			}

			// If we are hiding products disable the loop and pagination
			if ( is_product_category() ) {
				$display_type = get_woocommerce_term_meta( $term->term_id, 'display_type', true );

				switch ( $display_type ) {
					case 'subcategories' :
						$wp_query->post_count    = 0;
						$wp_query->max_num_pages = 0;
					break;
					case '' :
						if ( get_option( 'woocommerce_category_archive_display' ) == 'subcategories' ) {
							$wp_query->post_count    = 0;
							$wp_query->max_num_pages = 0;
						}
					break;
				}
			}

			if ( is_shop() && get_option( 'woocommerce_shop_page_display' ) == 'subcategories' ) {
				$wp_query->post_count    = 0;
				$wp_query->max_num_pages = 0;
			}

			echo $after;
		}

		return true;
	}
}

if ( ! function_exists( 'woocommerce_subcategory_thumbnail' ) ) {

	/**
	 * Show subcategory thumbnails.
	 *
	 * @param mixed $category
	 * @subpackage	Loop
	 */
	function woocommerce_subcategory_thumbnail( $category ) {
		$small_thumbnail_size  	= apply_filters( 'single_product_small_thumbnail_size', 'shop_catalog' );
		$dimensions    			= wc_get_image_size( $small_thumbnail_size );
		$thumbnail_id  			= get_woocommerce_term_meta( $category->term_id, 'thumbnail_id', true  );

		if ( $thumbnail_id ) {
			$image = wp_get_attachment_image_src( $thumbnail_id, $small_thumbnail_size  );
			$image = $image[0];
		} else {
			$image = wc_placeholder_img_src();
		}

		if ( $image ) {
			// Prevent esc_url from breaking spaces in urls for image embeds
			// Ref: http://core.trac.wordpress.org/ticket/23605
			$image = str_replace( ' ', '%20', $image );

			echo '<img src="' . esc_url( $image ) . '" alt="' . esc_attr( $category->name ) . '" width="' . esc_attr( $dimensions['width'] ) . '" height="' . esc_attr( $dimensions['height'] ) . '" />';
		}
	}
}

if ( ! function_exists( 'woocommerce_order_details_table' ) ) {

	/**
	 * Displays order details in a table.
	 *
	 * @param mixed $order_id
	 * @subpackage	Orders
	 */
	function woocommerce_order_details_table( $order_id ) {
		if ( ! $order_id ) return;

		wc_get_template( 'order/order-details.php', array(
			'order_id' => $order_id
		) );
	}
}


if ( ! function_exists( 'woocommerce_order_again_button' ) ) {

	/**
	 * Display an 'order again' button on the view order page.
	 *
	 * @param object $order
	 * @subpackage	Orders
	 */
	function woocommerce_order_again_button( $order ) {
		if ( ! $order || ! $order->has_status( 'completed' ) || ! is_user_logged_in() ) {
			return;
		}

		wc_get_template( 'order/order-again.php', array(
			'order' => $order
		) );
	}
}

/** Forms ****************************************************************/

if ( ! function_exists( 'woocommerce_form_field' ) ) {

	/**
	 * Outputs a checkout/address form field.
	 *
	 * @subpackage	Forms
	 * @param string $key
	 * @param mixed $args
	 * @param string $value (default: null)
	 * @todo This function needs to be broken up in smaller pieces
	 */
	function woocommerce_form_field( $key, $args, $value = null ) {
		$defaults = array(
			'type'              => 'text',
			'label'             => '',
			'description'       => '',
			'placeholder'       => '',
			'maxlength'         => false,
			'required'          => false,
			'id'                => $key,
			'class'             => array(),
			'label_class'       => array(),
			'input_class'       => array(),
			'return'            => false,
			'options'           => array(),
			'custom_attributes' => array(),
			'validate'          => array(),
			'default'           => '',
		);

		$args = wp_parse_args( $args, $defaults );
		$args = apply_filters( 'woocommerce_form_field_args', $args, $key, $value );

		if ( ( ! empty( $args['clear'] ) ) ) {
			$after = '<div class="clear"></div>';
		} else {
			$after = '';
		}

		if ( $args['required'] ) {
			$args['class'][] = 'validate-required';
			$required = ' <abbr class="required" title="' . esc_attr__( 'required', 'woocommerce'  ) . '">*</abbr>';
		} else {
			$required = '';
		}

		$args['maxlength'] = ( $args['maxlength'] ) ? 'maxlength="' . absint( $args['maxlength'] ) . '"' : '';

		if ( is_string( $args['label_class'] ) ) {
			$args['label_class'] = array( $args['label_class'] );
		}

		if ( is_null( $value ) ) {
			$value = $args['default'];
		}

		// Custom attribute handling
		$custom_attributes = array();

		if ( ! empty( $args['custom_attributes'] ) && is_array( $args['custom_attributes'] ) ) {
			foreach ( $args['custom_attributes'] as $attribute => $attribute_value ) {
				$custom_attributes[] = esc_attr( $attribute ) . '="' . esc_attr( $attribute_value ) . '"';
			}
		}

		if ( ! empty( $args['validate'] ) ) {
			foreach( $args['validate'] as $validate ) {
				$args['class'][] = 'validate-' . $validate;
			}
		}

		switch ( $args['type'] ) {
			case 'country' :

				$countries = $key == 'shipping_country' ? WC()->countries->get_shipping_countries() : WC()->countries->get_allowed_countries();

				if ( sizeof( $countries ) == 1 ) {

					$field = '<p class="form-row ' . esc_attr( implode( ' ', $args['class'] ) ) .'" id="' . esc_attr( $args['id'] ) . '_field">';

					if ( $args['label'] ) {
						$field .= '<label class="' . esc_attr( implode( ' ', $args['label_class'] ) ) .'">' . $args['label']  . '</label>';
					}

					$field .= '<strong>' . current( array_values( $countries ) ) . '</strong>';

					$field .= '<input type="hidden" name="' . esc_attr( $key ) . '" id="' . esc_attr( $args['id'] ) . '" value="' . current( array_keys($countries ) ) . '" ' . implode( ' ', $custom_attributes ) . ' class="country_to_state" />';

					if ( $args['description'] ) {
						$field .= '<span class="description">' . esc_attr( $args['description'] ) . '</span>';
					}

					$field .= '</p>' . $after;

				} else {

					$field = '<p class="form-row ' . esc_attr( implode( ' ', $args['class'] ) ) .'" id="' . esc_attr( $args['id'] ) . '_field">'
							. '<label for="' . esc_attr( $args['id'] ) . '" class="' . esc_attr( implode( ' ', $args['label_class'] ) ) .'">' . $args['label'] . $required  . '</label>'
							. '<select name="' . esc_attr( $key ) . '" id="' . esc_attr( $args['id'] ) . '" class="country_to_state country_select ' . esc_attr( implode( ' ', $args['input_class'] ) ) .'" ' . implode( ' ', $custom_attributes ) . '>'
							. '<option value="">'.__( 'Select a country&hellip;', 'woocommerce' ) .'</option>';

					foreach ( $countries as $ckey => $cvalue ) {
						$field .= '<option value="' . esc_attr( $ckey ) . '" '.selected( $value, $ckey, false ) .'>'.__( $cvalue, 'woocommerce' ) .'</option>';
					}

					$field .= '</select>';

					$field .= '<noscript><input type="submit" name="woocommerce_checkout_update_totals" value="' . __( 'Update country', 'woocommerce' ) . '" /></noscript>';

					if ( $args['description'] ) {
						$field .= '<span class="description">' . esc_attr( $args['description'] ) . '</span>';
					}

					$field .= '</p>' . $after;

				}

				break;
			case 'state' :

				/* Get Country */
				$country_key = $key == 'billing_state'? 'billing_country' : 'shipping_country';
				$current_cc  = WC()->checkout->get_value( $country_key );
				$states      = WC()->countries->get_states( $current_cc );

				if ( is_array( $states ) && empty( $states ) ) {

					$field  = '<p class="form-row ' . esc_attr( implode( ' ', $args['class'] ) ) .'" id="' . esc_attr( $args['id'] ) . '_field" style="display: none">';

					if ( $args['label'] ) {
						$field .= '<label for="' . esc_attr( $args['id'] ) . '" class="' . esc_attr( implode( ' ', $args['label_class'] ) ) .'">' . $args['label'] . $required . '</label>';
					}
					$field .= '<input type="hidden" class="hidden" name="' . esc_attr( $key )  . '" id="' . esc_attr( $args['id'] ) . '" value="" ' . implode( ' ', $custom_attributes ) . ' placeholder="' . esc_attr( $args['placeholder'] ) . '" />';

					if ( $args['description'] ) {
						$field .= '<span class="description">' . esc_attr( $args['description'] ) . '</span>';
					}

					$field .= '</p>' . $after;

				} elseif ( is_array( $states ) ) {

					$field  = '<p class="form-row ' . esc_attr( implode( ' ', $args['class'] ) ) .'" id="' . esc_attr( $args['id'] ) . '_field">';

					if ( $args['label'] )
						$field .= '<label for="' . esc_attr( $args['id'] ) . '" class="' . esc_attr( implode( ' ', $args['label_class'] ) ) .'">' . $args['label']. $required . '</label>';
					$field .= '<select name="' . esc_attr( $key ) . '" id="' . esc_attr( $args['id'] ) . '" class="state_select ' . esc_attr( implode( ' ', $args['input_class'] ) ) .'" ' . implode( ' ', $custom_attributes ) . ' placeholder="' . esc_attr( $args['placeholder'] ) . '">
						<option value="">'.__( 'Select a state&hellip;', 'woocommerce' ) .'</option>';

					foreach ( $states as $ckey => $cvalue ) {
						$field .= '<option value="' . esc_attr( $ckey ) . '" '.selected( $value, $ckey, false ) .'>'.__( $cvalue, 'woocommerce' ) .'</option>';
					}

					$field .= '</select>';

					if ( $args['description'] ) {
						$field .= '<span class="description">' . esc_attr( $args['description'] ) . '</span>';
					}

					$field .= '</p>' . $after;

				} else {

					$field  = '<p class="form-row ' . esc_attr( implode( ' ', $args['class'] ) ) .'" id="' . esc_attr( $args['id'] ) . '_field">';

					if ( $args['label'] ) {
						$field .= '<label for="' . esc_attr( $args['id'] ) . '" class="' . esc_attr( implode( ' ', $args['label_class'] ) ) .'">' . $args['label']. $required . '</label>';
					}
					$field .= '<input type="text" class="input-text ' . esc_attr( implode( ' ', $args['input_class'] ) ) .'" value="' . esc_attr( $value ) . '"  placeholder="' . esc_attr( $args['placeholder'] ) . '" name="' . esc_attr( $key ) . '" id="' . esc_attr( $args['id'] ) . '" ' . implode( ' ', $custom_attributes ) . ' />';

					if ( $args['description'] ) {
						$field .= '<span class="description">' . esc_attr( $args['description'] ) . '</span>';
					}

					$field .= '</p>' . $after;

				}

				break;
			case 'textarea' :

				$field = '<p class="form-row ' . esc_attr( implode( ' ', $args['class'] ) ) .'" id="' . esc_attr( $args['id'] ) . '_field">';

				if ( $args['label'] ) {
					$field .= '<label for="' . esc_attr( $args['id'] ) . '" class="' . esc_attr( implode( ' ', $args['label_class'] ) ) .'">' . $args['label']. $required  . '</label>';
				}

				$field .= '<textarea name="' . esc_attr( $key ) . '" class="input-text ' . esc_attr( implode( ' ', $args['input_class'] ) ) .'" id="' . esc_attr( $args['id'] ) . '" placeholder="' . esc_attr( $args['placeholder'] ) . '" ' . $args['maxlength'] . ' ' . ( empty( $args['custom_attributes']['rows'] ) ? ' rows="2"' : '' ) . ( empty( $args['custom_attributes']['cols'] ) ? ' cols="5"' : '' ) . implode( ' ', $custom_attributes ) . '>'. esc_textarea( $value  ) .'</textarea>';

				if ( $args['description'] ) {
					$field .= '<span class="description">' . esc_attr( $args['description'] ) . '</span>';
				}

				$field .= '</p>' . $after;

				break;
			case 'checkbox' :

				$field = '<p class="form-row ' . esc_attr( implode( ' ', $args['class'] ) ) .'" id="' . esc_attr( $args['id'] ) . '_field">
						<label class="checkbox ' . implode( ' ', $args['label_class'] ) .'" ' . implode( ' ', $custom_attributes ) . '>
						<input type="' . esc_attr( $args['type'] ) . '" class="input-checkbox ' . esc_attr( implode( ' ', $args['input_class'] ) ) .'" name="' . esc_attr( $key ) . '" id="' . esc_attr( $args['id'] ) . '" value="1" '.checked( $value, 1, false ) .' /> '
						 . $args['label'] . $required . '</label>';

				if ( $args['description'] ) {
					$field .= '<span class="description">' . esc_attr( $args['description'] ) . '</span>';
				}

				$field .= '</p>' . $after;

				break;
			case 'password' :

				$field = '<p class="form-row ' . esc_attr( implode( ' ', $args['class'] ) ) .'" id="' . esc_attr( $args['id'] ) . '_field">';

				if ( $args['label'] ) {
					$field .= '<label for="' . esc_attr( $args['id'] ) . '" class="' . esc_attr( implode( ' ', $args['label_class'] ) ) .'">' . $args['label']. $required . '</label>';
				}

				$field .= '<input type="password" class="input-text ' . esc_attr( implode( ' ', $args['input_class'] ) ) .'" name="' . esc_attr( $key ) . '" id="' . esc_attr( $args['id'] ) . '" placeholder="' . esc_attr( $args['placeholder'] ) . '" value="' . esc_attr( $value ) . '" ' . implode( ' ', $custom_attributes ) . ' />';

				if ( $args['description'] ) {
					$field .= '<span class="description">' . esc_attr( $args['description'] ) . '</span>';
				}

				$field .= '</p>' . $after;

				break;
			case 'text' :

				$field = '<p class="form-row ' . esc_attr( implode( ' ', $args['class'] ) ) .'" id="' . esc_attr( $args['id'] ) . '_field">';

				if ( $args['label'] ) {
					$field .= '<label for="' . esc_attr( $args['id'] ) . '" class="' . esc_attr( implode( ' ', $args['label_class'] ) ) .'">' . $args['label'] . $required . '</label>';
				}

				$field .= '<input type="text" class="input-text ' . esc_attr( implode( ' ', $args['input_class'] ) ) .'" name="' . esc_attr( $key ) . '" id="' . esc_attr( $args['id'] ) . '" placeholder="' . esc_attr( $args['placeholder'] ) . '" '.$args['maxlength'].' value="' . esc_attr( $value ) . '" ' . implode( ' ', $custom_attributes ) . ' />';

				if ( $args['description'] ) {
					$field .= '<span class="description">' . esc_attr( $args['description'] ) . '</span>';
				}

				$field .= '</p>' . $after;

				break;
			case 'select' :

				$options = $field = '';

				if ( ! empty( $args['options'] ) ) {
					foreach ( $args['options'] as $option_key => $option_text ) {
						if ( "" === $option_key ) {
							// If we have a blank option, select2 needs a placeholder
							if ( empty( $args['placeholder'] ) ) {
								$args['placeholder'] = $option_text ? $option_text : __( 'Choose an option', 'woocommerce' );
							}
							$custom_attributes[] = 'data-allow_clear="true"';
						}
						$options .= '<option value="' . esc_attr( $option_key ) . '" '. selected( $value, $option_key, false ) . '>' . esc_attr( $option_text ) .'</option>';
					}

					$field = '<p class="form-row ' . esc_attr( implode( ' ', $args['class'] ) ) .'" id="' . esc_attr( $args['id'] ) . '_field">';

					if ( $args['label'] ) {
						$field .= '<label for="' . esc_attr( $args['id'] ) . '" class="' . esc_attr( implode( ' ', $args['label_class'] ) ) .'">' . $args['label']. $required . '</label>';
					}

					$field .= '<select name="' . esc_attr( $key ) . '" id="' . esc_attr( $args['id'] ) . '" class="select '.esc_attr( implode( ' ', $args['input_class'] ) ) .'" ' . implode( ' ', $custom_attributes ) . ' placeholder="' . esc_attr( $args['placeholder'] ) . '">
							' . $options . '
						</select>';

					if ( $args['description'] ) {
						$field .= '<span class="description">' . esc_attr( $args['description'] ) . '</span>';
					}

					$field .= '</p>' . $after;
				}

				break;
			case 'radio' :

				$field = '<p class="form-row ' . esc_attr( implode( ' ', $args['class'] ) ) .'" id="' . esc_attr( $args['id'] ) . '_field">';

				if ( $args['label'] ) {
					$field .= '<label for="' . esc_attr( current( array_keys( $args['options'] ) ) ) . '" class="' . esc_attr( implode( ' ', $args['label_class'] ) ) .'">' . $args['label']. $required  . '</label>';
				}

				if ( ! empty( $args['options'] ) ) {
					foreach ( $args['options'] as $option_key => $option_text ) {
						$field .= '<input type="radio" class="input-radio ' . esc_attr( implode( ' ', $args['input_class'] ) ) .'" value="' . esc_attr( $option_key ) . '" name="' . esc_attr( $key ) . '" id="' . esc_attr( $args['id'] ) . '_' . esc_attr( $option_key ) . '"' . checked( $value, $option_key, false ) . ' />';
						$field .= '<label for="' . esc_attr( $args['id'] ) . '_' . esc_attr( $option_key ) . '" class="radio ' . implode( ' ', $args['label_class'] ) .'">' . $option_text . '</label>';
					}
				}

				$field .= '</p>' . $after;

				break;
			default :

				$field = '';

				break;
		}

		$field = apply_filters( 'woocommerce_form_field_' . $args['type'], $field, $key, $args, $value );

		if ( $args['return'] ) {
			return $field;
		} else {
			echo $field;
		}
	}
}

if ( ! function_exists( 'get_product_search_form' ) ) {

	/**
	 * Display product search form.
	 *
	 * Will first attempt to locate the product-searchform.php file in either the child or
	 * the parent, then load it. If it doesn't exist, then the default search form
	 * will be displayed.
	 *
	 * The default searchform uses html5.
	 *
	 * @subpackage	Forms
	 * @param bool $echo (default: true)
	 * @return string
	 */
	function get_product_search_form( $echo = true  ) {
		ob_start();

		do_action( 'pre_get_product_search_form'  );

		wc_get_template( 'product-searchform.php' );

		$form = apply_filters( 'get_product_search_form', ob_get_clean() );

		if ( $echo ) {
			echo $form;
		} else {
			return $form;
		}
	}
}
