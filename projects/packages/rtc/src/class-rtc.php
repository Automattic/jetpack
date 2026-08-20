<?php
/**
 * Real-time Collaboration (RTC) websocket transport support.
 *
 * Extends Gutenberg's RTC feature with PingHub websocket transport
 * using the WordPress.com infrastructure.
 *
 * @package automattic/jetpack-rtc
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\RTC\REST_Connection_Log;
use Automattic\Jetpack\RTC\REST_Pinghub_Token;
use Automattic\Jetpack\RTC\REST_RTC_Notices;

/**
 * Main RTC class.
 */
class RTC {

	const PACKAGE_VERSION = '0.1.0';

	/**
	 * Option names for the RTC setting.
	 * The old name was used until Gutenberg PR #76643 renamed it.
	 * Both are supported for backwards compatibility.
	 */
	const OPTION_OLD = 'wp_enable_real_time_collaboration';
	const OPTION_NEW = 'wp_collaboration_enabled';

	/**
	 * The Gutenberg experiment that gates real-time collaboration.
	 *
	 * Added by Gutenberg PR #80658 (Gutenberg 23.8), which moved collaboration and its
	 * bundled HTTP polling provider behind a single experiment.
	 */
	const EXPERIMENT = 'gutenberg-real-time-collaboration';

	/**
	 * The option Gutenberg stores its experiments in.
	 */
	const EXPERIMENTS_OPTION = 'gutenberg-experiments';

	/**
	 * Records whether this site had explicitly opted into collaboration before the
	 * Gutenberg experiment existed.
	 *
	 * '1' when it had, '0' when it had not. Absent until we have looked.
	 */
	const OPTION_PRE_EXPERIMENT_OPT_IN = 'jetpack_rtc_pre_experiment_opt_in';

	/**
	 * Whether the hooks have been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * The stored collaboration setting as it was before Gutenberg's migration could run,
	 * captured on `init` priority 0. Null when nothing was stored, false before we looked.
	 *
	 * Per-request, deliberately: it answers "did the migration take this away from us just
	 * now", which a persisted value cannot, because an absent option means either "the
	 * migration deleted it" or "the user switched collaboration off".
	 *
	 * @var mixed
	 */
	private static $pre_migration_value = false;

	/**
	 * Whether Gutenberg's migration ran during this request.
	 *
	 * @var bool
	 */
	private static $migration_ran = false;

	/**
	 * Initialize the RTC package by registering hooks.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'register_providers' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'load_notices' ) );
		add_action( 'load-options-writing.php', array( __CLASS__, 'unregister_rtc_setting' ) );

		/*
		 * Gutenberg 23.8+ only. Both callbacks no-op on older Gutenberg, and the
		 * experiment filters are registered on `init` rather than here because
		 * resolving `is_allowed()` runs the `jetpack_rtc_enabled` filter, whose
		 * WP.com callbacks are not dependable while plugins are still loading.
		 */
		add_action( 'init', array( __CLASS__, 'carry_over_opt_in' ), 0 );
		add_action( 'init', array( __CLASS__, 'register_experiment_filters' ), 1 );
		// Priority 30 so it lands after Gutenberg's migration deletes the option at 20.
		add_action( 'init', array( __CLASS__, 'restore_opt_in' ), 30 );

		/*
		 * `_gutenberg_migrate_database()` writes this option as its final statement, so the
		 * hook firing is proof the migration just ran. That distinction matters: an absent
		 * collaboration option means "the migration removed it" or "the user switched it
		 * off", and only the first is ours to undo.
		 */
		add_action( 'update_option_gutenberg_version_migration', array( __CLASS__, 'note_migration_ran' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_rtc_setting' ) );

		// Hook into both old and new option names for backwards compatibility.
		foreach ( array( self::OPTION_OLD, self::OPTION_NEW ) as $option ) {
			add_filter( 'option_' . $option, array( __CLASS__, 'filter_rtc_option' ), 10 );
			add_filter( 'default_option_' . $option, array( __CLASS__, 'default_rtc_option' ), 20, 2 );
			add_filter( 'pre_option_' . $option, array( __CLASS__, 'pre_rtc_option' ) );
		}
	}

	/**
	 * Determine whether RTC is allowed.
	 *
	 * @return bool
	 */
	public static function is_allowed() {
		/**
		 * Filter whether RTC can be enabled.
		 *
		 * @param bool $is_enabled Whether RTC can be enabled.
		 */
		return apply_filters( 'jetpack_rtc_enabled', false );
	}

	/**
	 * Determine whether RTC is allowed and switched on for this site.
	 *
	 * Unlike is_enabled(), this ignores the current admin screen, so it describes the
	 * site's configuration rather than the current request. The experiment gate uses
	 * it for that reason: registering the sync storage post type and REST routes must
	 * not depend on which admin page happens to be loading.
	 *
	 * @return bool
	 */
	public static function is_turned_on() {
		return self::is_allowed() && (bool) get_option( self::OPTION_NEW );
	}

	/**
	 * Determine whether RTC is enabled.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		global $pagenow;

		// Real-time collaboration is not enabled in the site editor.
		if (
			'site-editor.php' === $pagenow ||
			( 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'site-editor-v2' === sanitize_text_field( wp_unslash( $_GET['page'] ) ) ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		) {
			return false;
		}

		return self::is_turned_on();
	}

	/**
	 * Determine whether the loaded Gutenberg gates RTC behind the experiment.
	 *
	 * Gutenberg PR #80658 (Gutenberg 23.8) repointed `wp_is_collaboration_enabled()` at
	 * the `gutenberg-real-time-collaboration` experiment, removed
	 * `wp_is_collaboration_allowed()`, dropped the collaboration field from
	 * Settings > Writing, and deleted the `wp_collaboration_enabled` option in a
	 * migration.
	 *
	 * This feature-detects that pair of functions instead of comparing version numbers,
	 * because what matters is the shape of the API rather than the release string, and
	 * WordPress.com can load `dev` and `-fuzz` builds whose versions do not sort
	 * meaningfully.
	 *
	 * @return bool
	 */
	public static function uses_experiment() {
		$uses_experiment = function_exists( 'wp_is_collaboration_enabled' ) && ! function_exists( 'wp_is_collaboration_allowed' );

		/**
		 * Filter whether RTC is gated by the Gutenberg experiment.
		 *
		 * An escape hatch for builds the detection above cannot classify.
		 *
		 * @param bool $uses_experiment Whether the loaded Gutenberg gates RTC behind the experiment.
		 */
		return (bool) apply_filters( 'jetpack_rtc_uses_experiment', $uses_experiment );
	}

	/**
	 * Get the list of active RTC providers.
	 *
	 * @return string[]
	 */
	public static function get_providers() {
		if ( ! self::is_enabled() ) {
			return array();
		}

		$allowed_providers = array( 'http-polling', 'pinghub' );

		$default_providers = array( 'pinghub' );

		/**
		 * Filter the list of RTC providers.
		 *
		 * @param string[] $providers List of provider identifiers.
		 */
		$providers = apply_filters( 'jetpack_rtc_providers', $default_providers );
		if ( ! is_array( $providers ) ) {
			return array();
		}

		return array_values(
			array_filter(
				$providers,
				function ( $provider ) use ( $allowed_providers ) {
					return in_array( $provider, $allowed_providers, true );
				}
			)
		);
	}

	/**
	 * Register REST API routes for the PingHub token endpoint.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		( new REST_Pinghub_Token() )->register_routes();
		( new REST_RTC_Notices() )->register_routes();

		if ( function_exists( 'log2logstash' ) ) {
			( new REST_Connection_Log() )->register_routes();
		}
	}

	/**
	 * Enqueue the assets that extend the RTC providers.
	 *
	 * @return void
	 */
	public static function register_providers() {
		if ( ! self::is_enabled() ) {
			return;
		}

		$providers = self::get_providers();

		// If HTTP polling (Gutenberg's built-in default provider when this script isn't enqueued)
		// is the only provider being used, then we don't need to inject any assets since that's
		// already the default behavior.
		if ( count( $providers ) === 1 && in_array( 'http-polling', $providers, true ) ) {
			return;
		}

		$handle = 'jetpack-rtc-providers';

		Assets::register_script(
			$handle,
			'../build/rtc-providers.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-rtc',
				'enqueue'    => true,
			)
		);

		$data = wp_json_encode(
			array(
				'providers'         => $providers,
				'connectionLogging' => function_exists( 'log2logstash' ),
				'currentPostType'   => get_post_type() ? get_post_type() : null,
				'currentPostId'     => get_the_ID() ? get_the_ID() : null,
			),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		);

		wp_add_inline_script(
			$handle,
			"var jetpackRTC = $data;",
			'before'
		);
	}

	/**
	 * Unregister the RTC setting field on the Writing page if RTC is not allowed.
	 *
	 * @return void
	 */
	public static function unregister_rtc_setting() {
		if ( self::is_allowed() ) {
			return;
		}

		global $wp_settings_fields;

		foreach ( array( self::OPTION_OLD, self::OPTION_NEW ) as $option ) {
			if ( isset( $wp_settings_fields['writing']['default'][ $option ] ) ) {
				unset( $wp_settings_fields['writing']['default'][ $option ] );
			}
		}
	}

	/**
	 * When RTC is not allowed, always force the option off.
	 * When RTC is allowed, respect the stored option value.
	 *
	 * @param mixed $value  The value of the option.
	 * @return mixed
	 */
	public static function filter_rtc_option( $value ) {
		// RTC not allowed: force the option off, regardless of what's in the DB.
		if ( ! self::is_allowed() ) {
			return '0';
		}

		// RTC allowed: respect whatever is stored.
		return $value;
	}

	/**
	 * Default the collaboration setting to off.
	 *
	 * Real-time collaboration is opt-in: Gutenberg 23.8 made it an experiment that sites
	 * must enable explicitly, and on earlier versions there is no longer a reason to have
	 * it on by default either. Sites that turned it on have a stored value, which
	 * `get_option()` returns without ever consulting this filter.
	 *
	 * @return string Always '0'.
	 */
	public static function default_rtc_option() {
		return '0';
	}

	/**
	 * Disable RTC for super admins that are not members of the blog to avoid
	 * accidentally exposing their presence to site users (e.g. during support).
	 * Skip this on the Writing settings page so they can still toggle the option.
	 *
	 * @return mixed
	 */
	public static function pre_rtc_option() {
		global $pagenow;

		if ( 'options-writing.php' !== $pagenow && is_super_admin() && ! is_user_member_of_blog() ) {
			return '0';
		}

		// Returning false to let `get_option` proceed normally.
		return false;
	}

	/**
	 * Preserve an explicit opt-in across Gutenberg's collaboration migration.
	 *
	 * Gutenberg 23.8's `_gutenberg_migrate_remove_legacy_collaboration_options()` deletes
	 * `wp_collaboration_enabled` outright on `init` priority 20, without migrating it. For
	 * sites that never touched the setting that is exactly right — they were only ever on
	 * because the old default was on. But it also discards the choice of sites that
	 * deliberately switched collaboration on, and those we want to keep.
	 *
	 * The distinction is that the option only exists in the database when something
	 * actually wrote it: saving Settings > Writing, or a WP-CLI/REST update. An absent
	 * option means "never chosen", so reading the stored value — rather than the effective
	 * one — separates the two groups cleanly.
	 *
	 * Runs on `init` priority 0, so on the first request under Gutenberg 23.8 we read the
	 * value before the migration at priority 20 removes it.
	 *
	 * Note this only works if this package is deployed before Gutenberg 23.8 reaches the
	 * site. If the migration runs first the stored values are already gone and there is
	 * nothing left to carry.
	 *
	 * @return void
	 */
	public static function carry_over_opt_in() {
		if ( ! self::uses_experiment() ) {
			return;
		}

		/*
		 * Runs before Gutenberg's migration at priority 20, so this is the last chance to
		 * see the stored value. Captured on every request, not just the first, because the
		 * migration can run more than once: a sandbox on an older Gutenberg rewrites
		 * `gutenberg_version_migration` to its own version, and production then re-runs its
		 * migration and deletes the option again.
		 */
		self::$pre_migration_value = self::get_stored_option( self::OPTION_NEW );

		// Already looked. Recorded as '1' or '0', so anything but false means done.
		if ( false !== get_option( self::OPTION_PRE_EXPERIMENT_OPT_IN, false ) ) {
			return;
		}

		/*
		 * Record an answer for every site, including ones that cannot run RTC. Writing the
		 * marker unconditionally is what lets the check above short-circuit on subsequent
		 * requests; skipping disallowed sites would leave them re-evaluating this on every
		 * admin request forever. Whether RTC is allowed is still enforced at read time by
		 * `is_turned_on()`.
		 */
		update_option( self::OPTION_PRE_EXPERIMENT_OPT_IN, self::had_explicit_opt_in() ? '1' : '0' );
	}

	/**
	 * Record that Gutenberg's migration ran during this request.
	 *
	 * @return void
	 */
	public static function note_migration_ran() {
		self::$migration_ran = true;
	}

	/**
	 * Re-apply the collaboration setting after Gutenberg's migration has removed it.
	 *
	 * Deliberately writes a real option value instead of leaning on
	 * `default_rtc_option()`. Unchecking the box on Settings > Writing does not store a
	 * '0' — it removes the row entirely — so anything expressed as a default would
	 * re-apply itself on the next request and make the setting impossible to switch off.
	 *
	 * Two things have to be true before anything is written. The migration must have run
	 * in this request, and the value must have been there when we looked at priority 0.
	 * Together they separate "the migration took this away" from "the user switched it
	 * off", which an absent option cannot distinguish on its own.
	 *
	 * This is not once-only. The migration re-runs whenever `gutenberg_version_migration`
	 * disagrees with the running Gutenberg, which happens every time a sandbox on an older
	 * version rewrites it and production migrates again. Restoring only once left those
	 * sites losing a deliberate opt-in on the second pass.
	 *
	 * @return void
	 */
	public static function restore_opt_in() {
		if ( ! self::uses_experiment() ) {
			return;
		}

		if ( ! self::$migration_ran ) {
			return;
		}

		// Only restore into the gap the migration left. Never overwrite a real choice.
		if ( null !== self::get_stored_option( self::OPTION_NEW ) ) {
			return;
		}

		if ( null !== self::$pre_migration_value && false !== self::$pre_migration_value ) {
			// Restore exactly what was there, so a stored opt-out survives too.
			update_option( self::OPTION_NEW, self::$pre_migration_value );
			return;
		}

		/*
		 * Nothing was stored when we looked, so fall back to the marker recorded the first
		 * time this package ran. That covers a site whose option was already gone by then,
		 * for instance because the old option names were removed by an earlier migration.
		 * Consumed here, since it describes a moment that has passed and cannot recur.
		 */
		if ( '1' !== get_option( self::OPTION_PRE_EXPERIMENT_OPT_IN ) ) {
			return;
		}

		update_option( self::OPTION_PRE_EXPERIMENT_OPT_IN, '0' );
		update_option( self::OPTION_NEW, '1' );
	}

	/**
	 * Whether collaboration was explicitly switched on before the experiment existed.
	 *
	 * @return bool
	 */
	private static function had_explicit_opt_in() {
		foreach ( array( self::OPTION_NEW, self::OPTION_OLD ) as $option ) {
			$stored = self::get_stored_option( $option );

			if ( null !== $stored ) {
				// (bool) '0' is false, so a stored opt-out correctly reads as no opt-in.
				return (bool) $stored;
			}
		}

		return false;
	}

	/**
	 * Read an option's stored value, or null when nothing is stored.
	 *
	 * `get_option()` cannot answer "is this stored?" on its own here, because this class
	 * filters the option to a value whether or not one exists. Lifting our own filters for
	 * the duration of the read lets the missing-option default come through untouched.
	 *
	 * @param string $option Option name.
	 * @return mixed The stored value, or null when the option does not exist.
	 */
	private static function get_stored_option( $option ) {
		$filters = array(
			array( 'pre_option_' . $option, 'pre_rtc_option', 10, 1 ),
			array( 'option_' . $option, 'filter_rtc_option', 10, 1 ),
			array( 'default_option_' . $option, 'default_rtc_option', 20, 2 ),
		);

		// Restore only what was actually hooked, so this cannot add filters of its own.
		$hooked = array();
		foreach ( $filters as $filter ) {
			list( $hook, $method, $priority ) = $filter;

			$hooked[ $hook ] = has_filter( $hook, array( __CLASS__, $method ) ) === $priority;
			if ( $hooked[ $hook ] ) {
				remove_filter( $hook, array( __CLASS__, $method ), $priority );
			}
		}

		$stored = get_option( $option, null );

		foreach ( $filters as $filter ) {
			list( $hook, $method, $priority, $args ) = $filter;

			if ( $hooked[ $hook ] ) {
				add_filter( $hook, array( __CLASS__, $method ), $priority, $args );
			}
		}

		return $stored;
	}

	/**
	 * Register the filters that drive the Gutenberg RTC experiment.
	 *
	 * Runs on `init` so that resolving `is_allowed()` — which fires the
	 * `jetpack_rtc_enabled` filter, and on WP.com reads site features and stickers —
	 * happens after plugins have finished loading. Everything in Gutenberg that reads
	 * the experiment does so on `init`, `admin_init`, `rest_api_init` or
	 * `block_editor_settings_all`, all of which run later.
	 *
	 * @return void
	 */
	public static function register_experiment_filters() {
		if ( ! self::uses_experiment() ) {
			return;
		}

		// 'option_' fires when the option exists in the DB, 'default_option_' when it does not.
		add_filter( 'option_' . self::EXPERIMENTS_OPTION, array( __CLASS__, 'filter_experiments' ) );

		/*
		 * Priority 20 because Gutenberg registers `gutenberg-experiments` with a default
		 * of array() on `rest_api_init`. register_setting() hooks core's
		 * filter_default_option() onto `default_option_gutenberg-experiments` at priority
		 * 10, and that callback ignores the value it is handed and returns the registered
		 * default. At the same priority ours runs first and its result is thrown away, so
		 * the experiment would read as disabled on every REST request no matter what the
		 * setting says. Running after core's callback is the same reason default_rtc_option
		 * is registered at 20.
		 */
		add_filter( 'default_option_' . self::EXPERIMENTS_OPTION, array( __CLASS__, 'filter_experiments' ), 20 );
	}

	/**
	 * Toggle the RTC experiment to match the site's collaboration setting.
	 *
	 * Keeping the setting as the single source of truth avoids the "collaboration on,
	 * no provider registered" state that Gutenberg PR #80658 was written to eliminate.
	 *
	 * @param mixed $experiments The `gutenberg-experiments` option value.
	 * @return array The experiments, with RTC toggled to match the setting.
	 */
	public static function filter_experiments( $experiments ) {
		if ( ! is_array( $experiments ) ) {
			$experiments = array();
		}

		if ( self::is_turned_on() ) {
			$experiments[ self::EXPERIMENT ] = true;
		} else {
			// Unset rather than leave alone, so the setting still wins if the experiment
			// was enabled directly through the Gutenberg Experiments page.
			unset( $experiments[ self::EXPERIMENT ] );
		}

		return $experiments;
	}

	/**
	 * Register the collaboration setting on Settings > Writing.
	 *
	 * Gutenberg 23.8+ removed its own field, leaving the Experiments page as the only
	 * way to turn RTC on. That page is hidden on WP.com Simple sites, and asking people
	 * to toggle an experiment is the wrong level of exposure for a hosted product, so we
	 * register a replacement. The wording matches the checkbox Gutenberg removed.
	 *
	 * @return void
	 */
	public static function register_rtc_setting() {
		if ( ! self::uses_experiment() || ! self::is_allowed() ) {
			return;
		}

		register_setting(
			'writing',
			self::OPTION_NEW,
			array(
				'type'              => 'boolean',
				'description'       => __( 'Enable Real-Time Collaboration', 'jetpack-rtc' ),
				'sanitize_callback' => 'rest_sanitize_boolean',
				'default'           => false,
				'show_in_rest'      => true,
			)
		);

		add_settings_field(
			self::OPTION_NEW,
			__( 'Collaboration', 'jetpack-rtc' ),
			array( __CLASS__, 'render_rtc_setting_field' ),
			'writing'
		);
	}

	/**
	 * Render the collaboration checkbox on Settings > Writing.
	 *
	 * @return void
	 */
	public static function render_rtc_setting_field() {
		?>
		<label for="<?php echo esc_attr( self::OPTION_NEW ); ?>">
			<input
				name="<?php echo esc_attr( self::OPTION_NEW ); ?>"
				type="checkbox"
				id="<?php echo esc_attr( self::OPTION_NEW ); ?>"
				value="1"
				<?php checked( (bool) get_option( self::OPTION_NEW ) ); ?>
			/>
			<?php esc_html_e( "Enable early access to real-time collaboration. Real-time collaboration may affect your website's performance.", 'jetpack-rtc' ); ?>
		</label>
		<?php
	}

	/**
	 * Get the maximum number of peers allowed per room.
	 *
	 * @return int Max peers per room.
	 */
	public static function get_max_peers_per_room() {
		return (int) apply_filters( 'jetpack_rtc_max_peers_per_room', 3 );
	}

	/**
	 * Check if the current user is the plan owner for this site.
	 * Works on Simple sites (via wpcom_get_blog_owner) and Atomic sites
	 * (via Jetpack connection master_user). Returns false on self-hosted
	 * since there is no WP.com plan to upgrade.
	 *
	 * @return bool
	 */
	public static function is_plan_owner() {
		$current_user_id = get_current_user_id();

		// Simple sites: wpcom_get_blog_owner is the canonical source.
		if ( function_exists( 'wpcom_get_blog_owner' ) ) {
			$owner_id = wpcom_get_blog_owner( get_wpcom_blog_id() );
			return (int) $current_user_id === (int) $owner_id;
		}

		// Atomic sites: the Jetpack connection master_user is the plan owner.
		if ( class_exists( 'Jetpack_Options' ) ) {
			$master_user = \Jetpack_Options::get_option( 'master_user' );
			if ( $master_user ) {
				return (int) $current_user_id === (int) $master_user;
			}
		}

		return false;
	}

	/**
	 * Get the site slug for use in WP.com URLs.
	 *
	 * @return string
	 */
	private static function get_site_slug() {
		if ( function_exists( 'wpcom_get_site_slug' ) ) {
			return wpcom_get_site_slug();
		}

		if ( class_exists( '\Automattic\Jetpack\Status' ) ) {
			$jetpack_status = new \Automattic\Jetpack\Status();
			return $jetpack_status->get_site_suffix();
		}

		return '';
	}

	/**
	 * Enqueue the assets that handle the RTC notices.
	 *
	 * @return void
	 */
	public static function load_notices() {
		if ( ! self::is_enabled() ) {
			return;
		}

		$handle = 'jetpack-rtc-notices';

		Assets::register_script(
			$handle,
			'../build/rtc-notices.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-rtc',
				'enqueue'    => true,
			)
		);

		$is_admin_user = current_user_can( 'manage_options' );
		$is_plan_owner = self::is_plan_owner();
		$post_type     = get_post_type();

		$data = wp_json_encode(
			array(
				'assetsUrl'          => plugins_url( '../build/', __FILE__ ),
				'isAdmin'            => $is_admin_user,
				'isPlanOwner'        => $is_plan_owner,
				'postId'             => get_the_ID(),
				'postType'           => $post_type ? $post_type : null,
				'userId'             => get_current_user_id(),
				'postTitle'          => get_the_title(),
				'postEditUrl'        => get_edit_post_link( get_the_ID(), 'raw' ),
				'postsListUrl'       => admin_url( 'edit.php' ),
				'siteSlug'           => self::get_site_slug(),
				'maxPeersPerRoom'    => self::get_max_peers_per_room(),
				'enableLimitNotices' => apply_filters( 'jetpack_rtc_enable_limit_notices', false ),
			),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		);

		wp_add_inline_script(
			$handle,
			"var jetpackRtcNotices = $data;",
			'before'
		);
	}
}
