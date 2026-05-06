<?php
/**
 * Powered by Jetpack block render.
 *
 * Free-plan sites always render this attribution — the `hide` attribute is
 * intentionally ignored. On paid plans, the saved `hide` attribute gates
 * rendering so authors can keep the block in the editor while suppressing
 * it on the public page.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

$is_free_plan = ( new Plan() )->is_free_plan();
$hide         = ! empty( $attributes['hide'] );
if ( ! $is_free_plan && $hide ) {
	return;
}

$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'jetpack-search-powered-by' ) );

$locale_prefix = '';
if ( function_exists( 'determine_locale' ) ) {
	$parts         = explode( '-', determine_locale(), 2 );
	$locale_prefix = strtolower( (string) $parts[0] );
}
$url = ( '' !== $locale_prefix && 'en' !== $locale_prefix )
	? sprintf( 'https://%s.jetpack.com/upgrade/search?utm_source=poweredby', $locale_prefix )
	: 'https://jetpack.com/upgrade/search/?utm_source=poweredby';
?>
<div <?php echo wp_kses_data( $wrapper_attributes ); ?>>
	<a
		class="jetpack-search-powered-by__link"
		href="<?php echo esc_url( $url ); ?>"
		rel="external noopener noreferrer nofollow"
		target="_blank"
	>
		<span class="jetpack-search-powered-by__logo" aria-hidden="true">
			<svg width="12" height="12" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
				<path fill="#069E08" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z" />
				<polygon fill="#FFFFFF" points="15,19 7,19 15,3 " />
				<polygon fill="#FFFFFF" points="17,29 17,13 25,13 " />
			</svg>
		</span>
		<span class="jetpack-search-powered-by__text">
			<?php esc_html_e( 'Search powered by Jetpack', 'jetpack-search-pkg' ); ?>
		</span>
	</a>
</div>
