<?php
/**
 * Functions for adding functionality for DIFM sites using hooks.
 *
 * @package automattic/jetpack-mu-plugins
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Class WPCOM_DIFM_Express
 */
class WPCOM_DIFM_Express {
	/**
	 * Setup filters needed for DIFM functionality on WoA sites.
	 * The hooks are setup if the DIFM sticker is active on the website.
	 * Hooks are not setup if the user is proxied. This allows A12s to access the full site.
	 */
	public static function setup_hooks() {
		if ( self::is_not_proxied_and_is_difm_in_progress() ) {
			// Sites with the DIFM sticker should always show the Coming Soon page.
			add_filter( 'a8c_show_coming_soon_page', '__return_true' );

			add_filter( 'admin_menu', array( __CLASS__, 'difm_admin_menu' ), 999 );

			add_action( 'admin_head', array( __CLASS__, 'hide_dashboard_content' ) );

			add_action( 'admin_notices', array( __CLASS__, 'show_difm_admin_notice' ) );

			// Sites with the DIFM sticker should never show the admin bar.
			add_filter( 'show_admin_bar', '__return_false' );
		}
	}

	/**
	 * Returns if the site has the DIFM sticker active
	 */
	private static function is_difm_in_progress() {
		$difm_sticker = 'difm-lite-in-progress';

		if ( function_exists( 'has_blog_sticker' ) && has_blog_sticker( $difm_sticker ) ) {
			return true;
		}
		if ( function_exists( 'wpcomsh_is_site_sticker_active' ) && wpcomsh_is_site_sticker_active( $difm_sticker ) ) {
			return true;
		}
	}

	/**
	 * Returns whether the current request is coming from the a8c proxy.
	 */
	private static function is_request_proxied() {
		return isset( $_SERVER['A8C_PROXIED_REQUEST'] )
			? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
			: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;
	}

	/**
	 * Returns if the user is NOT proxied and if the site is part of a DIFM site build
	 */
	private static function is_not_proxied_and_is_difm_in_progress() {
		return ! self::is_request_proxied() && self::is_difm_in_progress();
	}

	/**
	 * Returns whether a submenu slug should be hidden for sites with the DIFM sticker active.
	 * Returns false if the submenu slug is for Email, Domains or Purchases.
	 *
	 * @param string $submenu_slug The submenu slug.
	 */
	private static function should_remove_submenu( $submenu_slug ): bool {
		$submenu_paths_to_keep = array(
			'https://wordpress.com/email',
			'https://wordpress.com/domain',
			'https://wordpress.com/purchases',
		);
		foreach ( $submenu_paths_to_keep as $submen_path ) {
			if ( strpos( $submenu_slug, $submen_path ) === 0 ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Remove menu items if the DIFM sticker is active
	 */
	public static function difm_admin_menu() {
		global $menu, $submenu;

		if ( get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
			return;
		}

		$wpcom_hosting_menu_slug = 'wpcom-hosting-menu';
		foreach ( $menu as $menu_item ) {
			if ( $menu_item[2] !== $wpcom_hosting_menu_slug ) {
				remove_menu_page( $menu_item[2] );
			}
		}

		if ( isset( $submenu ) ) {
			foreach ( $submenu as $parent_slug => $submenu_items ) {
				if ( $parent_slug === $wpcom_hosting_menu_slug ) {
					foreach ( $submenu_items as $submenu_item ) {
						if ( self::should_remove_submenu( $submenu_item[2] ) ) {
							remove_submenu_page( $parent_slug, $submenu_item[2] );
						}
					}
				}
			}
		}
	}

	/**
	 * Hide dashboard content if the DIFM sticker is active.
	 */
	public static function hide_dashboard_content() {
		echo '<style>
			#wpbody-content > * {
				display: none;
			}
			#wpbody-content > .wrap {
				display: block;
			}
			#wpbody-content > .wrap > * {
				display: none;
			}
			#wpbody-content > .wrap > .notice {
				display: block;
			}
		</style>';
	}

	/**
	 * Show an admin notice if the DIFM sticker is active.
	 */
	public static function show_difm_admin_notice() {
		$domain = wp_parse_url( home_url(), PHP_URL_HOST );

		$response = Client::wpcom_json_api_request_as_user( "sites/$domain/do-it-for-me/website-content" );
		if ( is_wp_error( $response ) ) {
			return;
		}

		$result = json_decode( wp_remote_retrieve_body( $response ) );

		$is_website_content_submitted = $result->is_website_content_submitted ?? false;

		if ( $is_website_content_submitted ) : ?>
			<div class="notice" style="text-align:center; padding:20px; border:0; background:none; box-shadow: none;">
				<img src="https://wordpress.com/calypso/images/site-build-in-progress-9b47a2a89d806fce3e9d.svg" alt="Site Build in Progress" style="max-width: 100%; height: auto; margin-bottom: 10px;">
				<h2 class="empty-content__title" style="font-family: Recoleta, Noto Serif, Georgia, Times New Roman, Times, serif; font-size:34px; font-weight:400; margin:0"><?php esc_html_e( 'Your content submission was successful!', 'jetpack-mu-wpcom' ); ?></h2>
				<p style="font-size:16px"><?php esc_html_e( "We are currently building your site and will send you an email when it's ready, within 4 business days.", 'jetpack-mu-wpcom' ); ?></p>
				<?php // translators: %s is an email address. ?>
				<p style="font-size:16px"><?php echo wp_kses_post( sprintf( __( '<a href="%s">Contact Support</a> if you have any questions.', 'jetpack-mu-wpcom' ), 'mailto:services+express@wordpress.com' ) ); ?></p>
			</div>
		<?php else : ?>
			<div class="notice" style="text-align:center; padding:20px; border:0; background:none; box-shadow: none;">
				<img src="https://wordpress.com/calypso/images/site-build-in-progress-9b47a2a89d806fce3e9d.svg" alt="Site Build in Progress" style="max-width: 100%; height: auto; margin-bottom: 10px;">
				<h2 class="empty-content__title" style="font-family: Recoleta, Noto Serif, Georgia, Times New Roman, Times, serif; font-size:34px; font-weight:400; margin:0"><?php esc_html_e( 'Website content not submitted', 'jetpack-mu-wpcom' ); ?></h2>
				<p style="font-size:16px">
					<?php esc_html_e( 'Click the button below to provide the content we need to build your site.', 'jetpack-mu-wpcom' ); ?>
					<br/>
					<?php // translators: %s is an email address. ?>
					<?php echo wp_kses_post( sprintf( __( '<a href="%s">Contact Support</a> if you have any questions.', 'jetpack-mu-wpcom' ), 'mailto:services+express@wordpress.com' ) ); ?>
				</p>
				<p>
					<a class="button-primary" href="<?php echo esc_attr( "https://wordpress.com/start/site-content-collection/website-content?siteSlug=$domain" ); ?>"><?php esc_html_e( 'Provide website content', 'jetpack-mu-wpcom' ); ?></a>
				</p>
			</div>
			<?php
		endif;
	}
}

WPCOM_DIFM_Express::setup_hooks();