<?php
/**
 * Subscribe modal popup feature
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 2.2.1
 */

/**
 * Adds a Subscribe Modal template part that can be edited in the editor.
 * This is later loaded in a pop up modal for Newsletter sites.
 *
 * @return void
 */
function wpcom_create_subscribe_template() {
	if ( should_enable_subscriber_modal() ) {
		$post = get_page_by_path( get_subscribe_template_slug(), OBJECT, 'wp_template_part' );

		if ( ! $post ) {
			$template = array(
				'slug'         => get_subscribe_template_slug(),
				'post_name'    => get_subscribe_template_slug(),
				'post_title'   => get_subscribe_template_title(),
				'post_content' => get_subscribe_template_content(),
				'post_status'  => 'publish',
				'post_author'  => 1,
				'post_type'    => 'wp_template_part',
				'scope'        => array(),
				'tax_input'    => array(
					'wp_theme' => get_option( 'stylesheet' ),
				),
			);
			wp_insert_post( $template );
		}
	}
}
add_action( 'wp_loaded', 'wpcom_create_subscribe_template' );

/**
 * Adds modal with Subscribe Modal content.
 *
 * @return void
 */
function wpcom_add_subscribe_modal_to_frontend() {
	if ( should_enable_subscriber_modal() && ! is_admin() ) {
		$posts = get_posts(
			array(
				'post_type'   => 'wp_template_part',
				'post_status' => 'publish',
				'numberposts' => -1,
			)
		);

		$subscribe_template = reset(
			array_filter(
				$posts,
				function ( $post ) {
					return $post->post_name === get_subscribe_template_slug();
				}
			)
		);

		$blocks = parse_blocks( $subscribe_template->post_content );

		/*
		 * Jetpack requires escaping html for the render_block() call below.
		 * I'm using wp_kses() and specifying the allowed tags.
		 * But this is fragile: users can edit the Subscribe Modal
		 * template and add tags that are not allowed here.
		 */
		$allowed_html = array(
			'div'    => array(
				'class' => array(),
				'style' => array(),
			),
			'h2'     => array(
				'class' => array(),
				'style' => array(),
			),
			'p'      => array(
				'type'  => array(),
				'class' => array(),
				'style' => array(),
				'id'    => array(),
			),
			'form'   => array(
				'action'                 => array(),
				'method'                 => array(),
				'accept-charset'         => array(),
				'data-blog'              => array(),
				'data-post_access_level' => array(),
				'id'                     => array(),
			),
			'label'  => array(
				'id'    => array(),
				'for'   => array(),
				'class' => array(),
			),
			'input'  => array(
				'id'          => array(),
				'type'        => array(),
				'name'        => array(),
				'value'       => array(),
				'class'       => array(),
				'style'       => array(),
				'placeholder' => array(),
				'required'    => array(),
			),
			'button' => array(
				'type'  => array(),
				'class' => array(),
				'style' => array(),
			),
		);

		?>
			<div id="wpcom-subscribe-modal">
				<div class="modal-content">
					<?php
					foreach ( $blocks as $block ) {
						echo wp_kses( render_block( $block ), $allowed_html );
					}
					?>
					<div id="close"><a href="#">Close</a></div>
				</div>
			</div>
		<?php
	}
}
add_action( 'wp_footer', 'wpcom_add_subscribe_modal_to_frontend' );

/**
 * Enqueues JS to load modal.
 *
 * @return void
 */
function wpcom_enqueue_subscribe_modal_assets() {
	if ( should_enable_subscriber_modal() && ! is_admin() ) {
		wp_enqueue_style( 'subscribe-modal-css', plugins_url( 'subscribe-modal.css', __FILE__ ), array(), JETPACK__VERSION );
		wp_enqueue_script( 'subscribe-modal-js', plugins_url( 'subscribe-modal.js', __FILE__ ), array(), JETPACK__VERSION, true );
	}
}
add_action( 'wp_enqueue_scripts', 'wpcom_enqueue_subscribe_modal_assets' );

/**
 * Returns true if we should enable Newsletter content.
 * This is currently limited to lettre theme or newsletter sites.
 * We could open it to all themes or site intents.
 *
 * @return bool
 */
function should_enable_subscriber_modal() {
	$is_lettre          = get_option( 'stylesheet' ) === 'lettre';
	$is_newsletter_site = get_option( 'site_intent' ) === 'newsletter';

	// TODO: check if newsletter feature setting is enabled
	// TODO: check if site goals include newsletter
	return $is_lettre || $is_newsletter_site;
}

/**
 * Returns the slug for the Subcribe template.
 *
 * @return string
 */
function get_subscribe_template_slug() {
	return 'subscribe-modal';
}

/**
 * Returns the title for the Subcribe template.
 *
 * @return string
 */
function get_subscribe_template_title() {
	return 'Subscribe Modal';
}

/**
 * Returns the initial content of the Subscribe Modal template.
 * This can then be edited by the user.
 *
 * @return string
 */
function get_subscribe_template_content() {
	return '<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
	<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><!-- wp:heading {"textAlign":"center"} -->
	<h2 class="wp-block-heading has-text-align-center">This post is for subscribers</h2>
	<!-- /wp:heading -->
	
	<!-- wp:paragraph {"align":"center","style":{"spacing":{"margin":{"bottom":"var:preset|spacing|60"}}}} -->
	<p class="has-text-align-center" style="margin-bottom:var(--wp--preset--spacing--60)">Subscribe to to keep reading and get access to the full archive.</p>
	<!-- /wp:paragraph -->
	
	<!-- wp:jetpack/subscriptions {"buttonBackgroundColor":"primary","textColor":"secondary","borderRadius":50,"borderColor":"primary","className":"is-style-compact"} /--></div>
	<!-- /wp:group -->';
}
