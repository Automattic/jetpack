<?php
/**
 * Jetpack_Memberships: wrapper for memberships functions.
 *
 * @package    Jetpack
 * @since      7.3.0
 */

/**
 * Class Jetpack_Memberships
 * This class represents the Memberships functionality.
 */
class Jetpack_Memberships {
	/**
	 * CSS class prefix to use in the styling.
	 *
	 * @var string
	 */
	public static $css_classname_prefix = 'jetpack-memberships';
	/**
	 * Our CPT type for the product (plan).
	 *
	 * @var string
	 */
	public static $post_type_plan = 'jp_mem_plan';
	/**
	 * Option that will store currently set up account (Stripe etc) id for memberships.
	 *
	 * @var string
	 */
	public static $connected_account_id_option_name = 'jetpack-memberships-connected-account-id';
	/**
	 * Button block type to use.
	 *
	 * @var string
	 */
	private static $button_block_name = 'recurring-payments';
	/**
	 * The prefix for transients storing cached subscriber statuses.
	 *
	 * @var string
	 */
	private static $subscriber_transient_prefix = 'jetpack-payments-subscriber-';
	/**
	 * Cookie name for subscriber session token.
	 * The tokens are identifying WPCOM user_id on WPCOM side.
	 *
	 * @var string
	 */
	private static $subscriber_cookie_name = 'jetpack-payments-subscriber-token';
	/**
	 * Subscriber session token. This value should come from cookie or a redirect.
	 *
	 * @var string
	 */
	private $subscriber_token_value = '';
	/**
	 * Cache for the subscriber data for the current session.
	 *
	 * @var array
	 */
	private $subscriber_data = array();
	/**
	 * Array of post IDs where we don't want to render blocks anymore.
	 *
	 * @var array
	 */
	private $stop_render_for_posts = array();
	/**
	 * These are defaults for wp_kses ran on the membership button.
	 *
	 * @var array
	 */
	private static $tags_allowed_in_the_button = array( 'br' => array() );
	/**
	 * Classic singleton pattern
	 *
	 * @var Jetpack_Memberships
	 */
	private static $instance;

	/**
	 * Jetpack_Memberships constructor.
	 */
	private function __construct() {}

	/**
	 * The actual constructor initializing the object.
	 *
	 * @return Jetpack_Memberships
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
			self::$instance->register_init_hook();
		}

		return self::$instance;
	}
	/**
	 * Get the map that defines the shape of CPT post. keys are names of fields and
	 * 'meta' is the name of actual WP post meta field that corresponds.
	 *
	 * @return array
	 */
	private static function get_plan_property_mapping() {
		$meta_prefix = 'jetpack_memberships_';
		$properties  = array(
			'price'    => array(
				'meta' => $meta_prefix . 'price',
			),
			'currency' => array(
				'meta' => $meta_prefix . 'currency',
			),
		);
		return $properties;
	}

	/**
	 * Inits further hooks on init hook.
	 */
	private function register_init_hook() {
		add_action( 'init', array( $this, 'init_hook_action' ) );
	}

	/**
	 * This reads the user cookie or a redirect value and sets the user session token.
	 * User session tokens correspond to a WPCOM user id.
	 */
	private function setup_session_token() {
		global $_GET, $_COOKIE;
		// TODO: We need to hook into the various caching plugins as well, to whitelist this cookie.
		if ( isset( $_GET[ self::$subscriber_cookie_name ] ) ) {
			$this->subscriber_token_value = $_GET[ self::$subscriber_cookie_name ];
			setcookie( self::$subscriber_cookie_name, $this->subscriber_token_value, time() + 90 * 24 * 3600, COOKIEPATH, COOKIE_DOMAIN );
		} elseif ( isset( $_COOKIE[ self::$subscriber_cookie_name ] ) ) {
			$this->subscriber_token_value = $_COOKIE[ self::$subscriber_cookie_name ];
		}
	}

	/**
	 * Get current subscriber data. Tries to get from cache whenever possible, only in last resort does a WPCOM call to get data.
	 * Cache expires every hour per user.
	 *
	 * @return array
	 */
	public function get_subscriber_data() {
		// If we have stored data that we read previously, we return it.
		if ( $this->subscriber_data ) {
			return $this->subscriber_data;
		}
		// If we don't know the token of the current customer, return false.
		if ( ! $this->subscriber_token_value ) {
			return array(
				'type'       => 'anon',
				'subscribed' => false,
			);
		}
		// If we have this data cached in the transient.
		$transient_data = get_transient( self::$subscriber_transient_prefix . $this->subscriber_token_value );
		if ( $transient_data ) {
			$this->subscriber_data = $transient_data;
			return $transient_data;
		}
		// Ok, looks like we have no data cached on either side. Let us get this data.
		$request  = sprintf( '/sites/%s/memberships/reader_token/%s/', Jetpack_Options::get_option( 'id' ), $this->subscriber_token_value );
		$response = Jetpack_Client::wpcom_json_api_request_as_blog( $request, '1.1' );
		if ( is_wp_error( $response ) ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log(
					sprintf(
						/* translators: 1- error code, 2 - error message */
						__( 'We have encountered an error [%1$s] while communicating with WordPress.com servers: %2$s', 'jetpack' ),
						$response->get_error_code(),
						$response->get_error_message()
					)
				);
			}
			$this->subscriber_data = array(
				'type'       => 'error',
				'subscribed' => false,
			);
		}
		$data = isset( $response['body'] ) ? json_decode( $response['body'], true ) : null;
		if ( 200 !== $response['response']['code'] && $data['code'] && $data['message'] ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log(
					sprintf(
						/* translators: 1- error code, 2 - error message */
						__( 'We have encountered an error [%1$s] after communicating with WordPress.com servers: %2$s', 'jetpack' ),
						$data['code'],
						$data['message']
					)
				);
			}
			$this->subscriber_data = array(
				'type'       => 'error',
				'subscribed' => false,
			);
		} else {
			$this->subscriber_data = $data;
		}
		// We want a transient also in case of an error. We don't want to spam servers in case of errors.
		set_transient( self::$subscriber_transient_prefix . $this->subscriber_token_value, $data, time() + 3600 );
		return $this->subscriber_data;
	}
	/**
	 * Actual hooks initializing on init.
	 */
	public function init_hook_action() {
		add_filter( 'rest_api_allowed_post_types', array( $this, 'allow_rest_api_types' ) );
		add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'allow_sync_post_meta' ) );
		$this->setup_cpts();
		$this->setup_session_token();
		$this->setup_paywall();
	}

	/**
	 * Sets up the custom post types for the module.
	 */
	private function setup_cpts() {
		/*
		 * PLAN data structure.
		 */
		$capabilities = array(
			'edit_post'          => 'edit_posts',
			'read_post'          => 'read_private_posts',
			'delete_post'        => 'delete_posts',
			'edit_posts'         => 'edit_posts',
			'edit_others_posts'  => 'edit_others_posts',
			'publish_posts'      => 'publish_posts',
			'read_private_posts' => 'read_private_posts',
		);
		$order_args   = array(
			'label'               => esc_html__( 'Plan', 'jetpack' ),
			'description'         => esc_html__( 'Recurring Payments plans', 'jetpack' ),
			'supports'            => array( 'title', 'custom-fields', 'content' ),
			'hierarchical'        => false,
			'public'              => false,
			'show_ui'             => false,
			'show_in_menu'        => false,
			'show_in_admin_bar'   => false,
			'show_in_nav_menus'   => false,
			'can_export'          => true,
			'has_archive'         => false,
			'exclude_from_search' => true,
			'publicly_queryable'  => false,
			'rewrite'             => false,
			'capabilities'        => $capabilities,
			'show_in_rest'        => false,
		);
		register_post_type( self::$post_type_plan, $order_args );
	}

	/**
	 * Allows custom post types to be used by REST API.
	 *
	 * @param array $post_types - other post types.
	 *
	 * @see hook 'rest_api_allowed_post_types'
	 * @return array
	 */
	public function allow_rest_api_types( $post_types ) {
		$post_types[] = self::$post_type_plan;

		return $post_types;
	}

	/**
	 * Allows custom meta fields to sync.
	 *
	 * @param array $post_meta - previously changet post meta.
	 *
	 * @return array
	 */
	public function allow_sync_post_meta( $post_meta ) {
		$meta_keys = array_map(
			array( $this, 'return_meta' ),
			$this->get_plan_property_mapping()
		);
		return array_merge( $post_meta, array_values( $meta_keys ) );
	}

	/**
	 * This returns meta attribute of passet array.
	 * Used for array functions.
	 *
	 * @param array $map - stuff.
	 *
	 * @return mixed
	 */
	public function return_meta( $map ) {
		return $map['meta'];
	}

	/**
	 * Hooks into the 'render_block' filter in order to block content access.
	 */
	private function setup_paywall() {
		add_filter( 'render_block', array( $this, 'do_paywall_for_block' ), 10, 2 );
	}

	/**
	 * This is hooked into `render_block` filter.
	 * The purpose is to not render any blocks following the paywall block.
	 * This is achieved by storing the list of post_IDs where rendering of the blocks has been turned off.
	 * If we are trying to render a block in one of these posts, we return empty string.
	 *
	 * @param string $block_content - rendered block.
	 * @param array  $block - block metadata.
	 *
	 * @return string
	 */
	public function do_paywall_for_block( $block_content, $block ) {
		global $post;
		// Not in post context.
		if ( ! $post ) {
			return $block_content;
		}
		// This block itself is immune. This is checked before block is rendered, so it would not render the block itself.
		if ( 'jetpack/' . self::$button_block_name === $block['blockName'] ) {
			return $block_content;
		}
		// This will intercept rendering of any block after this one.
		if ( in_array( $post->ID, $this->stop_render_for_posts ) ) {
			return '';
		}
		return $block_content;
	}

	/**
	 * Marks the rest of the current post as Paywalled. This will stop rendering any further blocks on this post.
	 *
	 * @see $this::do_paywall_for_block.
	 */
	private function paywall_the_post() {
		global $post;
		$this->stop_render_for_posts[] = $post->ID;
	}
	/**
	 * Callback that parses the membership purchase shortcode.
	 *
	 * @param array $attrs - attributes in the shortcode. `id` here is the CPT id of the plan.
	 *
	 * @return string
	 */
	public function render_button( $attrs ) {
		Jetpack_Gutenberg::load_assets_as_required( self::$button_block_name, array( 'thickbox', 'wp-polyfill' ) );

		if ( empty( $attrs['planId'] ) ) {
			return;
		}
		$id      = intval( $attrs['planId'] );
		$product = get_post( $id );
		if ( ! $product || is_wp_error( $product ) ) {
			return;
		}
		if ( $product->post_type !== self::$post_type_plan || 'publish' !== $product->post_status ) {
			return;
		}

		$data = array(
			'blog_id'      => self::get_blog_id(),
			'id'           => $id,
			'button_label' => __( 'Your contribution', 'jetpack' ),
			'powered_text' => __( 'Powered by WordPress.com', 'jetpack' ),
		);

		if ( ! $attrs['paywall'] ) {
			return $this->get_purchase_button( $attrs, $data );
		}
		$subscriber_data = $this->get_subscriber_data();
		// User is logged in.
		// TODO: some more fallback.
		if ( 'anon' !== $subscriber_data['type'] ) {
			return '';
		}
		// We know the user is anonymous.
		$this->paywall_the_post();
		$login_link = $this->get_login_link( $data );

		$purchase_button    = $this->get_purchase_button( $attrs, $data );
		$subscriber_message = '';
		if ( isset( $attrs['subscriberMessage'] ) ) {
			$subscriber_message = $attrs['subscriberMessage'];
		}
		$classes = array(
			self::$css_classname_prefix . '-subscriber-message',
			self::$css_classname_prefix . '-' . $data['id'] . '-subscriber-message',
		);
		// TODO: This needs better customization.
		return "<div>{$purchase_button}<br/>{$login_link}</div>" . sprintf( '<div class="%s">%s</div>', esc_html( $classes ), $subscriber_message );
	}

	/**
	 * Get login URL for WPCOM login flow.
	 *
	 * @param array $data - Plan data.
	 *
	 * @return string
	 */
	private function get_login_link( $data ) {
		$current_url = urlencode( ( isset( $_SERVER['HTTPS'] ) ? 'https' : 'http' ) . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]" );
		return "<a href='https://subscribe.wordpress.com/status/?blog={$data['blog_id']}&redirect_url={$current_url}'>LOG IN</a></div>";
	}

	/**
	 * Get the HTML for the purchase button.
	 *
	 * @param array $attrs - block attributes.
	 * @param array $data - data for the payment plan.
	 *
	 * @return string
	 */
	private function get_purchase_button( $attrs, $data ) {
		$classes = array(
			'wp-block-button__link',
			'components-button',
			'is-primary',
			'is-button',
			'wp-block-jetpack-' . self::$button_block_name,
			self::$css_classname_prefix . '-' . $data['id'],
		);
		if ( isset( $attrs['className'] ) ) {
			array_push( $classes, $attrs['className'] );
		}
		if ( isset( $attrs['submitButtonText'] ) ) {
			$data['button_label'] = $attrs['submitButtonText'];
		}
		$button_styles = array();
		if ( ! empty( $attrs['customBackgroundButtonColor'] ) ) {
			array_push(
				$button_styles,
				sprintf(
					'background-color: %s',
					sanitize_hex_color( $attrs['customBackgroundButtonColor'] )
				)
			);
		}
		if ( ! empty( $attrs['customTextButtonColor'] ) ) {
			array_push(
				$button_styles,
				sprintf(
					'color: %s',
					sanitize_hex_color( $attrs['customTextButtonColor'] )
				)
			);
		}
		$button_styles = implode( $button_styles, ';' );
		add_thickbox();

		return sprintf(
			'<button data-blog-id="%d" data-powered-text="%s" data-plan-id="%d" data-lang="%s" class="%s" style="%s">%s</button>',
			esc_attr( $data['blog_id'] ),
			esc_attr( $data['powered_text'] ),
			esc_attr( $data['id'] ),
			esc_attr( get_locale() ),
			esc_attr( implode( $classes, ' ' ) ),
			esc_attr( $button_styles ),
			wp_kses( $data['button_label'], self::$tags_allowed_in_the_button )
		);
	}


	/**
	 * Get current blog id.
	 *
	 * @return int
	 */
	public static function get_blog_id() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return get_current_blog_id();
		}

		return Jetpack_Options::get_option( 'id' );
	}

	/**
	 * Get the id of the connected payment acount (Stripe etc).
	 *
	 * @return int|void
	 */
	public static function get_connected_account_id() {
		return get_option( self::$connected_account_id_option_name );
	}
}
Jetpack_Memberships::get_instance();
