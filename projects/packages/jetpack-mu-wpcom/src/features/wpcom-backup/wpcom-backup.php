<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName -- Feature entry file, named after the feature, also holds the WPCOM_Backup bootstrap class.
/**
 * An in-wp-admin Backup page for WordPress.com Simple and WoA sites.
 * Prompts for a plan upgrade or activation of backups.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Constants;

require_once __DIR__ . '/../../common/class-wpcom-wp-build-page.php';

/**
 * Registers the Backup admin page and its wp-build assets.
 */
class WPCOM_Backup extends WPCOM_WP_Build_Page {

	/**
	 * Admin page slug. Matches Jetpack_Backup::JETPACK_BACKUP_SLUG so the URL survives a
	 * transfer to WoA, where the Jetpack plugin takes the slug over once backups are live.
	 */
	const MENU_SLUG = 'jetpack-backup';

	/**
	 * Filter that switches Backup to wp-admin, shared with the Backup package's dashboard.
	 */
	const MODERNIZATION_FILTER = 'rsm_jetpack_ui_modernization_backup';

	/**
	 * Page name for wp-build, as declared in routes/wpcom-backup/package.json.
	 */
	const WP_BUILD_PAGE = 'wpcom-backup';

	/**
	 * Global the page's boot script reads its initial state from.
	 */
	const INITIAL_STATE_VAR = 'wpcomBackupInitialState';

	/**
	 * The page records its prompts in Tracks.
	 */
	const ENQUEUE_TRACKS = true;

	/**
	 * Calypso flow that initiates the transfer, reports progress and returns here.
	 */
	const TRANSFER_FLOW_URL = 'https://wordpress.com/setup/transferring-hosted-site';

	/**
	 * Tracks context recorded for the WoA transfer.
	 */
	const TRANSFER_CONTEXT = 'jetpack_product_activation';

	/**
	 * Site has no backup-capable plan. Offer an upgrade.
	 */
	const STATE_UPGRADE = 'upgrade';

	/**
	 * A transfer to WoA is already running or queued. Offer nothing; report status.
	 */
	const STATE_IN_PROGRESS = 'in_progress';

	/**
	 * Site has the plan and can transfer. Offer activation.
	 */
	const STATE_ACTIVATE = 'activate';

	/**
	 * Whether the site runs on WordPress.com's Atomic infrastructure.
	 *
	 * Read through Constants rather than `defined()` so tests can exercise both
	 * platforms in one process.
	 *
	 * @return bool
	 */
	public static function is_atomic() {
		return Constants::is_true( 'IS_ATOMIC' );
	}

	/**
	 * Whether this page should claim the Backup slug at all.
	 *
	 * A plan that includes backups only makes them live on Atomic infrastructure, so on
	 * WoA an entitled site already has working backups and this page steps aside. A Simple
	 * site is never Atomic, so the page always applies there.
	 *
	 * @return bool
	 */
	public static function should_register() {
		if ( ! self::is_atomic() ) {
			return true;
		}

		return ! self::has_backup_feature();
	}

	/**
	 * Whether Backup opens in wp-admin rather than Calypso.
	 *
	 * Defaults on for Automatticians only.
	 *
	 * @return bool
	 */
	public static function is_modernized() {
		return (bool) apply_filters( self::MODERNIZATION_FILTER, Wpcom_Feature_Flags::is_a11n() );
	}

	/**
	 * Keep the Jetpack plugin's Backup dashboard off a WoA site whose plan lacks backups.
	 *
	 * Otherwise it claims the slug first and this page's upgrade prompt steps aside.
	 *
	 * @param bool $enabled Whether the Jetpack plugin offers its Backup dashboard.
	 * @return bool
	 */
	public static function filter_jetpack_backup_dashboard( $enabled ) {
		return $enabled && self::has_backup_feature();
	}

	/**
	 * The page title.
	 *
	 * @return string
	 */
	public static function get_page_title() {
		// Product name, do not translate.
		return 'Jetpack VaultPress Backup';
	}

	/**
	 * The menu entry's label.
	 *
	 * @return string
	 */
	public static function get_menu_title() {
		// Product name, do not translate.
		return 'Backup';
	}

	/**
	 * The resolved prompt and everything it links to.
	 *
	 * @return array
	 */
	public static function get_initial_state() {
		$blog_id = get_current_blog_id();
		$domain  = wp_parse_url( home_url(), PHP_URL_HOST );
		$state   = self::get_state( $blog_id );

		// Only the activation prompt reads eligibility, and both lists come from the
		// same result, so resolve it once and only for that state.
		$eligibility = self::STATE_ACTIVATE === $state
			? self::get_eligibility( $blog_id, get_current_user_id() )
			: null;
		$warnings    = self::get_transfer_warnings( $eligibility );

		return array(
			'state'       => $state,
			'domain'      => $domain,
			// A null result means the library was unavailable, not that the site
			// failed a check; let the transfer flow reject it instead.
			'isEligible'  => null === $eligibility || ! empty( $eligibility['is_eligible'] ),
			'errors'      => self::get_transfer_errors( $eligibility ),
			'warnings'    => $warnings,
			'upgradeUrl'  => self::get_upgrade_url( $domain ),
			'activateUrl' => self::get_activate_url( $warnings ),
		);
	}

	/**
	 * Whether the site's plan includes self-serve backups.
	 *
	 * @return bool
	 */
	public static function has_backup_feature() {
		return self::site_has_feature( 'BACKUPS_SELF_SERVE' );
	}

	/**
	 * Whether the site's plan includes WordPress.com's Atomic hosting, which backups run on.
	 *
	 * @return bool
	 */
	public static function has_atomic_feature() {
		return self::site_has_feature( 'ATOMIC' );
	}

	/**
	 * Whether the site's plan includes a WordPress.com feature.
	 *
	 * @param string $name Name of a `WPCOM_Features` constant.
	 * @return bool
	 */
	private static function site_has_feature( $name ) {
		$constant = 'WPCOM_Features::' . $name;

		if ( ! function_exists( 'wpcom_site_has_feature' ) || ! defined( $constant ) ) {
			return false;
		}

		// Called without a blog ID.
		// WoA sites would pass the local blog ID, which is not the WordPress.com blog ID.
		// wpcom resolves the current site.
		return (bool) wpcom_site_has_feature( constant( $constant ) );
	}

	/**
	 * Whether a transfer to WoA is already underway.
	 *
	 * @param int $blog_id Blog ID.
	 * @return bool
	 */
	public static function is_transfer_in_progress( $blog_id ) {
		if ( ! function_exists( 'require_lib' ) ) {
			return false;
		}

		// These checks are only relevant for simple sites.
		if ( self::is_atomic() ) {
			return false;
		}

		require_lib( 'atomic' );

		if ( function_exists( '\A8C\Atomic\has_site_pending_automated_transfer' ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only; pending addition to stub-defs.php.
			if ( \A8C\Atomic\has_site_pending_automated_transfer( $blog_id ) ) {
				return true;
			}
		}

		if ( function_exists( '\A8C\Atomic\is_wpcom_atomic' ) ) {
			// Second argument includes pending/active/provisioned transfers.
			// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only; pending addition to stub-defs.php.
			return (bool) \A8C\Atomic\is_wpcom_atomic( $blog_id, true );
		}

		return false;
	}

	/**
	 * Transfer eligibility for the site, or null when it cannot be determined.
	 *
	 * An in-progress transfer is reported as a `transfer_already_exists` error, so
	 * that state is checked first and never reaches here as a blocker.
	 *
	 * @param int $blog_id Blog ID.
	 * @param int $user_id User ID.
	 * @return array|null { is_eligible: bool, errors: array, warnings: array }
	 */
	public static function get_eligibility( $blog_id, $user_id ) {
		if ( ! function_exists( 'require_lib' ) ) {
			return null;
		}

		// These checks are only relevant for simple sites.
		if ( self::is_atomic() ) {
			return null;
		}

		require_lib( 'atomic' );

		if ( ! function_exists( '\A8C\Atomic\Eligibility\get_status_for_site' ) ) {
			return null;
		}

		// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only; pending addition to stub-defs.php.
		return \A8C\Atomic\Eligibility\get_status_for_site( $blog_id, $user_id );
	}

	/**
	 * Resolve which prompt the page should show.
	 *
	 * @param int $blog_id Blog ID.
	 * @return string One of the STATE_* constants.
	 */
	public static function get_state( $blog_id ) {
		// On WoA the plan is the only question: the site is already on the
		// infrastructure that runs backups, so there is nothing to transfer, and
		// should_register() has already stepped the page aside if it has the plan.
		// On Simple, activation also needs the hosting platform, as Calypso requires.
		if ( ! self::has_backup_feature() || ! self::has_atomic_feature() || self::is_atomic() ) {
			$state = self::STATE_UPGRADE;
		} elseif ( self::is_transfer_in_progress( $blog_id ) ) {
			$state = self::STATE_IN_PROGRESS;
		} else {
			// Eligibility failures are explained by the activation prompt's own
			// confirmation step, so they do not get a state of their own.
			$state = self::STATE_ACTIVATE;
		}

		return $state;
	}

	/**
	 * Reasons a site cannot be transferred, in the shape the API returns them.
	 *
	 * The code is kept because the page maps it to its own copy; the API's message comes
	 * along as the fallback the page renders for codes it does not recognize.
	 *
	 * @param array|null $eligibility Result of get_eligibility().
	 * @return array[] Errors as { code, message }.
	 */
	public static function get_transfer_errors( $eligibility ) {
		$errors = array();

		if ( ! empty( $eligibility['errors'] ) && is_array( $eligibility['errors'] ) ) {
			foreach ( $eligibility['errors'] as $error ) {
				if ( empty( $error['code'] ) ) {
					continue;
				}

				$errors[] = array(
					'code'    => (string) $error['code'],
					'message' => isset( $error['message'] ) ? (string) $error['message'] : '',
				);
			}
		}

		return $errors;
	}

	/**
	 * Non-blocking warnings to confirm before a transfer starts.
	 *
	 * The API groups warnings by type; they are flattened here because the page
	 * renders one list and a PHP map would localize as a JSON array once empty.
	 *
	 * @param array|null $eligibility Result of get_eligibility().
	 * @return array[] Warnings in the API's own shape, minus the grouping.
	 */
	public static function get_transfer_warnings( $eligibility ) {
		$warnings = array();

		if ( ! empty( $eligibility['warnings'] ) && is_array( $eligibility['warnings'] ) ) {
			foreach ( $eligibility['warnings'] as $group ) {
				if ( ! is_array( $group ) ) {
					continue;
				}

				foreach ( $group as $warning ) {
					if ( empty( $warning['id'] ) ) {
						continue;
					}

					$warnings[] = array(
						'id'           => (string) $warning['id'],
						'description'  => isset( $warning['description'] ) ? (string) $warning['description'] : '',
						'domain_names' => ( ! empty( $warning['domain_names']['current'] ) && ! empty( $warning['domain_names']['new'] ) )
							? array(
								'current' => (string) $warning['domain_names']['current'],
								'new'     => (string) $warning['domain_names']['new'],
							)
							: null,
						// Rendered as a link, so only a web URL gets through.
						'support_url'  => isset( $warning['support_url'] ) ? esc_url_raw( (string) $warning['support_url'], array( 'http', 'https' ) ) : '',
					);
				}
			}
		}

		return $warnings;
	}

	/**
	 * Checkout, with the plan that includes backups already in the cart.
	 *
	 * `redirect_to` returns a buyer here to activate what they just bought, and
	 * `checkoutBackUrl` returns someone who backs out; without it checkout falls back to /plans.
	 *
	 * @param string $domain Site domain.
	 * @return string
	 */
	public static function get_upgrade_url( $domain ) {
		$page_url = rawurlencode( self::get_page_url() );

		return add_query_arg(
			array(
				'redirect_to'     => $page_url,
				'checkoutBackUrl' => $page_url,
			),
			'https://wordpress.com/checkout/' . rawurlencode( (string) $domain ) . '/business'
		);
	}

	/**
	 * Where this page will live once the transfer lands.
	 *
	 * Uses the new address from the address-change warning rather than trusting the old
	 * one to redirect, which may not have propagated when the flow sends the reader back.
	 *
	 * @param array[] $warnings Result of get_transfer_warnings().
	 * @return string
	 */
	public static function get_post_transfer_page_url( array $warnings ) {
		$page_url = self::get_page_url();

		foreach ( $warnings as $warning ) {
			$new_host = $warning['domain_names']['new'] ?? '';

			// A bare hostname only, so nothing in the payload can steer the scheme or path.
			if ( is_string( $new_host ) && filter_var( $new_host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME ) ) {
				$parts = wp_parse_url( $page_url );

				return 'https://' . strtolower( $new_host ) . ( $parts['path'] ?? '' ) . ( isset( $parts['query'] ) ? '?' . $parts['query'] : '' );
			}
		}

		return $page_url;
	}

	/**
	 * URL of the Calypso flow that transfers the site and switches backups on.
	 *
	 * The flow waits for the transfer to land before following `redirect_to`.
	 *
	 * @param array[] $warnings Result of get_transfer_warnings(), for the post-transfer address.
	 * @return string
	 */
	public static function get_activate_url( array $warnings = array() ) {
		return add_query_arg(
			array(
				'siteId'                    => get_current_blog_id(),
				'initiate_transfer_context' => self::TRANSFER_CONTEXT,
				'redirect_to'               => rawurlencode( self::get_post_transfer_page_url( $warnings ) ),
			),
			self::TRANSFER_FLOW_URL
		);
	}
}

add_action( 'init', array( WPCOM_Backup::class, 'init' ) );
