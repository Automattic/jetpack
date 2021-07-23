<?php
/**
 * Adds a section with Upgrade nudges to the Status Report page
 *
 * @package jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Jetpack_CRM_Data;
use Automattic\Jetpack\Redirect;

jetpack_require_lib( 'plugins' );

/**
 * Class that adds a new section to the Stats Report page
 */
class Jetpack_Stats_Upgrade_Nudges {

	/**
	 * Indicates whether the class initialized or not
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the class by registering the action
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			add_action( 'jetpack_admin_pages_wrap_ui_after_callback', array( __CLASS__, 'render' ) );
		}
	}

	/**
	 * Determines whether Backup is active
	 *
	 * @return boolean
	 */
	private static function is_backup_active() {
		$rewind_data = Jetpack_Core_Json_Api_Endpoints::rewind_data();
		return is_object( $rewind_data ) && isset( $rewind_data->state ) && 'unavailable' !== $rewind_data->state;
	}

	/**
	 * Checks if a plugin is installed.
	 *
	 * @param string $plugin_file The plugin filename.
	 * @return boolean
	 */
	private static function is_plugin_installed( $plugin_file ) {
		$plugins = Jetpack_Plugins::get_plugins();
		return isset( $plugins[ $plugin_file ] );
	}

	/**
	 * Checks if a plugin is active.
	 *
	 * @param string $plugin_file The plugin filename.
	 * @return boolean
	 */
	private static function is_plugin_active( $plugin_file ) {
		$plugins = Jetpack_Plugins::get_plugins();
		return isset( $plugins[ $plugin_file ] ) && isset( $plugins[ $plugin_file ]['active'] ) && $plugins[ $plugin_file ]['active'];
	}

	/**
	 * Determines whether Scan is active
	 *
	 * @return boolean
	 */
	private static function is_scan_active() {
		$scan_data = Jetpack_Core_Json_Api_Endpoints::scan_state();
		return is_object( $scan_data ) && isset( $scan_data->state ) && 'unavailable' !== $scan_data->state;
	}

	/**
	 * Determines whether Search module is active
	 *
	 * @return boolean
	 */
	private static function is_search_active() {
		return Jetpack::is_module_active( 'search' );
	}

	/**
	 * Determines whether the Site is on a Security Plan. It will also return true if site has backup, scan and akismet.
	 *
	 * @return boolean
	 */
	private static function has_security_plan() {
		$plan_data = Jetpack_Plan::get();
		if ( is_array( $plan_data ) && isset( $plan_data['product_slug'] ) ) {
			$has_plan = wp_startswith( $plan_data['product_slug'], 'jetpack_security' );
			return (
				$has_plan || (
					self::is_backup_active() &&
					self::is_scan_active() &&
					self::is_akismet_active()
				)
			);
		}
		return false;
	}

	/**
	 * Determines whether the Site is on the Complete Plan.
	 *
	 * @return boolean
	 */
	private static function has_complete_plan() {
		$plan_data = Jetpack_Plan::get();
		if ( is_array( $plan_data ) && isset( $plan_data['product_slug'] ) ) {
			return wp_startswith( $plan_data['product_slug'], 'jetpack_complete' );
		}
		return false;
	}

	/**
	 * Determines whether Akismet is active
	 *
	 * @return boolean
	 */
	private static function is_akismet_active() {
		return Jetpack::is_akismet_active();
	}

	/**
	 * Outputs the header of the Upgrade Secion
	 *
	 * @return void
	 */
	private static function print_header() {
		if ( self::has_security_plan() ) {
			// translators: %s is the Site Name.
			$title = __( 'Performance and growth tools for %s', 'jetpack' );
		} else {
			// translators: %s is the Site Name.
			$title = __( 'Security, performance, and growth tools for %s', 'jetpack' );
		}
		$title = sprintf( $title, get_bloginfo( 'site_name' ) );
		?>
		<div class="dops-card dops-section-header is-compact">
			<div class="dops-section-header__label">
				<span class="dops-section-header__label-text">
					<?php echo esc_html( $title ); ?>
				</span>
			</div>
			<div class="dops-section-header__actions"></div>
		</div>
		<?php
	}

	/**
	 * Outputs the custom css rules of the Upgrade Section
	 *
	 * @return void
	 */
	private static function print_styles() {
		?>
		<style>
			.dops-banner.dops-card.jp-stats-report-upgrade-subitem {
				padding-left: 40px;
			}
		</style>
		<?php
	}

	/**
	 * Gets the upgrade Redirect link
	 *
	 * @param string $source The source of the redirect link.
	 * @return string
	 */
	private static function get_upgrade_link( $source ) {
		$args = array();
		if ( ! ( new Manager( 'jetpack' ) )->has_connected_owner() ) {
			$args['query'] = 'unlinked=1';
		}
		return Redirect::get_url( $source, $args );
	}

	/**
	 * Outputs one Upgrade item
	 *
	 * @param string  $title The title of the item.
	 * @param string  $icon The path of the icon, relative to Jetpack images folder.
	 * @param string  $link The link of the button.
	 * @param string  $tracks_id The id used to identify the tracks event. Automatically prefixed with "jetpack_stats_nudges_".
	 * @param boolean $subitem Whether it is a subitem or not.
	 * @param string  $button_label The button label.
	 * @return void
	 */
	private static function print_item( $title, $icon, $link, $tracks_id, $subitem = false, $button_label = null ) {
		$additional_classes = $subitem ? 'jp-stats-report-upgrade-subitem' : '';
		$button_class       = $subitem ? 'is-secondary' : 'is-primary';
		$icon_url           = plugins_url( '', JETPACK__PLUGIN_FILE ) . '/images/' . $icon;
		$button_label       = is_null( $button_label ) ? __( 'Upgrade', 'jetpack' ) : $button_label;
		?>
			<div class="dops-card dops-banner has-call-to-action is-product <?php echo esc_attr( $additional_classes ); ?>">
				<div class="dops-banner__icon-plan">
					<img src="<?php echo esc_attr( $icon_url ); ?>" alt="" width="32" height="32">
				</div>
				<div class="dops-banner__content">
					<div class="dops-banner__info">
						<div class="dops-banner__title"><?php echo esc_html( $title ); ?></div>
					</div>
					<div class="dops-banner__action">
						<a href="<?php echo esc_attr( $link ); ?>" type="button" class="jptracks dops-button is-compact <?php echo esc_attr( $button_class ); ?>" data-jptracks-name="stats_nudges_<?php echo esc_attr( $tracks_id ); ?>">
						<?php echo esc_html( $button_label ); ?>
						</a>
					</div>
				</div>
			</div>
		<?php
	}

	/**
	 * Prints the Security item
	 *
	 * @return void
	 */
	private static function print_security() {
		$upgrade_link = self::get_upgrade_link( 'stats-nudges-security' );
		self::print_item( __( 'Security', 'jetpack' ), 'products/product-jetpack-backup.svg', $upgrade_link, 'security' );
	}

	/**
	 * Prints the Backup item
	 *
	 * @return void
	 */
	private static function print_backup() {
		$upgrade_link = self::get_upgrade_link( 'stats-nudges-backup' );
		self::print_item( __( 'Backup', 'jetpack' ), 'products/product-jetpack-backup.svg', $upgrade_link, 'backup', true );
	}

	/**
	 * Prints the Scan item
	 *
	 * @return void
	 */
	private static function print_scan() {
		$upgrade_link = self::get_upgrade_link( 'stats-nudges-scan' );
		self::print_item( __( 'Scan', 'jetpack' ), 'products/product-jetpack-scan.svg', $upgrade_link, 'scan', true );
	}

	/**
	 * Prints the Akismet item
	 *
	 * @return void
	 */
	private static function print_akismet() {
		$upgrade_link = self::get_upgrade_link( 'stats-nudges-akismet' );
		self::print_item( __( 'Anti-spam', 'jetpack' ), 'products/product-jetpack-anti-spam.svg', $upgrade_link, 'akismet', true );
	}

	/**
	 * Prints the Search item
	 *
	 * @return void
	 */
	private static function print_search() {
		$upgrade_link = self::get_upgrade_link( 'stats-nudges-search' );
		self::print_item( __( 'Search', 'jetpack' ), 'products/product-jetpack-search.svg', $upgrade_link, 'search' );
	}

	/**
	 * Prints the Boost item
	 *
	 * @param bool $print Whether to print the item output or just check whether it would be printed or not.
	 *
	 * @return bool
	 */
	private static function get_boost_output( $print = true ) {
		$plugin_file = 'jetpack-boost/jetpack-boost.php';
		$plugin_slug = 'jetpack-boost';
		if ( self::is_plugin_active( $plugin_file ) ) {
			return false;
		} elseif ( self::is_plugin_installed( $plugin_file ) ) {
			$label = __( 'Activate Boost', 'jetpack' );
			$link  = wp_nonce_url( 'plugins.php?action=activate&amp;plugin=' . rawurlencode( $plugin_file ) . '&amp;plugin_status=all&amp;paged=1', 'activate-plugin_' . $plugin_file );
		} else {
			$label = __( 'Install Boost', 'jetpack' );
			$link  = wp_nonce_url( self_admin_url( 'update.php?action=install-plugin&plugin=' . $plugin_slug ), 'install-plugin_' . $plugin_slug );
		}
		if ( $print ) {
			self::print_item( __( 'Boost', 'jetpack' ), 'recommendations/site-accelerator-illustration.svg', $link, 'boost', false, $label );
		}
		return true;
	}

	/**
	 * Prints the CRM item
	 *
	 * @param bool $print Whether to print the item output or just check whether it would be printed or not.
	 *
	 * @return bool
	 */
	private static function get_crm_output( $print = true ) {
		$plugin_file = Jetpack_CRM_Data::JETPACK_CRM_PLUGIN_SLUG;
		$plugin_slug = substr( $plugin_file, 0, strpos( $plugin_file, '/' ) );
		if ( self::is_plugin_active( $plugin_file ) ) {
			return false;
		} elseif ( self::is_plugin_installed( $plugin_file ) ) {
			$link  = wp_nonce_url( 'plugins.php?action=activate&amp;plugin=' . rawurlencode( $plugin_file ) . '&amp;plugin_status=all&amp;paged=1', 'activate-plugin_' . $plugin_file );
			$label = __( 'Activate CRM', 'jetpack' );
		} else {
			$link  = wp_nonce_url( self_admin_url( 'update.php?action=install-plugin&plugin=' . $plugin_slug ), 'install-plugin_' . $plugin_slug );
			$label = __( 'Install CRM', 'jetpack' );
		}
		if ( $print ) {
			self::print_item( __( 'CRM', 'jetpack' ), 'recommendations/creative-mail-illustration.svg', $link, 'crm', false, $label );
		}
		return true;
	}

	/**
	 * Outputs the section to the Stats Report page
	 *
	 * @param string $callback The callback passed to the jetpack admin page.
	 * @return void
	 */
	public static function render( $callback ) {
		/** This filter is documented in _inc/lib/admin-pages/class.jetpack-react-page.php */
		if ( 'stats_reports_page' !== $callback || ! apply_filters( 'jetpack_show_promotions', true ) || ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( ! defined( 'JETPACK_DEV_TEST_STATS_UPGRADE_NUDGES' ) || ! JETPACK_DEV_TEST_STATS_UPGRADE_NUDGES ) {
			return;
		}

		if ( self::has_complete_plan() ) {
			return;
		}

		if (
			self::has_security_plan() &&
			self::is_backup_active() &&
			self::is_scan_active() &&
			self::is_akismet_active() &&
			self::is_search_active() &&
			! self::get_boost_output( false ) &&
			! self::get_crm_output( false )
		) {
			return;
		}

		self::print_styles();
		self::print_header();
		if ( ! self::has_security_plan() ) {
			self::print_security();
			if ( ! self::is_backup_active() ) {
				self::print_backup();
			}
			if ( ! self::is_scan_active() ) {
				self::print_scan();
			}
			if ( ! self::is_akismet_active() ) {
				self::print_akismet();
			}
		}
		if ( ! self::is_search_active() ) {
			self::print_search();
		}
		self::get_boost_output();
		self::get_crm_output();
	}

}
