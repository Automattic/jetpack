<?php

/**
 * WordPress.com Site Helper Private Site Logged-in Banner
 */
namespace Private_Site;

function show_logged_in_banner() {
	// Launching a site and all privacy features only work properly when Jetpack is connected
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

	?>
	<div id="wpcom-launch-banner-wrapper">
		<div class="wpcom-launch-banner" id="wpcom-launch-banner">
			<style id="wpcom-launch-banner-style">
				<?php include( __DIR__.'/logged-in-banner.css' ) ?>
			</style>
			<div class="launch-banner-content">
				<img src="<?php echo esc_url( plugins_url( 'launch-image.svg', __FILE__ ) ) ?>" class="launch-banner-image" width="170" />
				<div class="launch-banner-text">
					<?php
					if ( $is_site_launched && ! $is_not_coming_soon_mode ) {
						_e( "Your site is marked as \"Coming Soon\" and hidden from visitors until it's ready.", 'wpcomsh' );
					} elseif ( ! $is_site_launched ) {
						_e( "Your site hasn't been launched yet. Only you can see it until it is launched.", 'wpcomsh' );
					} else {
						_e( "Your site has been launched; now you can share it with the world!", 'wpcomsh' );
					}
					?>
				</div>

				<?php if ( blog_user_can( 'manage_options' ) ) { ?>
					<div class="launch-banner-button">
						<button class="dismiss-button" onclick="javascript:document.getElementById('wpcom-launch-banner-wrapper').style.display='none'"><?php _e( "Dismiss" ); ?></button>
						<?php

						if ( ! $is_site_launched || ! $is_not_coming_soon_mode ) {
							$site_slug = \Jetpack::build_raw_urls( get_home_url() );
							$button_text = __( 'Launch site', 'wpcomsh' );
							$site_privacy_settings_url = 'https://wordpress.com/start/launch-site?siteSlug=' . $site_slug . '&returnTo=home';

							if ( $is_site_launched && ! $is_not_coming_soon_mode ) {
								$button_text =  __( 'Update visibility', 'wpcomsh' );
								$site_privacy_settings_url = 'https://wordpress.com/settings/general/' . $site_slug . '#site-privacy-settings';
							}
							?>
							<a target="_parent" href='<?php echo esc_url( $site_privacy_settings_url ); ?>' rel="noopener noreferrer" >
								<input type="button" class="launch-site-button" value="<?php echo esc_attr( $button_text ) ?>" />
							</a>
							<?php
						}
						?>
					</div>
				<?php } ?>

			</div>
		</div>
	</div>
	<script>
		<?php /* Minimize the banner contents jumping around by hiding and un-hiding when the page is loaded. */ ?>
		( function() {
			var el = document.querySelector( '#wpcom-launch-banner-wrapper' );
			if ( !el ) {
				return;
			}

			el.style.display = 'none';
			document.addEventListener( 'DOMContentLoaded', function() {
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
		} )();
	</script>
	<?
}