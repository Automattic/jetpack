<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Jetpack Beta wp-admin page to select a plugin to manage.
 *
 * @html-template \Automattic\JetpackBeta\Admin::render
 * @package automattic/jetpack-beta
 */

// phpcs:disable WordPress.WP.GlobalVariablesOverride.Prohibited -- This is an HTML template, not actually global.

use Automattic\JetpackBeta\Plugin;
use Automattic\JetpackBeta\Utils;

// Check that the file is not accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

$plugins = Plugin::get_all_plugins( true );

// This needs to be defined for header.template.php and show-needed-updates.template.php.
$plugin = null;

?>
<div class="jetpack-beta-app">
<?php require __DIR__ . '/header.template.php'; ?>
<div class="jetpack-beta-scroll">
<div class="jetpack-beta-container" >
	<?php
	if ( ! Utils::has_been_used() ) {
		require __DIR__ . '/notice.template.php';
	}
	?>
	<?php require __DIR__ . '/toggles.template.php'; ?>
	<?php require __DIR__ . '/show-needed-updates.template.php'; ?>

	<div class="jetpack-beta-card jetpack-beta-list jetpack-beta__wrap">
	<?php
	foreach ( $plugins as $slug => $plugin ) {
		$row_classes = array( 'jetpack-beta-list-row' );
		if ( $plugin->is_active( 'stable' ) ) {
			$row_classes[] = 'plugin-stable';
			$verslug       = $plugin->plugin_slug();
			$version       = $plugin->stable_pretty_version() ?? '';
			$badge         = array( __( 'Stable', 'jetpack-beta' ), 'jetpack-beta-badge' );
		} elseif ( $plugin->is_active( 'dev' ) ) {
			$row_classes[] = 'plugin-dev';
			$verslug       = $plugin->dev_plugin_slug();
			$version       = $plugin->dev_pretty_version() ?? '';
			$badge         = array( __( 'Dev', 'jetpack-beta' ), 'jetpack-beta-badge jetpack-beta-badge--dev' );
		} else {
			$row_classes[] = 'plugin-inactive';
			$verslug       = '';
			$version       = __( 'Plugin is not active', 'jetpack-beta' );
			$badge         = null;
		}

		$url = Utils::admin_url(
			array(
				'plugin' => $slug,
			)
		);

		?>
		<a
			href="<?php echo esc_url( $url ); ?>"
			data-plugin="<?php echo esc_attr( $slug ); ?>"
			class="<?php echo esc_attr( implode( ' ', $row_classes ) ); ?> manage-plugin"
		>
			<?php if ( ! $plugin->is_unpublished() ) { ?>
			<span class="jetpack-beta-list-row__icon" aria-hidden="true">
				<img
					class="jetpack-beta-list-row__icon-img"
					src="https://ps.w.org/<?php echo esc_attr( rawurlencode( $slug ) ); ?>/assets/icon-128x128.png"
					alt=""
					loading="lazy"
					onerror="this.closest('.jetpack-beta-list-row__icon').classList.add('is-fallback');this.remove();"
				/>
			</span>
			<?php } else { ?>
			<span class="jetpack-beta-list-row__icon is-fallback" aria-hidden="true"></span>
			<?php } ?>
			<span class="jetpack-beta-list-row__main">
				<span class="jetpack-beta-list-row__title">
					<span class="branch-card-header"><?php echo esc_html( $plugin->get_name() ); ?></span>
					<?php if ( $badge ) { ?>
						<span class="<?php echo esc_attr( $badge[1] ); ?>"><?php echo esc_html( $badge[0] ); ?></span>
					<?php } ?>
				</span>
				<span class="jetpack-beta-list-row__subtitle" data-jpbeta-version-for="<?php echo esc_attr( $verslug ); ?>"><?php echo esc_html( $version ); ?></span>
			</span>
			<span class="jetpack-beta-list-row__secondary">
				<span class="jetpack-beta-list-row__chevron" aria-hidden="true">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" focusable="false"><path fill="currentColor" d="M10.6 6L9.5 7l4.9 5-4.9 5 1.1 1 5.9-6z" /></svg>
				</span>
			</span>
		</a>
	<?php } ?>
	</div>
</div>
</div>
<?php require __DIR__ . '/footer.template.php'; ?>
</div>
