<?php
/**
 * Template to display a branch card.
 *
 * @package automattic/jetpack-beta
 */

use Automattic\JetpackBeta\Utils;

// Check that the file is not accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// @global \Automattic\JetpackBeta\Plugin $plugin Plugin being managed.
if ( ! isset( $plugin ) ) {
	throw new InvalidArgumentException( 'Template parameter $plugin missing' );
}
// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
$plugin = $plugin; // Dummy assignment to fool VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable.

// @global object $branch Branch data.
if ( ! isset( $branch ) ) {
	throw new InvalidArgumentException( 'Template parameter $branch missing' );
}
$branch = $branch; // Dummy assignment to fool VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable.

// @global object $active_branch Active branch data.
if ( ! isset( $active_branch ) ) {
	throw new InvalidArgumentException( 'Template parameter $active_branch missing' );
}
$active_branch = $active_branch; // Dummy assignment to fool VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable.

// -------------

$data_attr = '';
$more_info = array();
if ( isset( $branch->pr ) && is_int( $branch->pr ) ) {
	$data_attr = sprintf( 'data-pr="%s"', esc_attr( $branch->pr ) );
	// translators: Translates the `More info` link. %1$s: URL. %2$s: PR number.
	$more_info[] = sprintf( __( '<a target="_blank" rel="external noopener noreferrer" href="%1$s">more info #%2$s</a>', 'jetpack-beta' ), $branch->plugin_url, $branch->pr );
} elseif ( 'release' === $branch->source ) {
	$data_attr   = sprintf( 'data-release="%s"', esc_attr( $branch->version ) );
	$more_info[] = sprintf(
		// translators: Which release is being selected.
		__( 'Public release (%1$s) <a href="https://plugins.trac.wordpress.org/browser/jetpack/tags/%2$s" target="_blank" rel="">available on WordPress.org</a>', 'jetpack-beta' ),
		esc_html( $branch->version ),
		esc_attr( $branch->version )
	);
} elseif ( 'rc' === $branch->source || 'master' === $branch->source || 'unknown' === $branch->source ) {
	$more_info[] = sprintf(
		// translators: %s: Version number.
		__( 'Version %s', 'jetpack-beta' ),
		$branch->version
	);
}

if ( isset( $branch->update_date ) ) {
	// translators: %s is how long ago the branch was updated.
	$more_info[] = sprintf( __( 'last updated %s ago', 'jetpack-beta' ), human_time_diff( strtotime( $branch->update_date ) ) );
}

$classes = array( 'dops-foldable-card', 'has-expanded-summary', 'dops-card' );
if ( $active_branch->source === $branch->source && $active_branch->id === $branch->id ) {
	$action_link = __( 'Active', 'jetpack-beta' );
	$classes[]   = 'branch-card-active';
} else {
	$url         = wp_nonce_url(
		Utils::admin_url(
			array(
				'activate-branch' => "{$branch->source}:{$branch->id}",
				'plugin'          => $plugin->plugin_slug(),
			)
		),
		'activate_branch'
	);
	$action_link = sprintf(
		'<a href="%1$s" class="is-primary jp-form-button activate-branch dops-button is-compact jptracks" data-jptracks-name="%2$s" data-jptracks-prop="%3$s">%4$s</a>',
		esc_url( $url ),
		'jetpack_beta_activate_branch',
		esc_attr( "{$branch->source}:{$branch->id}" ),
		esc_html__( 'Activate', 'jetpack-beta' )
	);
	$classes[]   = 'branch-card';
}
if ( empty( $branch->is_last ) ) {
	$classes[] = 'is-compact';
}

?>
		<div <?php echo $data_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> class="<?php echo esc_attr( join( ' ', $classes ) ); ?>">
			<div class="dops-foldable-card__header has-border" >
				<span class="dops-foldable-card__main">
					<div class="dops-foldable-card__header-text">
						<div class="dops-foldable-card__header-text branch-card-header"><?php echo esc_html( $branch->pretty_version ); ?></div>
						<div class="dops-foldable-card__subheader">
						<?php echo wp_kses_post( join( ' - ', $more_info ) ); ?>
						</div>
					</div>
				</span>
				<span class="dops-foldable-card__secondary">
					<span class="dops-foldable-card__summary">
						<?php echo wp_kses_post( $action_link ); ?>
					</span>
				</span>
			</div>
		</div>
