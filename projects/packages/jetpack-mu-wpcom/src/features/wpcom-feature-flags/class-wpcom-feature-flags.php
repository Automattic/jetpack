<?php
/**
 * Automattician-only controls for Jetpack feature flags.
 *
 * The jetpack-feature-flags package is a registry: it resolves every flag
 * through the `jetpack_feature_flag_enabled` filter and deliberately stores no
 * state of its own. Nothing on WordPress.com answered that filter, so a flag
 * could only be flipped by shipping a code change or a sandbox patch.
 *
 * This feature adds the missing control surface, on Simple and Atomic both:
 * a Tools -> Feature Flags screen listing the registered flags with a
 * three-state control each, plus a row for forcing a flag the local registry
 * has never heard of.
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
	 * Automattician testing unreleased work, so it is excluded.
	 *
	 * @return bool Whether the current visitor is an Automattician.
	 */
	public static function is_a11n() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return function_exists( 'is_automattician' ) && (bool) is_automattician( get_current_user_id() );
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
	 * @return array<string, bool> Map of flag name to forced value.
	 */
	public static function get_overrides() {
		$stored = get_option( self::OVERRIDES_OPTION );

		if ( ! is_array( $stored ) ) {
			return array();
		}

		return self::sanitize_overrides( $stored );
	}

	/**
	 * Persist this site's flag overrides, replacing whatever was stored.
	 *
	 * @param array<string, bool> $overrides Map of flag name to forced value.
	 * @return void
	 */
	public static function save_overrides( array $overrides ) {
		$overrides = self::sanitize_overrides( $overrides );

		if ( empty( $overrides ) ) {
			delete_option( self::OVERRIDES_OPTION );

			return;
		}

		update_option( self::OVERRIDES_OPTION, $overrides, false );
	}

	/**
	 * Turn the form's three-state controls into an override map.
	 *
	 * "default" means the absence of an override rather than an override to the
	 * flag's current default, so a flag left alone keeps following whatever the
	 * code that registered it decides later.
	 *
	 * @param array $states Map of flag name to 'on', 'off', or 'default'.
	 * @return array<string, bool> Override map.
	 */
	public static function overrides_from_states( array $states ) {
		$overrides = array();

		foreach ( $states as $name => $state ) {
			if ( ! is_string( $name ) || ! is_string( $state ) ) {
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

		return add_submenu_page(
			'tools.php',
			'Feature Flags',
			'Feature Flags',
			self::CAPABILITY,
			self::PAGE_SLUG,
			array( self::class, 'render_admin_page' )
		);
	}

	/**
	 * Apply a submitted override form.
	 *
	 * Re-checks the Automattician gate, the capability, and the nonce: the
	 * screen's absence from the menu is not authorization on its own.
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

		$custom_name = isset( $request['custom_flag_name'] ) && is_string( $request['custom_flag_name'] )
			? strtolower( trim( $request['custom_flag_name'] ) )
			: '';

		if ( '' !== $custom_name ) {
			$states[ $custom_name ] = isset( $request['custom_flag_state'] ) && is_string( $request['custom_flag_state'] )
				? $request['custom_flag_state']
				: 'on';
		}

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
			wp_die( 'You do not have permission to manage this site&#8217;s Jetpack feature flags.' );
		}

		$saved = false;

		if ( isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === strtoupper( sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- handle_save() verifies the nonce and sanitizes every value it stores.
			$saved = self::handle_save( wp_unslash( $_POST ) );
		}

		self::print_screen( self::get_rows(), self::get_overrides(), $saved );
	}

	/**
	 * Print the screen's markup.
	 *
	 * @param array<string, array> $rows      Flags to list, keyed by flag name.
	 * @param array<string, bool>  $overrides The overrides currently in force.
	 * @param bool                 $saved     Whether a submission was just applied.
	 * @return void
	 */
	private static function print_screen( array $rows, array $overrides, $saved ) {
		$states = array(
			'default' => 'Default',
			'on'      => 'Force on',
			'off'     => 'Force off',
		);

		?>
		<div class="wrap">
			<h1>Feature Flags</h1>

			<?php if ( $saved ) : ?>
				<div class="notice notice-success is-dismissible"><p>Overrides saved.</p></div>
			<?php endif; ?>

			<div class="notice notice-warning">
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
					<thead>
						<tr>
							<th scope="col">Flag</th>
							<th scope="col">Owner</th>
							<th scope="col">Default</th>
							<th scope="col">State</th>
						</tr>
					</thead>
					<tbody>
						<?php if ( empty( $rows ) ) : ?>
							<tr>
								<td colspan="4">
									No feature flags are registered on this site, and nothing is
									overridden. Use the row below to force a flag by name.
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
								<td>
									<code><?php echo esc_html( $flag_name ); ?></code>
									<?php if ( ! $row['registered'] ) : ?>
										<p class="description">Not registered on this site.</p>
									<?php elseif ( '' !== $row['description'] ) : ?>
										<p class="description"><?php echo esc_html( $row['description'] ); ?></p>
									<?php endif; ?>
								</td>
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
								</td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>

				<h2>Force a flag by name</h2>
				<p>
					A flag that is checked on this site but registered elsewhere will not be listed
					above. Unknown flags still pass through the resolution filter, so forcing one by
					name works.
				</p>
				<p>
					<label>
						Flag name
						<input type="text" name="custom_flag_name" value="" class="regular-text" pattern="[a-z0-9][a-z0-9_\-]*" />
					</label>
					<label>
						State
						<select name="custom_flag_state">
							<option value="on">Force on</option>
							<option value="off">Force off</option>
						</select>
					</label>
				</p>

				<?php submit_button( 'Save overrides' ); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * Whether this request looks like a wpcomsh support session.
	 *
	 * Guarded with class_exists because the detector ships in wpcomsh, so it
	 * only exists on Atomic.
	 *
	 * @return bool Whether this is probably a support session.
	 */
	private static function is_support_session() {
		return class_exists( 'WPCOMSH_Support_Session_Detect' )
			&& WPCOMSH_Support_Session_Detect::is_probably_support_session();
	}

	/**
	 * Drop anything from an override map that could not have come from the form.
	 *
	 * The screen accepts a hand-typed flag name, and the option is read on
	 * requests that have nothing to do with the screen, so both directions are
	 * sanitized.
	 *
	 * @param array $overrides Untrusted override map.
	 * @return array<string, bool> Sanitized override map, sorted by flag name.
	 */
	private static function sanitize_overrides( array $overrides ) {
		$sanitized = array();

		foreach ( $overrides as $name => $enabled ) {
			if ( ! is_string( $name ) || ! self::is_valid_flag_name( $name ) ) {
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
	 * for names the registry has never heard of are listed too, so a flag forced
	 * by hand does not silently disappear from the screen that set it.
	 *
	 * @return array<string, array> Map of flag name to row data.
	 */
	private static function get_rows() {
		$registered = class_exists( Feature_Flags::class ) ? Feature_Flags::all() : array();
		$rows       = array();

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

		ksort( $rows );

		return $rows;
	}
}
