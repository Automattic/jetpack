<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Jetpack Beta wp-admin page header.
 *
 * Mirrors the @automattic/jetpack-components AdminPage header (Jetpack logo +
 * title/subtitle, or logo + breadcrumb on the manage screen) without pulling in
 * the React component library.
 *
 * @html-template \Automattic\JetpackBeta\Admin::render -- Via plugin-select.template.php or plugin-manage.template.php
 * @html-template-var \Automattic\JetpackBeta\Plugin|null $plugin Plugin being managed, when on the manage screen.
 * @package automattic/jetpack-beta
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- $plugin is provided by the including template (plugin-select/plugin-manage).

use Automattic\JetpackBeta\Plugin;
use Automattic\JetpackBeta\Utils;

// Check that the file is not accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// On the manage screen a Plugin is in scope; on the overview it's null.
$jpbeta_has_plugin = $plugin instanceof Plugin;

?>
<div class="jetpack-beta-header">
	<div class="jetpack-beta-header__inner">
		<span class="jetpack-beta-header__logo" aria-hidden="true">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" role="img" aria-labelledby="jetpack-beta-header-logo-title">
				<title id="jetpack-beta-header-logo-title"><?php esc_html_e( 'Jetpack Logo', 'jetpack-beta' ); ?></title>
				<path fill="#069e08" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z" />
			</svg>
		</span>
		<?php if ( $jpbeta_has_plugin ) { ?>
			<nav class="jetpack-beta-header__breadcrumb" aria-label="<?php esc_attr_e( 'Breadcrumb', 'jetpack-beta' ); ?>">
				<ul>
					<li><a href="<?php echo esc_url( Utils::admin_url() ); ?>"><?php esc_html_e( 'Beta Tester', 'jetpack-beta' ); ?></a></li>
					<li><span class="jetpack-beta-header__breadcrumb-current"><?php echo esc_html( $plugin->get_name() ); ?></span></li>
				</ul>
			</nav>
		<?php } else { ?>
			<h1 class="jetpack-beta-header__title"><?php esc_html_e( 'Beta Tester', 'jetpack-beta' ); ?></h1>
		<?php } ?>
	</div>
	<?php if ( ! $jpbeta_has_plugin ) { ?>
		<p class="jetpack-beta-header__subtitle"><?php esc_html_e( 'Test beta features and pull requests for Jetpack plugins.', 'jetpack-beta' ); ?></p>
	<?php } ?>
</div>
