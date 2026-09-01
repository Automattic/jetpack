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

	// Check dismissal early — most users will have dismissed over time.
	if ( get_user_meta( get_current_user_id(), 'wpcom_ai_assistant_banner_dismissed', true ) ) {
		return false;
	}

	if ( ! function_exists( 'wpcom_site_has_feature' ) || ! wpcom_site_has_feature( WPCOM_Features::BIG_SKY ) ) {
		return false;
	}

	// Don't show on Big Sky sites.
	if ( wpcom_has_blog_sticker( 'big-sky-enabled', get_wpcom_blog_id() ) ) {
		return false;
	}

	// Don't show if AI assistant is already enabled.
	if ( class_exists( 'Big_Sky' ) && get_option( 'big_sky_enable', '1' ) ) {
		return false;
	}

	if ( function_exists( 'get_user_attribute' ) ) {
		$user_id = get_current_user_id();

		// Don't show if user has opted out of AI features.
		if ( '1' === get_user_attribute( $user_id, 'ai_features_opted_out' ) ) {
			return false;
		}

		// Don't show if user has unsubscribed from AI Tips emails.
		if ( '1' === get_user_attribute( $user_id, 'notifications_wpcom_email_ai_tips' ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Renders the AI assistant banner markup.
 */
function wpcom_render_ai_assistant_banner() {
	$site_slug = wpcom_get_site_slug();
	$cta_url   = wpcom_get_calypso_origin() . '/sites/' . $site_slug . '/settings/ai-tools';
	$nonce     = wp_create_nonce( 'dismiss_ai_assistant_banner' );
	?>
	<div id="wpcom-ai-assistant-banner" class="notice is-dismissible" style="border-left-color: #3858E9;" data-nonce="<?php echo esc_attr( $nonce ); ?>">
		<div class="wpcom-ai-assistant-banner__layout">
			<svg width="24" height="24" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M391.528 188.061L309.455 159.75C276.997 148.597 251.403 123.003 240.25 90.5451L211.939 8.47185C208.079 -2.82395 191.921 -2.82395 188.061 8.47185L159.75 90.5451C148.597 123.003 123.003 148.597 90.5451 159.75L8.47185 188.061C-2.82395 191.921 -2.82395 208.079 8.47185 211.939L90.5451 240.25C123.003 251.403 148.597 276.997 159.75 309.455L188.061 391.528C191.921 402.824 208.079 402.824 211.939 391.528L240.25 309.455C251.403 276.997 276.997 251.403 309.455 240.25L391.528 211.939C402.824 208.079 402.824 191.921 391.528 188.061ZM295.728 206.077L254.692 220.232C238.391 225.809 225.666 238.677 220.089 254.835L205.934 295.871C203.932 301.591 195.925 301.591 193.923 295.871L179.768 254.835C174.191 238.534 161.323 225.809 145.165 220.232L104.129 206.077C98.4093 204.075 98.4093 196.068 104.129 194.066L145.165 179.911C161.466 174.334 174.191 161.466 179.768 145.308L193.923 104.272C195.925 98.5523 203.932 98.5523 205.934 104.272L220.089 145.308C225.666 161.609 238.534 174.334 254.692 179.911L295.728 194.066C301.448 196.068 301.448 204.075 295.728 206.077Z" fill="#3858E9"/>
			</svg>
			<div class="wpcom-ai-assistant-banner__body">
				<div class="wpcom-ai-assistant-banner__text">
					<strong><?php esc_html_e( 'Bring AI to your site.', 'jetpack-mu-wpcom' ); ?></strong><br>
					<?php esc_html_e( 'Opt-in to get site-aware assistance where you write and design.', 'jetpack-mu-wpcom' ); ?>
				</div>
				<a href="<?php echo esc_url( $cta_url ); ?>" class="button-secondary">
					<?php esc_html_e( 'Enable AI assistant', 'jetpack-mu-wpcom' ); ?>
				</a>
			</div>
		</div>
	</div>
	<style>
		#wpcom-ai-assistant-banner .wpcom-ai-assistant-banner__layout {
			display: flex;
			align-items: center;
			gap: 16px;
			padding: 4px 0;
		}
		#wpcom-ai-assistant-banner .wpcom-ai-assistant-banner__layout > svg {
			flex-shrink: 0;
		}
		#wpcom-ai-assistant-banner .wpcom-ai-assistant-banner__body {
			display: flex;
			align-items: center;
			gap: 16px;
			flex: 1;
		}
		#wpcom-ai-assistant-banner .wpcom-ai-assistant-banner__text {
			flex: 1;
		}
		#wpcom-ai-assistant-banner .button-secondary {
			white-space: nowrap;
		}
		#wpcom-ai-assistant-banner .notice-dismiss {
			top: 50%;
			transform: translateY(-50%);
		}
		#wpcom-ai-assistant-banner .notice-dismiss:before {
			content: "\2715";
			font-family: inherit;
			color: #787c82;
			background: none;
		}
		@media ( max-width: 782px ) {
			#wpcom-ai-assistant-banner .wpcom-ai-assistant-banner__layout {
				align-items: flex-start;
				gap: 8px;
			}
			#wpcom-ai-assistant-banner .wpcom-ai-assistant-banner__layout > svg {
				width: 18px;
				height: 18px;
				margin-top: 4px;
			}
			/* Stack the copy and button, keeping both aligned to the text column rather than under the icon. */
			#wpcom-ai-assistant-banner .wpcom-ai-assistant-banner__body {
				flex-direction: column;
				align-items: flex-start;
				gap: 12px;
			}
			#wpcom-ai-assistant-banner .wpcom-ai-assistant-banner__text {
				font-size: 13px;
				line-height: 1.5;
			}
			#wpcom-ai-assistant-banner .wpcom-ai-assistant-banner__text strong {
				font-size: 14px;
			}
			/* Keep the dismiss control top-right like every other notice, lined up with the title. */
			#wpcom-ai-assistant-banner .notice-dismiss {
				top: 8px;
				transform: none;
			}
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

	add_action( 'admin_notices', 'wpcom_render_ai_assistant_banner', 1 );

	jetpack_mu_wpcom_enqueue_assets( 'ai-assistant-banner', array( 'js' ) );
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
