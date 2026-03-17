<?php
/**
 * AI Assistant Banner for the WordPress.com dashboard.
 *
 * Displays a banner prompting Business/Commerce admins to enable the AI assistant.
 * Works on both Simple and Atomic sites via cross-platform utilities.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Determines whether the AI assistant banner should be shown to the current user.
 *
 * @return bool
 */
function wpcom_should_show_ai_assistant_banner() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return false;
	}

	if ( ! wpcom_site_has_feature( 'ai-assistant' ) ) {
		return false;
	}

	// Don't show on Big Sky sites.
	if ( get_option( 'site_intent' ) === 'ai-assembler' ) {
		return false;
	}
	if ( wpcom_has_blog_sticker( 'big-sky-enabled', get_wpcom_blog_id() ) ) {
		return false;
	}

	// Don't show if already dismissed.
	if ( get_user_meta( get_current_user_id(), 'wpcom_ai_assistant_banner_dismissed', true ) ) {
		return false;
	}

	// Don't show if user has opted out of AI features (Simple sites only).
	if ( function_exists( 'get_user_attribute' ) && '1' === get_user_attribute( get_current_user_id(), 'ai_features_opted_out' ) ) {
		return false;
	}

	return true;
}

/**
 * Renders the AI assistant banner markup.
 */
function wpcom_render_ai_assistant_banner() {
	$site_slug = wp_parse_url( home_url(), PHP_URL_HOST );
	$cta_url   = 'https://wordpress.com/sites/' . $site_slug . '/settings/ai-tools';
	$nonce     = wp_create_nonce( 'dismiss_ai_assistant_banner' );
	?>
	<div id="wpcom-ai-assistant-banner" class="notice wpcom-ai-assistant-banner" data-nonce="<?php echo esc_attr( $nonce ); ?>">
		<div class="wpcom-ai-assistant-banner__content">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="wpcom-ai-assistant-banner__icon">
				<path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="#E65054"/>
			</svg>
			<div class="wpcom-ai-assistant-banner__text">
				<strong><?php esc_html_e( 'Bring AI to your site.', 'jetpack-mu-wpcom' ); ?></strong>
				<span><?php esc_html_e( 'Enable the AI assistant to help you create content, optimize your site, and more.', 'jetpack-mu-wpcom' ); ?></span>
			</div>
			<a href="<?php echo esc_url( $cta_url ); ?>" class="button button-primary wpcom-ai-assistant-banner__cta">
				<?php esc_html_e( 'Enable AI', 'jetpack-mu-wpcom' ); ?>
			</a>
		</div>
		<button type="button" class="notice-dismiss wpcom-ai-assistant-banner__dismiss">
			<span class="screen-reader-text"><?php esc_html_e( 'Dismiss this notice.', 'jetpack-mu-wpcom' ); ?></span>
		</button>
	</div>
	<style>
		.wpcom-ai-assistant-banner {
			display: flex;
			align-items: center;
			padding: 12px 16px;
			border-left-color: #E65054;
			position: relative;
		}
		.wpcom-ai-assistant-banner__content {
			display: flex;
			align-items: center;
			gap: 12px;
			flex: 1;
		}
		.wpcom-ai-assistant-banner__icon {
			flex-shrink: 0;
		}
		.wpcom-ai-assistant-banner__text {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.wpcom-ai-assistant-banner__dismiss {
			position: static;
			flex-shrink: 0;
			margin-left: 8px;
		}
	</style>
	<?php
}

/**
 * Conditionally adds the AI assistant banner on the dashboard screen.
 */
function wpcom_maybe_add_ai_assistant_banner() {
	$screen = get_current_screen();
	if ( ! $screen || 'dashboard' !== $screen->id ) {
		return;
	}

	if ( ! wpcom_should_show_ai_assistant_banner() ) {
		return;
	}

	add_action( 'admin_notices', 'wpcom_render_ai_assistant_banner' );

	wp_register_script_module(
		'wpcom-tracks-module',
		plugin_dir_url( __FILE__ ) . '../../common/tracks.js',
		array(),
		'20250604'
	);

	wp_enqueue_script_module(
		'wpcom-ai-assistant-banner',
		plugin_dir_url( __FILE__ ) . 'js/ai-assistant-banner.js',
		array( 'wpcom-tracks-module', 'jquery' ),
		'20250604'
	);
}
add_action( 'current_screen', 'wpcom_maybe_add_ai_assistant_banner' );

/**
 * AJAX handler to dismiss the AI assistant banner.
 */
function wpcom_dismiss_ai_assistant_banner() {
	check_ajax_referer( 'dismiss_ai_assistant_banner', 'nonce' );
	update_user_meta( get_current_user_id(), 'wpcom_ai_assistant_banner_dismissed', '1' );
	wp_send_json_success( null, 200, JSON_UNESCAPED_SLASHES );
}
add_action( 'wp_ajax_dismiss_ai_assistant_banner', 'wpcom_dismiss_ai_assistant_banner' );
