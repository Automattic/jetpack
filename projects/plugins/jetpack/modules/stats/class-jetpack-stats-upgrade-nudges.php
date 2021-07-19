<?php
/**
 * Adds a section with Upgrade nudges to the Status Report page
 *
 * @package jetpack
 */

use Automattic\Jetpack\Jetpack_CRM_Data;

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
	 * Determines whether Scan is active
	 *
	 * @return boolean
	 */
	private static function is_scan_active() {
		$scan_data = Jetpack_Core_Json_Api_Endpoints::scan_state();
		return is_object( $scan_data ) && isset( $scan_data->state ) && 'unavailable' !== $scan_data->state;
	}

	/**
	 * Determines whether CRM is installed
	 *
	 * @return boolean
	 */
	private static function is_crm_installed() {
		$crm_data = ( new Jetpack_CRM_Data() )->get_crm_data();
		return is_array( $crm_data ) && isset( $crm_data['crm_installed'] ) && $crm_data['crm_installed'];
	}

	/**
	 * Determines whether Boost is active
	 *
	 * @return boolean
	 */
	private static function is_boost_active() {
		return class_exists( 'Automattic\Jetpack_Boost\Jetpack_Boost' );
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
	 * Determines whether the Site is on a Security Plan
	 *
	 * @return boolean
	 */
	private static function has_security_plan() {
		$plan_data = Jetpack_Plan::get();
		return is_array( $plan_data ) && isset( $plan_data['product_slug'] ) && wp_startswith( $plan_data['product_slug'], 'jetpack_security' );
	}

	/**
	 * Determines whether Akismet is active
	 *
	 * @return boolean
	 */
	private static function is_akismet_active() {
		return class_exists( 'Akismet_Admin' );
	}

	/**
	 * Outputs the header of the Upgrade Secion
	 *
	 * @return void
	 */
	private static function print_header() {
		?>
		<div class="dops-card dops-section-header is-compact">
			<div class="dops-section-header__label">
				<span class="dops-section-header__label-text">
					<?php
					printf(
						// translators: %s is the Site Name.
						esc_html__( 'Security, performance, and growth tools for %s', 'jetpack' ),
						esc_attr( get_bloginfo( 'site_name' ) )
					);
					?>
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
	 * Outputs one Upgrade item
	 *
	 * @param string  $title The title of the item.
	 * @param string  $icon The path of the icon, relative to Jetpack images folder.
	 * @param boolean $subitem Whether it is a subitem or not.
	 * @param string  $button_label The button label.
	 * @return void
	 */
	private static function print_item( $title, $icon, $subitem = false, $button_label = null ) {
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
						<a href="#" type="button" class="dops-button is-compact <?php echo esc_attr( $button_class ); ?>">
						<?php echo esc_html( $button_label ); ?>
						</a>
					</div>
				</div>
			</div>
		<?php
	}

	/**
	 * Outputs the section to the Stats Report page
	 *
	 * @param string $callback The callback passed to the jetpack admin page.
	 * @return void
	 */
	public static function render( $callback ) {
		/** This filter is documented in _inc/lib/admin-pages/class.jetpack-react-page.php */
		if ( 'stats_reports_page' !== $callback || ! apply_filters( 'jetpack_show_promotions', true ) ) {
			return;
		}

		if ( ! defined( 'JETPACK_DEV_TEST_STATS_UPGRADE_NUDGES' ) || ! JETPACK_DEV_TEST_STATS_UPGRADE_NUDGES ) {
			return;
		}

		self::print_styles();
		self::print_header();
		if ( ! self::has_security_plan() ) {
			self::print_item( __( 'Security', 'jetpack' ), 'products/product-jetpack-backup.svg' );
			if ( ! self::is_backup_active() ) {
				self::print_item( __( 'Backup', 'jetpack' ), 'products/product-jetpack-backup.svg', true );
			}
			if ( ! self::is_scan_active() ) {
				self::print_item( __( 'Scan', 'jetpack' ), 'products/product-jetpack-scan.svg', true );
			}
			if ( self::is_akismet_active() ) {
				self::print_item( __( 'Anti-spam', 'jetpack' ), 'products/product-jetpack-anti-spam.svg', true );
			}
		}
		if ( ! self::is_search_active() ) {
			self::print_item( __( 'Search', 'jetpack' ), 'products/product-jetpack-search.svg' );
		}
		if ( ! self::is_boost_active() ) {
			self::print_item( __( 'Boost', 'jetpack' ), 'recommendations/site-accelerator-illustration.svg', false, __( 'Install Boost', 'jetpack' ) );
		}
		if ( ! self::is_crm_installed() ) {
			self::print_item( __( 'CRM', 'jetpack' ), 'recommendations/creative-mail-illustration.svg', false, __( 'Install CRM', 'jetpack' ) );
		}

	}

}
