<?php
/**
 * WordPress.com Site Helper Private Site Logged-in Banner.
 *
 * @package private-site
 */

namespace Private_Site;

use Automattic\Jetpack\Status;

/**
 * Shows the logged-in banner.
 */
function show_logged_in_banner() {
	// Launching a site and all privacy features only work properly when Jetpack is connected.
	if ( ! is_jetpack_connected() ) {
		return;
	}

	// Logged-out users and non-members shouldn't make it this far, but just in case.
	if ( should_prevent_site_access() ) {
		return;
	}

	// The site is not private or in public coming soon mode, return early to prevent indicating otherwise.
	if ( ! site_is_private() && ! site_is_public_coming_soon() ) {
		return;
	}

	// The site is being previewed in Calypso or Gutenberg.
	if ( is_site_preview() ) {
		return;
	}

	// In this scenario, a site is 'launched' if it's explicitly launched or came before Private by Default.
	$is_site_launched = is_launched() || '' === site_launch_status();

	// The site is being used as a Private site.
	if ( $is_site_launched && site_is_private() && ! site_is_coming_soon() ) {
		return;
	}

	$is_not_coming_soon_mode = ! site_is_coming_soon() && ! site_is_public_coming_soon();

	// Older sites might not have a launch status, but can still be coming soon.
	if ( '' === site_launch_status() && $is_not_coming_soon_mode ) {
		return;
	}

	// Hide banner for agency-managed sites.
	if ( ! empty( get_option( 'is_fully_managed_agency_site' ) ) ) {
		return;
	}

	/**
	 * Filter to make it possible for the launch banner to be hidden.
	 *
	 * One such use case is for eCommerce trials, where users can only launch after upgrading.
	 *
	 * @since 3.11.11
	 * @param bool $should_show_logged_in_banner Should the launch banner be shown to the current logged-in user. Defaults to true.
	 */
	$should_show_logged_in_banner = apply_filters( 'wpcomsh_private_site_show_logged_in_banner', true );
	if ( ! $should_show_logged_in_banner ) {
		return;
	}

	$blog_domain = ( new Status() )->get_site_suffix();

	$my_home_url      = 'https://wordpress.com/home/' . $blog_domain;
	$change_theme_url = 'https://wordpress.com/themes/' . $blog_domain;

	$is_launchpad_enabled = get_option( 'launchpad_screen' ) === 'full';
	$site_intent          = get_option( 'site_intent' );
	$launchpad_url        = 'https://wordpress.com/setup/' . $site_intent . '/launchpad?siteSlug=' . $blog_domain;

	$is_coming_soon_mode         = site_is_coming_soon() || site_is_public_coming_soon();
	$is_launched_and_coming_soon = $is_site_launched && $is_coming_soon_mode;

	$launch_url         = '';
	$launch_text        = '';
	$launch_text_mobile = '';
	if ( $is_launched_and_coming_soon ) {
		$launch_url         = 'https://wordpress.com/settings/general/' . $blog_domain . '#site-privacy-settings';
		$launch_text        = __( 'Update visibility', 'wpcomsh' );
		$launch_text_mobile = __( 'Update', 'wpcomsh' );
	} elseif ( ! $is_site_launched ) {
		$launch_url         = 'https://wordpress.com/start/launch-site?siteSlug=' . $blog_domain . '&source=site';
		$launch_text        = __( 'Launch site', 'wpcomsh' );
		$launch_text_mobile = __( 'Launch', 'wpcomsh' );
	}

	$edit_url    = '';
	$post_type   = get_post_type();
	$path_prefix = '';
	if ( is_singular() && in_array( $post_type, array( 'post', 'page' ), true ) ) {
		$path_prefix = $post_type;
	} elseif ( is_singular() && in_array( $post_type, apply_filters( 'rest_api_allowed_post_types', array( 'post', 'page', 'revision' ) ), true ) ) {
		$path_prefix = sprintf( 'edit/%s', $post_type );
	}

	if ( ! empty( $path_prefix ) ) {
		$edit_url = sprintf( 'https://wordpress.com/%s/%s/%d', $path_prefix, $blog_domain, get_the_ID() );
	}

	$bar_controls = array();

	if ( ! empty( $path_prefix ) ) {
		ob_start();
		?>
		<a href="<?php echo esc_url( $edit_url ); ?>" target="_blank" rel="noopener noreferrer">
			<svg class="icon icon-edit" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M1.397 11.858L0.866564 11.3278L0.685098 11.5094L0.652921 11.764L1.397 11.858ZM1 15L0.255916 14.906L0.133382 15.8757L1.1018 15.7431L1 15ZM4.14583 14.569L4.24764 15.3121L4.4971 15.2779L4.6754 15.1001L4.14583 14.569ZM14.6061 4.1389L14.0846 3.59977L14.0765 3.60781L14.6061 4.1389ZM14.6061 2.28131L14.076 2.81203L14.0846 2.82038L14.6061 2.28131ZM13.7171 1.39346L13.1786 1.91563L13.1871 1.92411L13.7171 1.39346ZM11.8572 1.39346L12.3877 1.92374L12.3957 1.91556L11.8572 1.39346ZM0.652921 11.764L0.255916 14.906L1.74408 15.094L2.14109 11.9521L0.652921 11.764ZM1.1018 15.7431L4.24764 15.3121L4.04403 13.8259L0.898197 14.2569L1.1018 15.7431ZM4.6754 15.1001L15.1356 4.67L14.0765 3.60781L3.61627 14.0379L4.6754 15.1001ZM15.1275 4.67797C15.3244 4.48754 15.481 4.25948 15.5879 4.00731L14.207 3.4216C14.1786 3.48853 14.137 3.54916 14.0846 3.59983L15.1275 4.67797ZM15.5879 4.00731C15.6949 3.75513 15.75 3.48402 15.75 3.21011H14.25C14.25 3.28275 14.2354 3.35467 14.207 3.4216L15.5879 4.00731ZM15.75 3.21011C15.75 2.93619 15.6949 2.66508 15.5879 2.4129L14.207 2.99861C14.2354 3.06554 14.25 3.13746 14.25 3.21011H15.75ZM15.5879 2.4129C15.481 2.16073 15.3244 1.93267 15.1275 1.74224L14.0846 2.82038C14.137 2.87105 14.1786 2.93167 14.207 2.99861L15.5879 2.4129ZM15.1361 1.75065L14.2471 0.862801L13.1871 1.92411L14.0761 2.81196L15.1361 1.75065ZM14.2555 0.871351C14.0649 0.674719 13.8366 0.518422 13.5844 0.4117L12.9999 1.79314C13.0672 1.8216 13.128 1.86325 13.1787 1.91556L14.2555 0.871351ZM13.5844 0.4117C13.3321 0.30498 13.061 0.25 12.7872 0.25V1.75C12.8603 1.75 12.9326 1.76468 12.9999 1.79314L13.5844 0.4117ZM12.7872 0.25C12.5133 0.25 12.2422 0.30498 11.99 0.4117L12.5744 1.79314C12.6417 1.76468 12.7141 1.75 12.7872 1.75V0.25ZM11.99 0.4117C11.7377 0.518421 11.5095 0.674718 11.3188 0.871351L12.3957 1.91556C12.4464 1.86325 12.5072 1.8216 12.5744 1.79314L11.99 0.4117ZM11.3268 0.863238L0.866564 11.3278L1.92744 12.3883L12.3877 1.92368L11.3268 0.863238Z" />
				<path d="M10.6924 3.15381L12.875 5.34619" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			<span class="is-mobile"><?php esc_html_e( 'Edit', 'wpcomsh' ); ?></span>
			<span class="is-desktop"><?php is_single() ? esc_html_e( 'Edit post', 'wpcomsh' ) : esc_html_e( 'Edit page', 'wpcomsh' ); ?></span>
		</a>
		<?php
		$bar_controls['edit-item'] = ob_get_clean();
	}
	ob_start();
	?>
	<a href="<?php echo esc_url( $change_theme_url ); ?>" target="_blank" rel="noopener noreferrer">
		<svg class="icon icon-theme" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M3 7.6665H17" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M7.66687 16.9998V7.6665" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			<rect x="3" y="3" width="14" height="14" rx="1" stroke-width="1.5"/>
		</svg>
		<span class="is-mobile"><?php esc_html_e( 'Change', 'wpcomsh' ); ?></span>
		<span class="is-desktop"><?php esc_html_e( 'Change theme', 'wpcomsh' ); ?></span>
	</a>
	<?php
	$bar_controls['change-theme'] = ob_get_clean();
	ob_start();
	?>
	<a href="<?php echo esc_url( $launch_url ); ?>" target="_parent" rel="noopener noreferrer">
		<svg class="icon icon-launch" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
			<path d="M8.99994 16.5C13.1421 16.5 16.4999 13.1421 16.4999 9C16.4999 4.85786 13.1421 1.5 8.99994 1.5C4.8578 1.5 1.49994 4.85786 1.49994 9C1.49994 13.1421 4.8578 16.5 8.99994 16.5Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M1.49994 9H16.4999" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M8.99994 1.5C10.8759 3.55376 11.942 6.21903 11.9999 9C11.942 11.781 10.8759 14.4462 8.99994 16.5C7.12398 14.4462 6.05787 11.781 5.99994 9C6.05787 6.21903 7.12398 3.55376 8.99994 1.5V1.5Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
		<span class="is-mobile"><?php echo esc_html( $launch_text_mobile ); ?></span>
		<span class="is-desktop"><?php echo esc_html( $launch_text ); ?></span>
	</a>
	<?php
	$bar_controls['launch-site'] = ob_get_clean();

	$bar_controls = apply_filters( 'wpcom_launch_bar_controls', $bar_controls );

	if ( ! is_array( $bar_controls ) || empty( $bar_controls ) ) {
		return;
	}

	?>
	<div class="launch-banner-wrapper" id="wpcom-launch-banner-wrapper">
		<style id="wpcom-launch-banner-style">
				<?php include __DIR__ . '/style.css'; ?>
		</style>
		<div class="launch-banner" id="launch-banner">
			<div class="launch-banner-content">
				<div class="launch-banner-section my-home-button">
					<a href="<?php echo $is_launchpad_enabled ? esc_url( $launchpad_url ) : esc_url( $my_home_url ); ?>">
						<svg class="icon icon-home" width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M6.5 2L1.5 7L6.5 12" stroke-width="1.5" stroke-linecap="square"/>
						</svg>
						<span class="is-desktop"><?php $is_launchpad_enabled ? esc_html_e( 'Next steps', 'wpcomsh' ) : esc_html_e( 'My Home', 'wpcomsh' ); ?></span>
					</a>
				</div>
				<div class="launch-banner-section bar-controls">
					<?php
					foreach ( $bar_controls as $bar_control ) {
						echo $bar_control; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					}
					?>
				</div>
				<div class="launch-banner-section dismiss-button">
					<button>
						<svg class="icon icon-dismiss" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M4.34643 4L15.9997 16M3.99966 16L15.6529 4" stroke-width="1.5"/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
	<script>
		launchBarUserData = {
			blogId: <?php echo method_exists( '\Jetpack_Options', 'get_option' ) ? (int) \Jetpack_Options::get_option( 'id' ) : get_current_blog_id(); ?>,
			isAtomic: true,
		};
		<?php /* Minimize the banner contents jumping around by hiding and un-hiding when the page is loaded. */ ?>
		( function() {
			var el = document.querySelector( '#wpcom-launch-banner-wrapper' );
			if ( !el ) {
				return;
			}

			el.style.display = 'none';
			document.addEventListener( 'DOMContentLoaded', function() {
				// Don't show the banner if the site is previewed via an iframe.
				if ( window.top !== window.self ) {
					return;
				}

				var el = document.querySelector( '#wpcom-launch-banner-wrapper' );
				if ( el ) {
					el.style.display = null;
				}
			} );
		} )();
		<?php /* Wrap in Shadow DOM whenever possible to avoid CSS collisions. */ ?>
		( function() {
			var CAN_SHADOW = !!( document.head.attachShadow || document.head.createShadowRoot );
			if ( CAN_SHADOW ) {
				var el = document.querySelector( '#wpcom-launch-banner-wrapper' );
				var html = el.innerHTML;
				el.innerHTML = '';
				var shadow = el.attachShadow( { mode: 'open' } );
				shadow.innerHTML = html;
			}

			// Handle dismiss event.
			const container     = document.querySelector( '#wpcom-launch-banner-wrapper' );
			const dismissButton = ( CAN_SHADOW ) ? container.shadowRoot.querySelector( '.dismiss-button button' ) : container.querySelector( '.dismiss-button button' );
			dismissButton.addEventListener( 'click', function() {
				container.style.display = 'none';
			});
		} )();
	</script>
	<?php
}
