<?php
/**
 * Jetpack forms dashboard view switch.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use Automattic\Jetpack\Forms\Jetpack_Forms;
use JETPACK__VERSION;

/**
 * Understands switching between classic and redesigned versions of the feedback admin area.
 */
class Dashboard_View_Switch {

	/**
	 * Initialize the switch.
	 */
	public function init() {
		add_action( 'admin_print_styles', array( $this, 'print_styles' ) );
		add_filter( 'in_admin_header', array( $this, 'render_switch' ) );
		add_action( 'admin_footer', array( $this, 'add_scripts' ) );
	}

	/**
	 * Render the switch.
	 */
	public function render_switch() {
		if ( ! $this->is_visible() ) {
			return;
		}

		?>
		<div id="view-link-wrap" class="hide-if-no-js screen-meta-toggle">
			<button type="button" id="view-link" class="button show-settings" aria-expanded="false"><?php echo esc_html_x( 'View', 'View options to switch between', 'jetpack-forms' ); ?></button>
		</div>
		<div id="view-wrap" class="screen-options-tab__wrapper hide-if-no-js hidden" tabindex="-1">
			<div class="screen-options-tab__dropdown" data-testid="screen-options-dropdown">
				<div class="screen-switcher">
					<a class="screen-switcher__button" href="<?php echo esc_url( add_query_arg( 'preferred-view', 'default' ) ); ?>" data-view="default">
						<strong><?php esc_html_e( 'Default view', 'jetpack-forms' ); ?></strong>
						<?php esc_html_e( 'The classic WP-Admin WordPress interface.', 'jetpack-forms' ); ?>
					</a>
					<button class="screen-switcher__button"  data-view="jetpack-forms">
						<strong><?php esc_html_e( 'Forms dashboard', 'jetpack-forms' ); ?></strong>
						<?php esc_html_e( 'The new and improved Jetpack Forms dashboard.', 'jetpack-forms' ); ?>
					</button>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Embed the switch styles on the page.
	 */
	public function print_styles() {
		if ( ! $this->is_visible() ) {
			return;
		}

		wp_register_style(
			'jetpack-forms-dashboard-switch',
			false,
			array(),
			JETPACK__VERSION
		);
		wp_enqueue_style( 'jetpack-forms-dashboard-switch' );

		wp_add_inline_style(
			'jetpack-forms-dashboard-switch',
			<<<CSS
			#view-link-wrap {
				float: left;
				margin: 0 0 0 6px;
			}

			.toplevel_page_jetpack-forms #view-link-wrap {
				position: fixed;
				right: 32px;
				top: var(--wp-admin--admin-bar--height);
				z-index: 179;
			}

			.toplevel_page_jetpack-forms #view-link {
				background-color: #fff;
				border: 1px solid #c3c4c7;
				border-top: none;
				border-radius: 0 0 4px 4px;
				color: #646970;
				cursor: pointer;
				font-size: 13px;
				line-height: 1.7;
				padding: 3px 6px 3px 16px;
			}

			.toplevel_page_jetpack-forms #view-link::after {
				right: 0;
				content: "\\f140";
				font: normal 20px/1 dashicons;
				speak: never;
				display: inline-flex;
				padding: 0 5px 0 0;
				bottom: 2px;
				position: relative;
				vertical-align: bottom;
				-webkit-font-smoothing: antialiased;
				-moz-osx-font-smoothing: grayscale;
				text-decoration: none;
			}

			.screen-options-tab__wrapper {
				position:relative
			}

			.screen-options-tab__dropdown {
				background-color: #fff;
				border: 1px solid var(--color-neutral-5);
				border-radius: 4px;
				box-shadow: 0 4px 10px #0000001a;
				padding: 3px;
				position: absolute;
				right: 20px;
				top: 37px;
				width:215px;
				z-index: 9999;
			}

			@media screen and (max-width: 782px) {
				.screen-options-tab__dropdown {
					right: 10px;
					top: 47px;
				}
			}

			@media screen and (max-width: 600px) {
				.screen-options-tab__dropdown {
					top: 93px;
				}
			}

			.screen-switcher:not(:hover) .screen-switcher__button:nth-child(2) > strong {
				color:var(--wp-admin-theme-color)
			}

			.screen-switcher__button, a.screen-switcher__button {
				background: transparent;
				border: 1px solid #0000;
				border-radius: 4px;
				color: var(--color-text);
				cursor: pointer;
				display: inline-block;
				font-size: .75rem;
				line-height: normal;
				text-decoration: none;
				padding: 8px;
				text-align:left
			}

			.screen-switcher__button:nth-child(2), a.screen-switcher__button:nth-child(2) {
				border-color: var(--wp-admin-theme-color);
				margin-bottom:4px
			}

			.screen-switcher__button:last-child, a.screen-switcher__button:last-child {
				margin-bottom:0
			}

			.screen-switcher__button strong, a.screen-switcher__button strong {
				display: block;
				font-size: 13px;
				margin-bottom:4px
			}

			.screen-switcher__button:focus > strong, .screen-switcher__button:hover > strong, a.screen-switcher__button:focus > strong, a.screen-switcher__button:hover > strong {
				color:var(--wp-admin-theme-color)
			}
CSS
		);
	}

	/**
	 * Add scripts for the switch component.
	 */
	public function add_scripts() {
		if ( ! $this->is_visible() ) {
			return;
		}

		wp_add_inline_script(
			'common',
			"(function( $ ) {
				$( '#view-link-wrap' ).appendTo( '#screen-meta-links' );

				var viewLink = $( '#view-link' );
				var viewWrap = $( '#view-wrap' );

				viewLink.on( 'click', function() {
					viewWrap.toggle();
					viewLink.toggleClass( 'screen-meta-active' );
				} );

				$( document ).on( 'mouseup', function( event ) {
					if ( ! viewLink.is( event.target ) && ! viewWrap.is( event.target ) && viewWrap.has( event.target ).length === 0 ) {
						viewWrap.hide();
						viewLink.removeClass( 'screen-meta-active' );
					}
				});
			})( jQuery );"
		);
	}

	/**
	 * Returns true if the switch should be visible on the current page.
	 *
	 * @return boolean
	 */
	public function is_visible() {
		$current_screen = get_current_screen();

		return Jetpack_Forms::is_feedback_dashboard_enabled() &&
			$current_screen &&
			in_array( $current_screen->id, array( 'edit-feedback', 'toplevel_page_jetpack-forms' ), true );
	}
}
