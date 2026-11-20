<?php
/**
 * AI Assistant Banner for the WordPress.com dashboard.
 *
 * Displays a banner prompting Business/Commerce admins to set up AI tools until
 * they dismiss it or both the WordPress Agent and MCP access have been on once.
 * Works on both Simple and Atomic sites via cross-platform utilities.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;
use Automattic\Jetpack\Status\Host;

// The audience helpers live in the AI Launchpad feature, loaded by a different
// loader method; require them directly so the props can never silently degrade.
require_once __DIR__ . '/../ai-launchpad/helpers.php';

/**
 * Determines whether the current user is eligible for the AI assistant banner.
 *
 * Eligible users see it while either tool is off, until they dismiss it or
 * both tools have been on once for that user.
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
 * Whether MCP access is enabled for the current user on this site.
 *
 * A short cache avoids repeated WordPress.com requests on Atomic Dashboards.
 *
 * @return bool|null True when on, false when off, or null when unavailable.
 */
function wpcom_ai_assistant_banner_mcp_enabled() {
	$blog_id = get_wpcom_blog_id();
	if ( ! $blog_id ) {
		return null;
	}

	$is_simple = ( new Host() )->is_wpcom_simple();
	$cache_key = 'wpcom_ai_banner_mcp_' . $blog_id . '_' . get_current_user_id();
	if ( ! $is_simple ) {
		$cached = get_transient( $cache_key );
		if ( in_array( $cached, array( 'on', 'off', 'unavailable' ), true ) ) {
			return 'unavailable' === $cached ? null : 'on' === $cached;
		}
	}

	$path     = sprintf( '/sites/%d/mcp-abilities', $blog_id );
	$response = $is_simple
		? Client::wpcom_json_api_request_as_blog( $path, '2', array( 'method' => 'GET' ), null, 'wpcom' )
		: Client::wpcom_json_api_request_as_user( $path, '2', array( 'method' => 'GET' ), null, 'wpcom' );

	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
		if ( ! $is_simple ) {
			set_transient( $cache_key, 'unavailable', MINUTE_IN_SECONDS );
		}
		return null;
	}

	$data = json_decode( wp_remote_retrieve_body( $response ), true );
	if ( ! is_array( $data ) || ! array_key_exists( 'has_mcp_plan', $data ) ) {
		if ( ! $is_simple ) {
			set_transient( $cache_key, 'unavailable', MINUTE_IN_SECONDS );
		}
		return null;
	}

	if ( ! $data['has_mcp_plan'] ) {
		if ( ! $is_simple ) {
			set_transient( $cache_key, 'unavailable', 5 * MINUTE_IN_SECONDS );
		}
		return null;
	}

	if ( ! isset( $data['site_level_enabled'] ) ) {
		if ( ! $is_simple ) {
			set_transient( $cache_key, 'unavailable', MINUTE_IN_SECONDS );
		}
		return null;
	}

	$enabled = (bool) $data['site_level_enabled'];
	if ( ! $is_simple ) {
		set_transient( $cache_key, $enabled ? 'on' : 'off', 5 * MINUTE_IN_SECONDS );
	}
	return $enabled;
}

/**
 * Data for the banner's script: Tracks props and banner visibility.
 *
 * @param string $screen_id The current admin screen id.
 * @return array{trackProps: array<string,string>, shouldShowBanner: string}
 */
function wpcom_ai_assistant_banner_script_data( $screen_id ) {
	$agent_enabled         = wpcom_is_wordpress_agent_enabled();
	$agent_and_mcp_enabled = $agent_enabled ? wpcom_ai_assistant_banner_mcp_enabled() : null;

	// Dismiss for this user once both tools are on, so later loads skip the MCP check.
	if ( true === $agent_and_mcp_enabled ) {
		wpcom_ai_assistant_banner_record_dismissal( true );
	}

	return array(
		'trackProps'       => wpcom_ai_assistant_banner_tracks_props( $screen_id ),
		'shouldShowBanner' => ( ! $agent_enabled || false === $agent_and_mcp_enabled ) ? '1' : '0',
	);
}

/**
 * Tracks props shared by the banner's three events, per the AI events standard.
 *
 * @param string $screen_id The current admin screen id.
 * @return array<string,string>
 */
function wpcom_ai_assistant_banner_tracks_props( $screen_id ) {
	$purchases = function_exists( 'wpcom_expiry_get_purchases' ) ? wpcom_expiry_get_purchases() : array();
	// Real plan bundles only: the expiry picker's slug fallback would also match
	// add-ons such as Professional Email Premium ("premium" substring).
	$bundles  = wp_list_filter( (array) $purchases, array( 'product_type' => 'bundle' ) );
	$plan     = class_exists( Expiry_Data::class ) ? Expiry_Data::pick_primary_plan_purchase( $bundles ) : null;
	$has_slug = $plan && isset( $plan->product_slug ) && is_string( $plan->product_slug ) && '' !== $plan->product_slug;

	return array(
		'channel'      => 'web',
		'surface'      => 'dashboard',
		// Deliberately the WP screen id, not $pagenow — AI Launchpad's hardcoded
		// 'admin.php' uses the other vocabulary for the same standard prop.
		'screen'       => (string) $screen_id,
		// Two buckets, mirroring AI Launchpad: this package ships only on Simple and
		// Atomic (wpcomsh, mu-wpcom-plugin). Add a self-hosted branch if the banner
		// ever moves into the Jetpack plugin.
		'site_type'    => ( new Host() )->is_wpcom_simple() ? 'simple' : 'atomic',
		// The AI events standard wants the string "none" over an empty value.
		'product_slug' => $has_slug ? $plan->product_slug : 'none',
		'is_test'      => function_exists( 'wpcom_ai_launchpad_is_test' ) && wpcom_ai_launchpad_is_test() ? 'true' : 'false',
		'is_a11n'      => function_exists( 'wpcom_ai_launchpad_is_a11n' ) && wpcom_ai_launchpad_is_a11n() ? 'true' : 'false',
	);
}

/**
 * Renders the AI assistant banner markup.
 */
function wpcom_render_ai_assistant_banner() {
	$site_slug = wpcom_get_site_slug();
	$cta_url   = wpcom_get_calypso_origin() . '/sites/' . $site_slug . '/settings/ai-tools';
	$nonce     = wp_create_nonce( 'dismiss_ai_assistant_banner' );
	// With the WordPress Agent already on, the banner starts hidden and the script
	// reveals it only if MCP access is still off.
	?>
	<div id="wpcom-ai-assistant-banner" class="notice is-dismissible" style="border-left-color: #3858E9;" data-nonce="<?php echo esc_attr( $nonce ); ?>"<?php echo wpcom_is_wordpress_agent_enabled() ? ' hidden' : ''; ?>>
		<div class="wpcom-ai-assistant-banner__layout">
			<svg width="24" height="24" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M391.528 188.061L309.455 159.75C276.997 148.597 251.403 123.003 240.25 90.5451L211.939 8.47185C208.079 -2.82395 191.921 -2.82395 188.061 8.47185L159.75 90.5451C148.597 123.003 123.003 148.597 90.5451 159.75L8.47185 188.061C-2.82395 191.921 -2.82395 208.079 8.47185 211.939L90.5451 240.25C123.003 251.403 148.597 276.997 159.75 309.455L188.061 391.528C191.921 402.824 208.079 402.824 211.939 391.528L240.25 309.455C251.403 276.997 276.997 251.403 309.455 240.25L391.528 211.939C402.824 208.079 402.824 191.921 391.528 188.061ZM295.728 206.077L254.692 220.232C238.391 225.809 225.666 238.677 220.089 254.835L205.934 295.871C203.932 301.591 195.925 301.591 193.923 295.871L179.768 254.835C174.191 238.534 161.323 225.809 145.165 220.232L104.129 206.077C98.4093 204.075 98.4093 196.068 104.129 194.066L145.165 179.911C161.466 174.334 174.191 161.466 179.768 145.308L193.923 104.272C195.925 98.5523 203.932 98.5523 205.934 104.272L220.089 145.308C225.666 161.609 238.534 174.334 254.692 179.911L295.728 194.066C301.448 196.068 301.448 204.075 295.728 206.077Z" fill="#3858E9"/>
			</svg>
			<div class="wpcom-ai-assistant-banner__body">
				<div class="wpcom-ai-assistant-banner__text">
					<strong><?php esc_html_e( 'Build and manage your site with AI.', 'jetpack-mu-wpcom' ); ?></strong><br>
					<?php esc_html_e( 'Use ChatGPT, Claude, or the WordPress Agent to edit, design, and handle everyday site tasks.', 'jetpack-mu-wpcom' ); ?>
				</div>
				<a href="<?php echo esc_url( $cta_url ); ?>" class="button-secondary">
					<?php esc_html_e( 'Set up AI tools', 'jetpack-mu-wpcom' ); ?>
				</a>
			</div>
		</div>
	</div>
	<style>
		#wpcom-ai-assistant-banner[hidden] {
			display: none;
		}
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

	$asset_handle = jetpack_mu_wpcom_enqueue_assets( 'ai-assistant-banner', array( 'js' ) );
	wp_localize_script(
		$asset_handle,
		'wpcomAiAssistantBanner',
		wpcom_ai_assistant_banner_script_data( $screen->id )
	);
}
add_action( 'current_screen', 'wpcom_maybe_add_ai_assistant_banner' );

/**
 * Record the current user's dismissal of the AI assistant banner.
 *
 * @param bool $automatic Whether both AI tools were enabled.
 */
function wpcom_ai_assistant_banner_record_dismissal( $automatic = false ) {
	update_user_meta( get_current_user_id(), 'wpcom_ai_assistant_banner_dismissed', $automatic ? time() : 1 );
}

/**
 * AJAX handler to dismiss the AI assistant banner.
 */
function wpcom_dismiss_ai_assistant_banner() {
	check_ajax_referer( 'dismiss_ai_assistant_banner', 'nonce' );
	wpcom_ai_assistant_banner_record_dismissal();
	wp_send_json_success( null, 200, JSON_UNESCAPED_SLASHES );
}
add_action( 'wp_ajax_dismiss_ai_assistant_banner', 'wpcom_dismiss_ai_assistant_banner' );
