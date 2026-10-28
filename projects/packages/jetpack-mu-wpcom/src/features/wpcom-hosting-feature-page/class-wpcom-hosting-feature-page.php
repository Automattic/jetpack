<?php
/**
 * Shared base for in-wp-admin pages that prompt WordPress.com Simple and WoA sites
 * to upgrade, or to transfer to WoA, before a hosting feature can run.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Constants;

require_once __DIR__ . '/../../common/class-wpcom-wp-build-page.php';

/**
 * Registers a hosting feature's admin page and its wp-build assets.
 *
 * Each page subclasses this, overriding the page constants.
 */
abstract class WPCOM_Hosting_Feature_Page extends WPCOM_WP_Build_Page {

	/**
	 * Document title of the page. A product name, so not translated.
	 */
	const PAGE_TITLE = '';

	/**
	 * Menu entry label. A product name, so not translated.
	 */
	const MENU_TITLE = '';

	/**
	 * Name of the `WPCOM_Features` constant the site's plan must include.
	 */
	const FEATURE = '';

	/**
	 * Calypso flow that initiates the transfer, reports progress and returns here.
	 */
	const TRANSFER_FLOW_URL = 'https://wordpress.com/setup/transferring-hosted-site';

	/**
	 * Tracks context recorded for the WoA transfer.
	 */
	const TRANSFER_CONTEXT = 'jetpack_product_activation';

	/**
	 * Shared by every hosting feature page, whose boot code is shared too.
	 */
	const INITIAL_STATE_VAR = 'wpcomHostingFeatureInitialState';

	/**
	 * The pages record their prompts in Tracks.
	 */
	const ENQUEUE_TRACKS = true;

	/**
	 * Site has no plan that includes the feature. Offer an upgrade.
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
	 * Whether the site's plan includes FEATURE. Without one it offers the upgrade, the one
	 * prompt that is never wrong for a site of unknown plan.
	 *
	 * @return bool
	 */
	public static function has_feature() {
		return self::site_has_feature( static::FEATURE );
	}

	/**
	 * Whether the site's plan includes WordPress.com's Atomic hosting, which these features run on.
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
		$constant = '\WPCOM_Features::' . $name;

		if ( '' === $name || ! function_exists( 'wpcom_site_has_feature' ) || ! defined( $constant ) ) {
			return false;
		}

		// Called without a blog ID: on WoA the local ID is not the WordPress.com one, so wpcom resolves the current site.
		return (bool) wpcom_site_has_feature( constant( $constant ) );
	}

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
	 * Whether this page should claim its slug at all.
	 *
	 * A plan that includes the feature only makes it live on Atomic infrastructure, so on
	 * WoA an entitled site already has it and this page steps aside. A Simple site is never
	 * Atomic, so the page always applies there.
	 *
	 * @return bool
	 */
	public static function should_register() {
		if ( ! self::is_atomic() ) {
			return true;
		}

		return ! static::has_feature();
	}

	/**
	 * The page title.
	 *
	 * @return string
	 */
	public static function get_page_title() {
		return static::PAGE_TITLE;
	}

	/**
	 * The menu entry's label.
	 *
	 * @return string
	 */
	public static function get_menu_title() {
		return static::MENU_TITLE;
	}

	/**
	 * Register the page, unless something else already serves the slug, and hide its entry.
	 *
	 * @return void
	 */
	public static function register_page() {
		parent::register_page();

		if ( static::owns_page() && static::hides_menu_entry() ) {
			self::hide_menu_entry();
		}
	}

	/**
	 * Whether this page keeps its entry out of the sidebar.
	 *
	 * @return bool
	 */
	public static function hides_menu_entry() {
		return true;
	}

	/**
	 * Keep this page's entry out of the sidebar, since Calypso owns the nav; hidden rather
	 * than removed, so the page stays reachable.
	 *
	 * Done here rather than in wpcom-admin-menu.php, which not every admin loads.
	 *
	 * @return void
	 */
	private static function hide_menu_entry() {
		global $submenu;

		foreach ( $submenu[ static::PARENT_SLUG ] ?? array() as $i => $item ) {
			if ( static::MENU_SLUG !== ( $item[2] ?? null ) || str_contains( $item[4] ?? '', 'hide-if-js' ) ) {
				continue;
			}

			// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			$submenu[ static::PARENT_SLUG ][ $i ][4] = trim( ( $item[4] ?? '' ) . ' hide-if-js' );
		}
	}

	/**
	 * The resolved prompt and everything it links to.
	 *
	 * @return array
	 */
	public static function get_initial_state() {
		$blog_id = get_current_blog_id();
		$domain  = wp_parse_url( home_url(), PHP_URL_HOST );
		$state   = static::get_state( $blog_id );

		// Only the activation prompt reads eligibility, and both lists come from the
		// same result, so resolve it once and only for that state.
		$eligibility     = self::STATE_ACTIVATE === $state
			? self::get_eligibility( $blog_id, get_current_user_id() )
			: null;
		$warnings        = self::get_transfer_warnings( $eligibility );
		$transfer_status = self::STATE_IN_PROGRESS === $state ? null : self::get_latest_transfer_status( $blog_id );

		return array(
			'state'               => $state,
			'domain'              => $domain,
			// A null result means the library was unavailable, not that the site
			// failed a check; let the transfer flow reject it instead.
			'isEligible'          => null === $eligibility || ! empty( $eligibility['is_eligible'] ),
			'errors'              => self::get_transfer_errors( $eligibility ),
			'warnings'            => $warnings,
			'upgradeUrl'          => static::get_upgrade_url( $domain ),
			'activateUrl'         => static::get_activate_url( $warnings ),
			'supportUrl'          => self::get_support_url(),
			// Each applies only to the prompt Calypso pairs it with.
			'hasRevertedTransfer' => self::STATE_UPGRADE === $state && 'reverted' === $transfer_status,
			'transferFailed'      => self::STATE_ACTIVATE === $state && 'error' === $transfer_status,
		);
	}

	/**
	 * Load wpcom's Atomic library for the transfer checks, which callers still guard with function_exists().
	 *
	 * @return bool False on WoA, where there is nothing left to transfer.
	 */
	private static function load_atomic_lib() {
		if ( self::is_atomic() ) {
			return false;
		}

		if ( function_exists( 'require_lib' ) ) {
			require_lib( 'atomic' );
		}

		return true;
	}

	/**
	 * Whether a transfer to WoA is already underway.
	 *
	 * @param int $blog_id Blog ID.
	 * @return bool
	 */
	public static function is_transfer_in_progress( $blog_id ) {
		if ( ! self::load_atomic_lib() ) {
			return false;
		}

		if ( function_exists( '\A8C\Atomic\has_site_pending_automated_transfer' ) ) {
			if ( \A8C\Atomic\has_site_pending_automated_transfer( $blog_id ) ) {
				return true;
			}
		}

		if ( function_exists( '\A8C\Atomic\is_wpcom_atomic' ) ) {
			// Second argument includes pending/active/provisioned transfers.
			return (bool) \A8C\Atomic\is_wpcom_atomic( $blog_id, true );
		}

		return false;
	}

	/**
	 * Status of the site's latest transfer to WoA, or null when it has none.
	 *
	 * @param int $blog_id Blog ID.
	 * @return string|null A transfer record status, such as `reverted` or `error`.
	 */
	public static function get_latest_transfer_status( $blog_id ) {
		if ( ! self::load_atomic_lib() || ! function_exists( 'woa_get_latest_transfer' ) ) {
			return null;
		}

		$transfer = woa_get_latest_transfer( $blog_id );

		if ( is_wp_error( $transfer ) || ! is_object( $transfer ) || ! isset( $transfer->status ) ) {
			return null;
		}

		return (string) $transfer->status;
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
		if ( ! self::load_atomic_lib() ) {
			return null;
		}

		if ( ! function_exists( '\A8C\Atomic\Eligibility\get_status_for_site' ) ) {
			return null;
		}

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
		// infrastructure that runs the feature, so there is nothing to transfer, and
		// should_register() has already stepped the page aside if it has the plan.
		// On Simple, activation also needs the hosting platform, as Calypso requires.
		if ( ! static::has_feature() || ! self::has_atomic_feature() || self::is_atomic() ) {
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
	 * Support's contact page, in the reader's language where WordPress.com has one.
	 *
	 * @return string
	 */
	public static function get_support_url() {
		$url = 'https://wordpress.com/help/contact';

		return function_exists( 'localized_wpcom_url' ) ? localized_wpcom_url( $url ) : $url;
	}

	/**
	 * On Simple, checkout with the Business plan already in the cart; on WoA, the plan upgrade flow.
	 *
	 * `redirect_to` returns a buyer to activate what they just bought, and
	 * `checkoutBackUrl` returns someone who backs out; without it checkout falls back to /plans.
	 *
	 * @param string $domain Site domain.
	 * @return string
	 */
	public static function get_upgrade_url( $domain ) {
		// On WoA the purchase makes the feature live, so there is nothing to come back here for.
		if ( self::is_atomic() ) {
			return static::get_plan_upgrade_url();
		}

		$page_url = rawurlencode( static::get_page_url() );

		return add_query_arg(
			array(
				'redirect_to'     => $page_url,
				'checkoutBackUrl' => $page_url,
			),
			'https://wordpress.com/checkout/' . rawurlencode( (string) $domain ) . '/business'
		);
	}

	/**
	 * WordPress.com's plan upgrade flow, showing only plans with FEATURE, with Back to the page the link was on.
	 *
	 * The flow and checkout accept `back_to` and `redirect_to` only on the site's own host or WordPress.com.
	 *
	 * @param string $back_url The admin page the link is on; this page when empty or off this site.
	 * @return string
	 */
	public static function get_plan_upgrade_url( $back_url = '' ) {
		$back     = '' === $back_url ? '' : wp_validate_redirect( $back_url, '' );
		$constant = '\WPCOM_Features::' . static::FEATURE;

		return add_query_arg(
			array_filter(
				array(
					'siteSlug'    => rawurlencode( wpcom_get_site_slug() ),
					'feature'     => defined( $constant ) ? constant( $constant ) : '',
					'back_to'     => rawurlencode( $back ? $back : static::get_page_url() ),
					'redirect_to' => rawurlencode( static::get_live_feature_url() ),
				)
			),
			'https://wordpress.com/setup/plan-upgrade'
		);
	}

	/**
	 * Where a site lands once its plan makes the feature live and this page steps aside.
	 *
	 * By default the slug's next owner serves the feature at this page's own address.
	 *
	 * @param string|null $new_host The site's address after a transfer, when it changes.
	 * @return string
	 */
	public static function get_live_feature_url( $new_host = null ) {
		$page_url = static::get_page_url();

		if ( null === $new_host ) {
			return $page_url;
		}

		$parts = wp_parse_url( $page_url );

		return 'https://' . $new_host . ( $parts['path'] ?? '' ) . ( isset( $parts['query'] ) ? '?' . $parts['query'] : '' );
	}

	/**
	 * The site's new address from the address-change warning, if the transfer changes it.
	 *
	 * Used rather than trusting the old address to redirect, which may not have propagated
	 * when the flow sends the reader back.
	 *
	 * @param array[] $warnings Result of get_transfer_warnings().
	 * @return string|null
	 */
	public static function get_post_transfer_host( array $warnings ) {
		foreach ( $warnings as $warning ) {
			$new_host = $warning['domain_names']['new'] ?? '';

			// A bare hostname only, so nothing in the payload can steer the scheme or path.
			if ( is_string( $new_host ) && filter_var( $new_host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME ) ) {
				return strtolower( $new_host );
			}
		}

		return null;
	}

	/**
	 * URL of the Calypso flow that transfers the site and switches the feature on.
	 *
	 * The flow waits for the transfer to land before following `redirect_to`.
	 *
	 * @param array[] $warnings Result of get_transfer_warnings(), for the post-transfer address.
	 * @return string
	 */
	public static function get_activate_url( array $warnings = array() ) {
		return add_query_arg(
			array(
				// Only Simple sites reach activation, and their local blog ID is the WordPress.com one; WoA's is not.
				'siteId'                    => get_current_blog_id(),
				'initiate_transfer_context' => self::TRANSFER_CONTEXT,
				'redirect_to'               => rawurlencode( static::get_live_feature_url( self::get_post_transfer_host( $warnings ) ) ),
			),
			self::TRANSFER_FLOW_URL
		);
	}
}
