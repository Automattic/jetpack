<?php
/**
 * Transitional "Subscribers moved" announcement page.
 *
 * When the Newsletter modernization filter is enabled, the unified
 * Jetpack → Newsletter page owns subscriber management and the legacy
 * "Subscribers ↗" Calypso shortcut is retired. Instead of silently dropping
 * the menu item, this page takes its place so people who rely on the link
 * learn the new location before it disappears. They can also remove the
 * menu item themselves once they have adopted the new flow.
 *
 * The whole feature is temporary: everything (markup, styles, JS, AJAX and
 * admin-post handlers, tracking) is intentionally kept in this single file
 * so it can be deleted wholesale once the transition period ends.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Tracking;

/**
 * Renders the transitional Subscribers announcement page and handles its
 * "remove from sidebar" toggle and "Take me to Newsletter" redirect.
 *
 * @since $$next-version$$
 */
class Jetpack_Subscribers_Announcement_Page {

	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	const PAGE_SLUG = 'jetpack-subscribers';

	/**
	 * Option storing whether the user removed the Subscribers menu item.
	 *
	 * @var string
	 */
	const REMOVED_OPTION = 'jetpack_subscribers_announcement_menu_removed';

	/**
	 * AJAX action toggling the menu item visibility.
	 *
	 * @var string
	 */
	const TOGGLE_ACTION = 'jetpack_subscribers_announcement_toggle_menu';

	/**
	 * Admin-post action tracking the "Take me to Newsletter" click before redirecting.
	 *
	 * @var string
	 */
	const GO_ACTION = 'jetpack_subscribers_announcement_go_to_newsletter';

	/**
	 * Register the AJAX and admin-post handlers.
	 *
	 * Called unconditionally from the subscriptions module constructor because
	 * `admin_menu` (where the page itself is registered) does not fire on
	 * admin-ajax.php / admin-post.php requests.
	 *
	 * @return void
	 */
	public static function register_handlers() {
		add_action( 'wp_ajax_' . self::TOGGLE_ACTION, array( __CLASS__, 'handle_toggle_menu' ) );
		add_action( 'admin_post_' . self::GO_ACTION, array( __CLASS__, 'handle_go_to_newsletter' ) );
	}

	/**
	 * Whether the announcement page feature is active.
	 *
	 * Mirrors the gate in Jetpack_Subscriptions::add_subscribers_menu(): the page
	 * only exists while the modernized Newsletter dashboard owns subscriber
	 * management.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/** This filter is documented in projects/packages/newsletter/src/class-settings.php */
		return (bool) apply_filters( 'rsm_jetpack_ui_modernization_newsletter', false );
	}

	/**
	 * Register the Subscribers announcement page under the Jetpack menu.
	 *
	 * When the user opted to remove the menu item, the page stays registered
	 * (so the page remains reachable directly and the choice can be undone)
	 * but the sidebar entry is removed.
	 *
	 * @return void
	 */
	public static function add_menu() {
		$page_suffix = Admin_Menu::add_menu(
			__( 'Subscribers', 'jetpack' ),
			__( 'Subscribers', 'jetpack' ),
			'manage_options',
			self::PAGE_SLUG,
			array( __CLASS__, 'render' ),
			15
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'track_page_view' ) );
		}

		if ( get_option( self::REMOVED_OPTION ) ) {
			// Admin_Menu flushes its queued items at `admin_menu` priority 1000,
			// so the entry can only be removed after that.
			add_action( 'admin_menu', array( __CLASS__, 'remove_menu_item' ), 1001 );
		}
	}

	/**
	 * Remove the Subscribers entry from the Jetpack menu, keeping the page registered.
	 *
	 * @return void
	 */
	public static function remove_menu_item() {
		remove_submenu_page( 'jetpack', self::PAGE_SLUG );
	}

	/**
	 * Record a Tracks event for landing on the announcement page.
	 *
	 * @return void
	 */
	public static function track_page_view() {
		self::tracking()->record_user_event(
			'subscribers_announcement_page_view',
			array( 'menu_removed' => (bool) get_option( self::REMOVED_OPTION ) )
		);
	}

	/**
	 * AJAX handler persisting the "remove Subscribers from the sidebar" choice.
	 *
	 * @return void
	 */
	public static function handle_toggle_menu() {
		check_ajax_referer( self::TOGGLE_ACTION );

		if ( ! current_user_can( 'manage_options' ) || ! self::is_enabled() ) {
			wp_send_json_error( 'unauthorized', 403, JSON_HEX_TAG | JSON_HEX_AMP );
		}

		$removed = isset( $_POST['removed'] ) && '1' === $_POST['removed'];
		update_option( self::REMOVED_OPTION, $removed ? 1 : 0, false );

		self::tracking()->record_user_event(
			'subscribers_announcement_remove_menu_click',
			array( 'removed' => $removed )
		);

		wp_send_json_success( array( 'removed' => $removed ), 200, JSON_HEX_TAG | JSON_HEX_AMP );
	}

	/**
	 * Admin-post handler recording the "Take me to Newsletter" click, then redirecting.
	 *
	 * Tracking the click server-side before the redirect avoids relying on a
	 * JS tracking pipeline on a page that is otherwise static.
	 *
	 * @return void
	 */
	public static function handle_go_to_newsletter() {
		check_admin_referer( self::GO_ACTION );

		if ( current_user_can( 'manage_options' ) && self::is_enabled() ) {
			self::tracking()->record_user_event( 'subscribers_announcement_newsletter_click' );
		}

		wp_safe_redirect( admin_url( 'admin.php?page=jetpack-newsletter' ) );
		exit( 0 );
	}

	/**
	 * Get a Tracking instance.
	 *
	 * @return Tracking
	 */
	private static function tracking() {
		return new Tracking( 'jetpack', new Connection_Manager( 'jetpack' ) );
	}

	/**
	 * Render the announcement page.
	 *
	 * Layout mirrors the Jetpack Forms "Forms moved" announcement page:
	 * a white masthead with the Jetpack logo, then a hero section with the
	 * announcement and a primary action.
	 *
	 * @return void
	 */
	public static function render() {
		$newsletter_action_url = wp_nonce_url(
			admin_url( 'admin-post.php?action=' . self::GO_ACTION ),
			self::GO_ACTION
		);
		$toggle_nonce          = wp_create_nonce( self::TOGGLE_ACTION );
		$menu_removed          = (bool) get_option( self::REMOVED_OPTION );
		?>
		<style>
			.jp-subscribers-announcement {
				margin-left: -20px;
				font-size: 14px;
				color: #1e1e1e;
			}
			.jp-subscribers-announcement__masthead,
			.jp-subscribers-announcement__hero {
				background: #fff;
				padding: 24px 48px;
			}
			.jp-subscribers-announcement__masthead {
				display: flex;
				align-items: center;
				gap: 6px;
			}
			.jp-subscribers-announcement__masthead-title {
				font-size: 24px;
				font-weight: 600;
				line-height: 1;
			}
			.jp-subscribers-announcement__hero {
				margin-top: 32px;
				padding-top: 48px;
				padding-bottom: 64px;
			}
			.jp-subscribers-announcement__hero h1 {
				font-size: 36px;
				font-weight: 700;
				line-height: 1.2;
				margin: 0;
			}
			.jp-subscribers-announcement__subtitle {
				font-size: 21px;
				color: #3c434a;
				margin: 12px 0 32px;
			}
			.jp-subscribers-announcement__button {
				display: inline-block;
				background: #000;
				border-radius: 4px;
				color: #fff;
				font-size: 14px;
				font-weight: 600;
				line-height: 1;
				padding: 13px 20px;
				text-decoration: none;
			}
			.jp-subscribers-announcement__button:hover,
			.jp-subscribers-announcement__button:focus {
				background: #2c3338;
				color: #fff;
			}
			.jp-subscribers-announcement__remove {
				margin-top: 56px;
				max-width: 640px;
			}
			.jp-subscribers-announcement__remove .description {
				margin: 8px 0 0 24px;
			}
			.jp-subscribers-announcement__remove-feedback {
				margin: 8px 0 0 24px;
				color: #008a20;
			}
		</style>
		<div class="jp-subscribers-announcement">
			<div class="jp-subscribers-announcement__masthead">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 32" height="32" role="img" aria-hidden="true" focusable="false">
					<path fill="#069e08" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z" />
					<path d="M41.3,26.6c-0.5-0.7-0.9-1.4-1.3-2.1c2.3-1.4,3-2.5,3-4.6V8h-3V6h6v13.4C46,22.8,45,24.8,41.3,26.6z" />
					<path d="M65,18.4c0,1.1,0.8,1.3,1.4,1.3c0.5,0,2-0.2,2.6-0.4v2.1c-0.9,0.3-2.5,0.5-3.7,0.5c-1.5,0-3.2-0.5-3.2-3.1V12H60v-2h2.1V7.1 H65V10h4v2h-4V18.4z" />
					<path d="M71,10h3v1.3c1.1-0.8,1.9-1.3,3.3-1.3c2.5,0,4.5,1.8,4.5,5.6s-2.2,6.3-5.8,6.3c-0.9,0-1.3-0.1-2-0.3V28h-3V10z M76.5,12.3 c-0.8,0-1.6,0.4-2.5,1.2v5.9c0.6,0.1,0.9,0.2,1.8,0.2c2,0,3.2-1.3,3.2-3.9C79,13.4,78.1,12.3,76.5,12.3z" />
					<path d="M93,22h-3v-1.5c-0.9,0.7-1.9,1.5-3.5,1.5c-1.5,0-3.1-1.1-3.1-3.2c0-2.9,2.5-3.4,4.2-3.7l2.4-0.3v-0.3c0-1.5-0.5-2.3-2-2.3 c-0.7,0-2.3,0.5-3.7,1.1L84,11c1.2-0.4,3-1,4.4-1c2.7,0,4.6,1.4,4.6,4.7L93,22z M90,16.4l-2.2,0.4c-0.7,0.1-1.4,0.5-1.4,1.6 c0,0.9,0.5,1.4,1.3,1.4s1.5-0.5,2.3-1V16.4z" />
					<path d="M104.5,21.3c-1.1,0.4-2.2,0.6-3.5,0.6c-4.2,0-5.9-2.4-5.9-5.9c0-3.7,2.3-6,6.1-6c1.4,0,2.3,0.2,3.2,0.5V13 c-0.8-0.3-2-0.6-3.2-0.6c-1.7,0-3.2,0.9-3.2,3.6c0,2.9,1.5,3.8,3.3,3.8c0.9,0,1.9-0.2,3.2-0.7V21.3z" />
					<path d="M110,15.2c0.2-0.3,0.2-0.8,3.8-5.2h3.7l-4.6,5.7l5,6.3h-3.7l-4.2-5.8V22h-3V6h3V15.2z" />
					<path d="M58.5,21.3c-1.5,0.5-2.7,0.6-4.2,0.6c-3.6,0-5.8-1.8-5.8-6c0-3.1,1.9-5.9,5.5-5.9s4.9,2.5,4.9,4.9c0,0.8,0,1.5-0.1,2h-7.3 c0.1,2.5,1.5,2.8,3.6,2.8c1.1,0,2.2-0.3,3.4-0.7C58.5,19,58.5,21.3,58.5,21.3z M56,15c0-1.4-0.5-2.9-2-2.9c-1.4,0-2.3,1.3-2.4,2.9 C51.6,15,56,15,56,15z" />
				</svg>
				<span class="jp-subscribers-announcement__masthead-title"><?php esc_html_e( 'Subscribers', 'jetpack' ); ?></span>
			</div>
			<div class="jp-subscribers-announcement__hero">
				<h1><?php esc_html_e( 'Subscribers moved', 'jetpack' ); ?></h1>
				<p class="jp-subscribers-announcement__subtitle">
					<?php
					/* translators: "Jetpack" and "Newsletter" are menu labels, do not translate them. */
					esc_html_e( 'Now it’s part of Jetpack → Newsletter', 'jetpack' );
					?>
				</p>
				<p>
					<a class="jp-subscribers-announcement__button" href="<?php echo esc_url( $newsletter_action_url ); ?>">
						<?php esc_html_e( 'Take me to Newsletter', 'jetpack' ); ?>
					</a>
				</p>
				<div class="jp-subscribers-announcement__remove">
					<label for="jp-subscribers-announcement-remove-checkbox">
						<input
							type="checkbox"
							id="jp-subscribers-announcement-remove-checkbox"
							<?php checked( $menu_removed ); ?>
						/>
						<?php esc_html_e( 'Remove Subscribers from the sidebar', 'jetpack' ); ?>
					</label>
					<p class="description">
						<?php esc_html_e( 'This shortcut will be removed automatically in a future release. You can always manage your subscribers from the Newsletter page.', 'jetpack' ); ?>
					</p>
					<p class="jp-subscribers-announcement__remove-feedback" <?php echo $menu_removed ? '' : 'hidden'; ?>>
						<?php esc_html_e( 'Subscribers has been removed from the sidebar. You can undo this by unchecking the box.', 'jetpack' ); ?>
					</p>
				</div>
			</div>
		</div>
		<script>
			( function () {
				var checkbox = document.getElementById( 'jp-subscribers-announcement-remove-checkbox' );
				if ( ! checkbox ) {
					return;
				}

				checkbox.addEventListener( 'change', function () {
					var removed = checkbox.checked;
					var body = new URLSearchParams();

					body.append( 'action', <?php echo wp_json_encode( self::TOGGLE_ACTION, JSON_HEX_TAG | JSON_HEX_AMP ); ?> );
					body.append( '_ajax_nonce', <?php echo wp_json_encode( $toggle_nonce, JSON_HEX_TAG | JSON_HEX_AMP ); ?> );
					body.append( 'removed', removed ? '1' : '0' );

					checkbox.disabled = true;

					fetch( window.ajaxurl, { method: 'POST', credentials: 'same-origin', body: body } )
						.then( function ( response ) {
							return response.json();
						} )
						.then( function ( response ) {
							if ( ! response || ! response.success ) {
								throw new Error( 'request failed' );
							}

							var feedback = document.querySelector( '.jp-subscribers-announcement__remove-feedback' );
							if ( feedback ) {
								feedback.hidden = ! removed;
							}

							// Reflect the change in the sidebar right away.
							var menuLink = document.querySelector( <?php echo wp_json_encode( '#adminmenu a[href$="page=' . self::PAGE_SLUG . '"]', JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); ?> );
							var menuItem = menuLink && menuLink.closest( 'li' );
							if ( menuItem ) {
								menuItem.style.display = removed ? 'none' : '';
							}
						} )
						.catch( function () {
							checkbox.checked = ! removed;
						} )
						.then( function () {
							checkbox.disabled = false;
						} );
				} );
			} )();
		</script>
		<?php
	}
}
