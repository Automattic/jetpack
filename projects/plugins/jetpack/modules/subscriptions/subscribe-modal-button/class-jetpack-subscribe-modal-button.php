<?php
/**
 * Adds support for a local pop-up shown when a visitor clicks a "Button
 * only" style Subscribe block, before the subscribe.wordpress.com checkout
 * iframe opens.
 *
 * @package automattic/jetpack
 * @since $$next-version$$
 */

/**
 * Jetpack_Subscribe_Modal_Button class.
 */
class Jetpack_Subscribe_Modal_Button {
	/**
	 * Jetpack_Subscribe_Modal_Button singleton instance.
	 *
	 * @var Jetpack_Subscribe_Modal_Button|null
	 */
	private static $instance;

	/**
	 * Jetpack_Subscribe_Modal_Button instance init.
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new Jetpack_Subscribe_Modal_Button();
		}

		return self::$instance;
	}

	const BLOCK_TEMPLATE_PART_SLUG = 'jetpack-subscribe-modal-button';

	/**
	 * Returns the block template part ID.
	 *
	 * @return string
	 */
	public static function get_block_template_part_id() {
		return get_stylesheet() . '//' . self::BLOCK_TEMPLATE_PART_SLUG;
	}

	/**
	 * Jetpack_Subscribe_Modal_Button class constructor.
	 */
	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'wp_footer', array( $this, 'add_subscribe_modal_button_to_frontend' ) );
		add_filter( 'get_block_template', array( $this, 'get_block_template_filter' ), 10, 3 );
	}

	/**
	 * Enqueues the pop-up's stylesheet. Unlike Jetpack_Subscribe_Modal, this
	 * pop-up is click-triggered rather than scroll/timer-triggered, so it's
	 * printed unconditionally (cheap no-op if no "Button only" Subscribe
	 * block is present on the page — nothing ever opens it).
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		wp_enqueue_style( 'subscribe-modal-button-css', plugins_url( 'subscribe-modal-button.css', __FILE__ ), array(), JETPACK__VERSION );
		wp_enqueue_script( 'subscribe-modal-button-js', plugins_url( 'subscribe-modal-button.js', __FILE__ ), array( 'wp-dom-ready' ), JETPACK__VERSION, true );
	}

	/**
	 * Adds the (initially closed) pop-up markup to the page footer.
	 *
	 * @return void
	 */
	public function add_subscribe_modal_button_to_frontend() {
		?>
		<div class="jetpack-subscribe-modal-button">
			<div class="jetpack-subscribe-modal-button__modal-content">
				<?php block_template_part( self::BLOCK_TEMPLATE_PART_SLUG ); ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Makes get_block_template return the WP_Block_Template for this pop-up.
	 *
	 * @param WP_Block_Template $block_template The block template to be returned.
	 * @param string            $id Template unique identifier (example: theme_slug//template_slug).
	 * @param string            $template_type Template type: `'wp_template'` or '`wp_template_part'`.
	 *
	 * @return WP_Block_Template
	 */
	public function get_block_template_filter( $block_template, $id, $template_type ) {
		if ( empty( $block_template ) && $template_type === 'wp_template_part' ) {
			if ( $id === self::get_block_template_part_id() ) {
				return $this->get_template();
			}
		}

		return $block_template;
	}

	/**
	 * Returns a custom template for the pop-up.
	 *
	 * @return WP_Block_Template
	 */
	public function get_template() {
		$template                 = new WP_Block_Template();
		$template->theme          = get_stylesheet();
		$template->slug           = self::BLOCK_TEMPLATE_PART_SLUG;
		$template->id             = self::get_block_template_part_id();
		$template->area           = 'uncategorized';
		$template->content        = $this->get_subscribe_modal_button_template_content();
		$template->source         = 'plugin';
		$template->type           = 'wp_template_part';
		$template->title          = __( 'Jetpack Subscribe button modal', 'jetpack' );
		$template->status         = 'publish';
		$template->has_theme_file = false;
		$template->is_custom      = true;
		$template->description    = __( 'The pop-up shown when a visitor clicks a "Button only" style Subscribe block.', 'jetpack' );

		return $template;
	}

	/**
	 * Returns the initial content of the pop-up template.
	 * This can then be edited by the user.
	 *
	 * Seeds the heading from the legacy `subscribe_modal_heading` site
	 * setting when present, so a site that already customized it via the
	 * Newsletter settings page doesn't silently lose that text the first
	 * time this ships. Once the owner edits this template part directly, the
	 * template part becomes the sole source of truth for the heading.
	 *
	 * @return string
	 */
	public function get_subscribe_modal_button_template_content() {
		$subscription_options = (array) get_option( 'subscription_options', array() );
		$legacy_heading       = isset( $subscription_options['subscribe_modal_heading'] )
			? trim( (string) $subscription_options['subscribe_modal_heading'] )
			: '';
		$heading_text         = '' !== $legacy_heading
			? $legacy_heading
			: __( 'Subscribe now to stay ahead and never miss a beat!', 'jetpack' );

		$group_block_name = esc_attr__( 'Subscribe button pop-up container', 'jetpack' );

		return <<<HTML
	<!-- wp:group {"metadata":{"name":"$group_block_name"},"style":{"spacing":{"padding":{"top":"32px","bottom":"32px","left":"32px","right":"32px"},"margin":{"top":"0","bottom":"0"}},"border":{"color":"#dddddd","width":"1px"}},"layout":{"type":"constrained","contentSize":"450px"}} -->
	<div class="wp-block-group has-border-color" style="border-color:#dddddd;border-width:1px;margin-top:0;margin-bottom:0;padding-top:32px;padding-right:32px;padding-bottom:32px;padding-left:32px">

	<!-- wp:heading {"textAlign":"center","level":3,"style":{"typography":{"fontStyle":"normal","fontWeight":"600","fontSize":"22px"},"spacing":{"margin":{"top":"4px","bottom":"10px"}}}} -->
		<h3 class="wp-block-heading has-text-align-center" style="margin-top:4px;margin-bottom:10px;font-size:22px;font-style:normal;font-weight:600">$heading_text</h3>
		<!-- /wp:heading -->

		<!-- wp:jetpack/subscriptions {"borderRadius":50,"className":"is-style-compact","appSource":"subscribe-modal-button"} /-->
	</div>
	<!-- /wp:group -->
HTML;
	}
}

Jetpack_Subscribe_Modal_Button::init();

add_action(
	'rest_api_switched_to_blog',
	function () {
		Jetpack_Subscribe_Modal_Button::init();
	}
);
