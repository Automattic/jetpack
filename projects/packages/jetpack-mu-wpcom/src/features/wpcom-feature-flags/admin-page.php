<?php
/**
 * Markup for the Automattician-only Tools -> Feature Flags screen.
 *
 * Loaded from wpcom_feature_flags_render_admin_page() rather than at feature
 * load time, so the markup costs nothing on the requests that never render it.
 * Every caller has already passed wpcom_feature_flags_current_user_can_manage().
 *
 * Strings are intentionally untranslated — see wpcom-feature-flags.php.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;

/**
 * Build the rows the screen lists.
 *
 * Registered flags come from the jetpack-feature-flags registry. Overrides for
 * names the registry has never heard of are listed too, so a flag forced by hand
 * does not silently disappear from the screen that set it.
 *
 * @return array<string, array> Map of flag name to row data.
 */
function wpcom_feature_flags_get_rows() {
	$registered = class_exists( Feature_Flags::class ) ? Feature_Flags::all() : array();
	$overrides  = wpcom_feature_flags_get_overrides();
	$rows       = array();

	foreach ( $registered as $name => $definition ) {
		$rows[ $name ] = array(
			'registered'  => true,
			'default'     => ! empty( $definition['default'] ),
			'description' => isset( $definition['description'] ) ? (string) $definition['description'] : '',
			'owner'       => isset( $definition['owner'] ) ? (string) $definition['owner'] : '',
		);
	}

	foreach ( $overrides as $name => $unused ) {
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

/**
 * Print the screen.
 *
 * @param bool $saved Whether a submission was just applied.
 * @return void
 */
function wpcom_feature_flags_print_admin_page( $saved = false ) {
	$rows      = wpcom_feature_flags_get_rows();
	$overrides = wpcom_feature_flags_get_overrides();
	$action    = admin_url( 'tools.php?page=' . WPCOM_FEATURE_FLAGS_PAGE_SLUG );

	?>
	<div class="wrap">
		<h1>Feature Flags</h1>

		<?php if ( $saved ) : ?>
			<div class="notice notice-success is-dismissible"><p>Overrides saved.</p></div>
		<?php endif; ?>

		<div class="notice notice-warning">
			<p>
				<strong>Overrides here are site-wide.</strong> They change what this site does for
				everyone — the site&#8217;s owner and logged-out visitors included — not just for you.
				Set a flag back to <em>Default</em> when you are done with it.
			</p>
		</div>

		<p>
			Flags are resolved as: the default they were registered with, then this screen, then any
			<code>jetpack_feature_flag_enabled_{flag}</code> filter. That per-flag filter runs last, so a
			sandbox patch or mu-plugin using it beats whatever you set here.
		</p>

		<form method="post" action="<?php echo esc_url( $action ); ?>">
			<?php wp_nonce_field( WPCOM_FEATURE_FLAGS_NONCE_ACTION ); ?>

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
								No feature flags are registered on this site, and nothing is overridden. Use
								the row below to force a flag by name.
							</td>
						</tr>
					<?php endif; ?>

					<?php foreach ( $rows as $name => $row ) : ?>
						<?php
						$state = 'default';
						if ( array_key_exists( $name, $overrides ) ) {
							$state = $overrides[ $name ] ? 'on' : 'off';
						}
						?>
						<tr>
							<td>
								<code><?php echo esc_html( $name ); ?></code>
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
								<?php
								foreach ( array(
									'default' => 'Default',
									'on'      => 'Force on',
									'off'     => 'Force off',
								) as $value => $label ) :
									?>
									<label style="margin-inline-end: 1em;">
										<input
											type="radio"
											name="flag_state[<?php echo esc_attr( $name ); ?>]"
											value="<?php echo esc_attr( $value ); ?>"
											<?php checked( $state, $value ); ?>
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
				A flag that is checked on this site but registered elsewhere will not be listed above.
				Unknown flags still pass through the resolution filter, so forcing one by name works.
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
