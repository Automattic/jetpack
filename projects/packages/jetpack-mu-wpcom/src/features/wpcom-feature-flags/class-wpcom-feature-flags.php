<?php
/**
 * AUTOMATTICIANS ONLY. Internal Automattic tooling for flipping Jetpack feature
 * flags on WordPress.com Simple and Atomic sites.
 *
 * This is not a WordPress.com feature and is not supported. Site owners never
 * see it: the screen, its menu entry, and its save path are each gated on the
 * Automattician check below, which fails closed. Nothing here should ever be
 * documented for, linked to, or demonstrated to anyone outside Automattic.
 *
 * The jetpack-feature-flags package is a registry: it resolves every flag
 * through the `jetpack_feature_flag_enabled` filter and deliberately stores no
 * state of its own. Nothing on WordPress.com answered that filter, so a flag
 * could only be flipped by shipping a code change or a sandbox patch.
 *
 * This feature adds the missing control surface, on Simple and Atomic both:
 * a Tools -> Feature Flags screen listing the registered flags with a
 * three-state control each.
 *
 * Two properties are load-bearing:
 *
 * - The *screen* is Automattician-only and fails closed. Without the wpcom
 *   platform primitives that identify an Automattician, nobody sees it.
 * - The *overrides* are site-wide and are NOT re-gated on the Automattician
 *   check. That is the point: an override has to change what the site actually
 *   does, logged-out visitors included, or it cannot be used to test a flag
 *   end to end. It also means an override changes what the site's owner sees,
 *   which is why the screen says so in as many words.
 *
 * Strings here are intentionally not translated. This is internal Automattician
 * tooling, and putting its debug copy in front of GlotPress volunteers would
 * waste their time.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Status\Host;
use WPCOMSH_Support_Session_Detect;

/**
 * Site-wide feature flag overrides, and the Automattician-only screen that sets them.
 *
 * AUTOMATTICIANS ONLY — internal Automattic tooling, not a supported
 * user-facing feature. Every entry point that exposes the screen or writes an
 * override goes through current_user_can_manage(); do not add one that skips it.
 *
 * (Deliberately not tagged `@internal`: Phan reads that as "callable only from
 * this namespace" and rejects the loader in \Automattic\Jetpack calling init().)
 */
class Wpcom_Feature_Flags {

	/**
	 * Option holding the site's flag overrides, as a `flag name => bool` map.
	 *
	 * Stored non-autoloaded and deleted outright when the last override is
	 * removed, so the overwhelming majority of sites — which will never open
	 * this screen — carry no row and pay nothing for it.
	 */
	const OVERRIDES_OPTION = 'wpcom_feature_flag_overrides';

	/**
	 * Nonce action guarding the override form.
	 */
	const NONCE_ACTION = 'wpcom-feature-flags-save';

	/**
	 * Admin page slug.
	 */
	const PAGE_SLUG = 'wpcom-feature-flags';

	/**
	 * Capability required on top of the Automattician gate.
	 *
	 * Overrides change site behaviour, so hold the screen to the same bar as any
	 * other site-wide setting rather than leaning on the gate alone.
	 */
	const CAPABILITY = 'manage_options';

	/**
	 * Request-scoped cache of the sanitized override map.
	 *
	 * Null means "not read from the option yet", which is distinct from the empty
	 * array a site with no overrides legitimately has.
	 *
	 * @var array<array-key, bool>|null
	 */
	private static $overrides = null;

	/**
	 * Register the hooks this feature needs.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'jetpack_feature_flag_enabled', array( self::class, 'filter_enabled' ), 10, 2 );
		add_action( 'admin_menu', array( self::class, 'register_admin_page' ) );
	}

	/**
	 * Whether the current visitor is an Automattician.
	 *
	 * Mirrors the platform split already used by do_not_track_a11ns() in
	 * wpcom-wpadmin-page-view.php: on Simple the platform's own
	 * is_automattician() is authoritative, and on Atomic the a8c proxy is what
	 * identifies us. Both branches fail closed when their primitive is missing.
	 *
	 * A support session reaches an Atomic site through the same proxy, but it is
	 * a Happiness Engineer acting on the site owner's behalf rather than an
	 * Automattician testing unreleased work, so it is excluded. That exclusion
	 * fails closed too — see is_support_session() for why it cannot just ask
	 * wpcomsh and believe the answer.
	 *
	 * AT_PROXIED_REQUEST is read through Constants rather than defined() — which
	 * is what the neighbouring code uses — so the Atomic branch is reachable from
	 * tests at all. That is safe here because Constants::set_constant() is only
	 * callable by code already executing in this process, which by then can do
	 * anything this gate protects, and because manage_options is required on top.
	 * Do not lean on this gate alone for anything stronger.
	 *
	 * @return bool Whether the current visitor is an Automattician.
	 */
	public static function is_a11n() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return function_exists( 'is_automattician' ) && (bool) is_automattician();
		}

		if ( ! Constants::is_true( 'AT_PROXIED_REQUEST' ) ) {
			return false;
		}

		return ! self::is_support_session();
	}

	/**
	 * Whether the current user may read and change this site's flag overrides.
	 *
	 * @return bool Whether the current user may manage flag overrides.
	 */
	public static function current_user_can_manage() {
		return self::is_a11n() && current_user_can( self::CAPABILITY );
	}

	/**
	 * Return this site's flag overrides.
	 *
	 * Memoized for the request. filter_enabled() runs once per flag resolution,
	 * and the screen resolves every listed flag to fill its Effective column, so
	 * without this the option read, the per-entry preg_match(), and the ksort()
	 * in sanitize_overrides() all repeat for every flag checked. The option
	 * cannot change mid-request except through save_overrides(), which clears
	 * this. Code that writes the option behind our back — wp-cli, a direct
	 * update_option() — is picked up on the next request.
	 *
	 * @return array<array-key, bool> Map of flag name to forced value.
	 */
	public static function get_overrides() {
		if ( null !== self::$overrides ) {
			return self::$overrides;
		}

		$stored = get_option( self::OVERRIDES_OPTION );

		self::$overrides = is_array( $stored ) ? self::sanitize_overrides( $stored ) : array();

		return self::$overrides;
	}

	/**
	 * Persist this site's flag overrides, replacing whatever was stored.
	 *
	 * @param array<array-key, bool> $overrides Map of flag name to forced value.
	 * @return void
	 */
	public static function save_overrides( array $overrides ) {
		$overrides = self::sanitize_overrides( $overrides );

		self::$overrides = null;

		if ( empty( $overrides ) ) {
			delete_option( self::OVERRIDES_OPTION );

			return;
		}

		update_option( self::OVERRIDES_OPTION, $overrides, false );
	}

	/**
	 * Forget the memoized override map.
	 *
	 * Intended for tests, which write the option directly rather than through
	 * save_overrides(). Mirrors Feature_Flags::reset() in the registry package.
	 *
	 * @return void
	 */
	public static function reset_overrides_cache() {
		self::$overrides = null;
	}

	/**
	 * Turn the form's three-state controls into an override map.
	 *
	 * "default" means the absence of an override rather than an override to the
	 * flag's current default, so a flag left alone keeps following whatever the
	 * code that registered it decides later.
	 *
	 * @param array $states Map of flag name to 'on', 'off', or 'default'.
	 * @return array<array-key, bool> Override map.
	 */
	public static function overrides_from_states( array $states ) {
		$overrides = array();

		foreach ( $states as $name => $state ) {
			/*
			 * PHP casts a decimal-integer array key to int, so an all-digit flag
			 * name — which the documented ^[a-z0-9][a-z0-9_-]*$ pattern allows —
			 * arrives from $_POST as an int. Rejecting non-strings here would drop
			 * it silently after the screen had already offered a working-looking
			 * control for it. save_overrides() is what validates the name.
			 */
			if ( ! is_string( $name ) && ! is_int( $name ) ) {
				continue;
			}

			$name = (string) $name;

			if ( ! is_string( $state ) ) {
				continue;
			}

			if ( 'on' === $state ) {
				$overrides[ $name ] = true;
			} elseif ( 'off' === $state ) {
				$overrides[ $name ] = false;
			}
		}

		return $overrides;
	}

	/**
	 * Answer the feature flag package's resolution filter with this site's overrides.
	 *
	 * Deliberately not gated on is_a11n(): overrides are site-wide, so they have
	 * to apply to every visitor, including logged-out ones.
	 *
	 * @param bool   $enabled Whether the flag is enabled.
	 * @param string $name    Flag name.
	 * @return bool Whether the flag is enabled.
	 */
	public static function filter_enabled( $enabled, $name ) {
		$overrides = self::get_overrides();

		if ( ! is_string( $name ) || ! array_key_exists( $name, $overrides ) ) {
			return $enabled;
		}

		return $overrides[ $name ];
	}

	/**
	 * Register the Tools -> Feature Flags screen for Automatticians.
	 *
	 * @return string|false The resulting page's hook suffix, or false when the
	 *                      current user may not manage flag overrides.
	 */
	public static function register_admin_page() {
		if ( ! self::current_user_can_manage() ) {
			return false;
		}

		$hook_suffix = add_submenu_page(
			'tools.php',
			'Feature Flags (a8c)',
			'Feature Flags (a8c)',
			self::CAPABILITY,
			self::PAGE_SLUG,
			array( self::class, 'render_admin_page' )
		);

		if ( $hook_suffix ) {
			// Submissions are handled before any output, so the save can redirect.
			add_action( 'load-' . $hook_suffix, array( self::class, 'handle_admin_post' ) );
		}

		return $hook_suffix;
	}

	/**
	 * Handle a submission and redirect back to the screen.
	 *
	 * Post/Redirect/Get: without the redirect, reloading the screen after a save
	 * re-submits the form, and back/forward navigation replays it.
	 *
	 * @return void
	 */
	public static function handle_admin_post() {
		$redirect = self::maybe_handle_submission();

		if ( null === $redirect ) {
			return;
		}

		wp_safe_redirect( $redirect );
		exit;
	}

	/**
	 * Apply a submission, if this request is one, and say where to go next.
	 *
	 * Split from handle_admin_post() so everything except the redirect-and-exit
	 * is reachable from tests.
	 *
	 * @return string|null URL to redirect to, or null when this is not a submission.
	 */
	public static function maybe_handle_submission() {
		if ( ! isset( $_SERVER['REQUEST_METHOD'] ) || 'POST' !== strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) ) {
			return null;
		}

		/*
		 * Three outcomes, not two: a rejected submission has to be
		 * distinguishable from a plain page load. handle_save() returns false for
		 * a stale nonce — which this screen invites, being one you leave open —
		 * and re-rendering the unchanged page silently would look exactly like a
		 * successful save of the values already stored.
		 */
		// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- handle_save() verifies the nonce and sanitizes every value it stores.
		$result = self::handle_save( wp_unslash( $_POST ) ) ? 'saved' : 'rejected';

		return add_query_arg( 'flags-notice', $result, admin_url( 'tools.php?page=' . self::PAGE_SLUG ) );
	}

	/**
	 * Apply a submitted override form.
	 *
	 * Re-checks the Automattician gate, the capability, and the nonce: the
	 * screen's absence from the menu is not authorization on its own.
	 *
	 * The submitted map replaces the stored one wholesale, so two Automatticians
	 * saving the same site concurrently is last-write-wins. Every form carries
	 * every flag the screen listed, so in practice they overwrite each other with
	 * the same values; this is not an atomic read-modify-write and is not meant
	 * to be one.
	 *
	 * @param array $request Unslashed request data.
	 * @return bool Whether the overrides were saved.
	 */
	public static function handle_save( array $request ) {
		if ( ! self::current_user_can_manage() ) {
			return false;
		}

		$nonce = isset( $request['_wpnonce'] ) && is_string( $request['_wpnonce'] ) ? $request['_wpnonce'] : '';

		if ( ! wp_verify_nonce( $nonce, self::NONCE_ACTION ) ) {
			return false;
		}

		$states = isset( $request['flag_state'] ) && is_array( $request['flag_state'] ) ? $request['flag_state'] : array();

		self::save_overrides( self::overrides_from_states( $states ) );

		return true;
	}

	/**
	 * Render the Tools -> Feature Flags screen.
	 *
	 * @return void
	 */
	public static function render_admin_page() {
		if ( ! self::current_user_can_manage() ) {
			wp_die(
				'Jetpack feature flag controls are Automatticians only. This is internal Automattic tooling, not a site feature.',
				'Feature Flags',
				array( 'response' => 403 )
			);
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Display-only flag set by our own redirect; nothing is written here.
		$notice = isset( $_GET['flags-notice'] ) && is_string( $_GET['flags-notice'] )
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- As above.
			? sanitize_key( wp_unslash( $_GET['flags-notice'] ) )
			: '';

		self::print_screen( self::get_rows(), self::get_overrides(), $notice );
	}

	/**
	 * Print the screen's markup.
	 *
	 * @param array<string, array>   $rows      Flags to list, keyed by flag name.
	 * @param array<array-key, bool> $overrides The overrides currently in force.
	 * @param string                 $notice    'saved', 'rejected', or '' for a plain load.
	 * @return void
	 */
	private static function print_screen( array $rows, array $overrides, $notice = '' ) {
		$states = array(
			'default' => 'Default',
			'on'      => 'Force on',
			'off'     => 'Force off',
		);

		?>
		<div class="wrap">
			<h1>
				Feature Flags
				<span class="dashicons dashicons-lock" style="vertical-align: middle;" aria-hidden="true"></span>
				<span style="font-size: 0.6em; font-weight: normal; vertical-align: middle;">Automatticians only</span>
			</h1>

			<?php if ( 'saved' === $notice ) : ?>
				<div class="notice notice-success is-dismissible"><p>Overrides saved.</p></div>
			<?php elseif ( 'rejected' === $notice ) : ?>
				<div class="notice notice-error is-dismissible">
					<p>
						<strong>Your changes were not saved.</strong> The form&#8217;s security token had
						expired, or this session no longer passes the Automattician check. Reload the
						screen and try again — the states below are what is actually stored.
					</p>
				</div>
			<?php endif; ?>

			<div class="notice notice-warning">
				<p>
					<strong>Automatticians only — internal Automattic tooling.</strong> This screen is
					not part of WordPress.com, is not visible to the site&#8217;s owner, and is not
					supported. Do not point anyone outside Automattic at it.
				</p>
				<p>
					<strong>Overrides here are site-wide.</strong> They change what this site does for
					everyone — the site&#8217;s owner and logged-out visitors included — not just for
					you. Set a flag back to <em>Default</em> when you are done with it.
				</p>
			</div>

			<p>
				Flags are resolved as: the default they were registered with, then this screen, then
				any <code>jetpack_feature_flag_enabled_{flag}</code> filter. That per-flag filter runs
				last, so a sandbox patch or mu-plugin using it beats whatever you set here.
			</p>

			<form method="post" action="<?php echo esc_url( admin_url( 'tools.php?page=' . self::PAGE_SLUG ) ); ?>">
				<?php wp_nonce_field( self::NONCE_ACTION ); ?>

				<table class="widefat striped">
					<caption class="screen-reader-text">
						Feature flags registered on this site, with the override forced from this screen.
					</caption>
					<thead>
						<tr>
							<th scope="col">Flag</th>
							<th scope="col">Owner</th>
							<th scope="col">Default</th>
							<th scope="col">Effective</th>
							<th scope="col">State</th>
						</tr>
					</thead>
					<tbody>
						<?php if ( empty( $rows ) ) : ?>
							<tr>
								<td colspan="5">
									No feature flags are registered on this site, and nothing is
									overridden. Flags appear here once code running on this site calls
									<code>Feature_Flags::register()</code>.
								</td>
							</tr>
						<?php endif; ?>

						<?php foreach ( $rows as $flag_name => $row ) : ?>
							<?php
							$current = 'default';
							if ( array_key_exists( $flag_name, $overrides ) ) {
								$current = $overrides[ $flag_name ] ? 'on' : 'off';
							}
							?>
							<tr>
								<th scope="row">
									<code><?php echo esc_html( $flag_name ); ?></code>
									<?php if ( ! $row['registered'] ) : ?>
										<p class="description">Not registered on this site.</p>
									<?php elseif ( '' !== $row['description'] ) : ?>
										<p class="description"><?php echo esc_html( $row['description'] ); ?></p>
									<?php endif; ?>
								</th>
								<td><?php echo '' === $row['owner'] ? '&#8212;' : esc_html( $row['owner'] ); ?></td>
								<td>
									<?php
									if ( ! $row['registered'] ) {
										echo '&#8212;';
									} else {
										echo $row['default'] ? 'On' : 'Off';
									}
									?>
								</td>
								<td>
									<?php
									if ( null === $row['effective'] ) {
										echo '&#8212;';
									} else {
										echo $row['effective'] ? 'On' : 'Off';
									}
									?>
								</td>
								<td>
									<?php if ( ! $row['overridable'] ) : ?>
										<p class="description">
											This flag&#8217;s name does not match
											<code>^[a-z0-9][a-z0-9_-]*$</code>, so an override for it cannot
											be stored. Fix the name where the flag is registered.
										</p>
									<?php else : ?>
										<fieldset>
											<legend class="screen-reader-text">Override state for <?php echo esc_html( $flag_name ); ?></legend>
											<?php foreach ( $states as $value => $label ) : ?>
												<label style="margin-inline-end: 1em;">
													<input
														type="radio"
														name="flag_state[<?php echo esc_attr( $flag_name ); ?>]"
														value="<?php echo esc_attr( $value ); ?>"
														<?php checked( $current, $value ); ?>
													/>
													<?php echo esc_html( $label ); ?>
												</label>
											<?php endforeach; ?>
										</fieldset>
									<?php endif; ?>
								</td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>

				<?php submit_button( 'Save overrides' ); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * Whether this request has to be treated as a wpcomsh support session.
	 *
	 * Fails closed: anything short of a positive "not a support session" answer
	 * counts as one.
	 *
	 * The detector keeps its verdict in a client-side cookie and reports a
	 * missing cookie as "not a support session"
	 * (WPCOMSH_Support_Session_Detect::is_probably_support_session()). That
	 * default is right for the thing it was written for — suppressing a Tracks
	 * event — and wrong for an authorization gate, because the cookie is absent
	 * in cases nobody intended: it carries whatever lifetime wpcom passed as
	 * `expires`, so it can lapse while the login session lives on, and it is set
	 * SameSite=Strict, so a cross-site navigation into wp-admin does not send it
	 * on the first request. It can also simply be deleted; httponly stops page
	 * script from touching it, not a person with devtools open.
	 *
	 * So require has_detection_result() before trusting the verdict. The cost is
	 * that an Automattician whose browser holds no detection result does not see
	 * the screen until they log in through WordPress.com SSO again, which is what
	 * sets the cookie. Losing the screen for one navigation is the cheaper
	 * failure.
	 *
	 * Guarded with class_exists because the detector ships in wpcomsh, so it only
	 * exists on Atomic. Its absence counts as a support session for the same
	 * reason: with no detector there is no way to rule one out.
	 *
	 * @return bool Whether this request has to be treated as a support session.
	 */
	private static function is_support_session() {
		if ( ! class_exists( 'WPCOMSH_Support_Session_Detect' ) ) {
			return true;
		}

		if ( ! WPCOMSH_Support_Session_Detect::has_detection_result() ) {
			return true;
		}

		return WPCOMSH_Support_Session_Detect::is_probably_support_session();
	}

	/**
	 * Drop anything from an override map that could not have come from the form.
	 *
	 * The option is read on requests that have nothing to do with the screen, and
	 * flag names arrive as submitted form keys, so both directions are sanitized.
	 *
	 * @param array $overrides Untrusted override map.
	 * @return array<array-key, bool> Sanitized override map, sorted by flag name.
	 */
	private static function sanitize_overrides( array $overrides ) {
		$sanitized = array();

		foreach ( $overrides as $name => $enabled ) {
			// An all-digit flag name reaches this as an int key. See overrides_from_states().
			if ( ! is_string( $name ) && ! is_int( $name ) ) {
				continue;
			}

			if ( ! self::is_valid_flag_name( (string) $name ) ) {
				continue;
			}

			if ( ! is_scalar( $enabled ) ) {
				continue;
			}

			$sanitized[ $name ] = (bool) $enabled;
		}

		ksort( $sanitized );

		return $sanitized;
	}

	/**
	 * Whether a string is shaped like a feature flag name.
	 *
	 * The same pattern the jetpack-feature-flags package documents and enforces
	 * at lint time with the Jetpack.FeatureFlags.FeatureFlagName sniff.
	 * Registration does not check it at runtime, so this screen has to.
	 *
	 * @param string $name Candidate flag name.
	 * @return bool Whether the name is valid.
	 */
	private static function is_valid_flag_name( $name ) {
		return (bool) preg_match( '/^[a-z0-9][a-z0-9_-]*$/', $name );
	}

	/**
	 * Build the rows the screen lists.
	 *
	 * Registered flags come from the jetpack-feature-flags registry. Overrides
	 * for names the registry no longer knows are listed too — flags get retired,
	 * and an override that outlives its registration must stay visible on the
	 * screen that set it rather than becoming an invisible stuck value.
	 *
	 * @return array<string, array> Map of flag name to row data.
	 */
	private static function get_rows() {
		$has_registry = class_exists( Feature_Flags::class );
		$registered   = $has_registry ? Feature_Flags::all() : array();
		$rows         = array();

		foreach ( $registered as $name => $definition ) {
			$rows[ $name ] = array(
				'registered'  => true,
				'default'     => ! empty( $definition['default'] ),
				'description' => isset( $definition['description'] ) ? (string) $definition['description'] : '',
				'owner'       => isset( $definition['owner'] ) ? (string) $definition['owner'] : '',
			);
		}

		foreach ( array_keys( self::get_overrides() ) as $name ) {
			if ( isset( $rows[ $name ] ) ) {
				continue;
			}

			$rows[ $name ] = array(
				'registered'  => false,
				'default'     => false,
				'description' => '',
				'owner'       => '',
			);
		}

		foreach ( $rows as $name => $row ) {
			/*
			 * Registration does not validate names at runtime — the package
			 * enforces the pattern with a PHPCS sniff, which never runs against
			 * the wpcom Simple codebase. sanitize_overrides() would silently drop
			 * an override for a name that fails it, so flag those rows here and
			 * render them without a control rather than offering one that does
			 * nothing.
			 */
			$rows[ $name ]['overridable'] = self::is_valid_flag_name( $name );

			/*
			 * What the flag actually resolves to right now, which is not always
			 * what this screen set: the per-flag
			 * `jetpack_feature_flag_enabled_{$name}` filter runs after ours and
			 * wins. Showing it turns the screen from a settings form into
			 * something that answers "I forced it on, so why is it still off?".
			 */
			$rows[ $name ]['effective'] = $has_registry ? Feature_Flags::is_enabled( $name ) : null;
		}

		ksort( $rows );

		return $rows;
	}
}
