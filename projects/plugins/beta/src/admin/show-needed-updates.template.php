<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Jetpack Beta wp-admin template to show needed updates.
 *
 * @html-template \Automattic\JetpackBeta\Admin::render -- Via plugin-select.template.php or plugin-manage.template.php
 * @html-template-var \Automattic\JetpackBeta\Plugin $plugin Plugin being managed (from render()).
 * @package automattic/jetpack-beta
 */

use Automattic\JetpackBeta\Plugin;
use Automattic\JetpackBeta\Utils;

// Check that the file is not accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Wrap in a function to avoid leaking all the variables we create to subsequent runs.
( function ( $plugin ) {
	$updates = Utils::plugins_needing_update( true );
	if ( isset( $plugin ) ) {
		$updates = array_intersect_key(
			$updates,
			array(
				$plugin->plugin_file()     => 1,
				$plugin->dev_plugin_file() => 1,
				JPBETA__PLUGIN_FOLDER . '/jetpack-beta.php' => 1,
			)
		);
	}
	if ( ! $updates ) {
		return;
	}

	wp_enqueue_script( 'jetpack-beta-updates', plugins_url( 'updates.js', __FILE__ ), array( 'jquery', 'updates' ), JPBETA_VERSION, true );
	wp_localize_script(
		'jetpack-beta-updates',
		'JetpackBetaUpdates',
		array(
			'activate'   => __( 'Activate', 'jetpack-beta' ),
			'activating' => __( 'Activating...', 'jetpack-beta' ),
			'updating'   => __( 'Updating...', 'jetpack-beta' ),
			'leaving'    => __( 'Don\'t go Plugin is still installing!', 'jetpack-beta' ),
		)
	);
	// Junk needed by core's 'updates' JS.
	wp_print_admin_notice_templates();
	wp_localize_script(
		'updates',
		'_wpUpdatesItemCounts',
		array(
			'totals' => wp_get_update_data(),
		)
	);

	?>
	<div class="jetpack-beta__wrap jetpack-beta__update-needed">
		<h2><?php esc_html_e( 'Some updates are available', 'jetpack-beta' ); ?></h2>
		<?php
		foreach ( $updates as $file => $update ) {
			$slug  = dirname( $file );
			$isdev = false;
			if ( JPBETA__PLUGIN_FOLDER === $slug ) {
				// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$name = $update->Name;
			} else {
				if ( str_ends_with( $slug, '-dev' ) ) {
					$isdev = true;
					$slug  = substr( $slug, 0, -4 );
				}
				$plugin = Plugin::get_plugin( $slug );
				$name   = $plugin->get_name() . ' | ' . ( $isdev ? $plugin->dev_pretty_version() : $plugin->stable_pretty_version() );
			}

			$url = wp_nonce_url( self_admin_url( 'update.php?action=upgrade-plugin&plugin=' . rawurlencode( $file ) ), 'upgrade-plugin_' . $file );

			// translators: %s: Version number.
			$sub_header = sprintf( __( 'Version %s is available', 'jetpack-beta' ), $update->update->new_version );

			?>
		<div class="dops-foldable-card has-expanded-summary dops-card is-compact" data-slug="<?php echo esc_attr( $isdev ? "$slug-dev" : $slug ); ?>" data-plugin="<?php echo esc_attr( $file ); ?>">
			<div class="dops-foldable-card__header has-border" >
				<span class="dops-foldable-card__main">
					<div class="dops-foldable-card__header-text">
						<div class="dops-foldable-card__header-text branch-card-header"><?php echo esc_html( $name ); ?></div>
						<div class="dops-foldable-card__subheader"><?php echo esc_html( $sub_header ); ?></div>
					</div>
				</span>
				<span class="dops-foldable-card__secondary">
					<span class="dops-foldable-card__summary">
						<a href="<?php echo esc_url( $url ); ?>" class="is-primary jp-form-button update-branch dops-button is-compact"><?php esc_html_e( 'Update', 'jetpack-beta' ); ?></a>
					</span>
				</span>
			</div>
		</div>
		<?php } ?>
	</div>
	<?php
} )( $plugin ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- HTML template.
