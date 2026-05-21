<?php
/**
 * Filter-static block render.
 *
 * Renders one or more single-select radio groups whose options come from the
 * site-configured static-filter list. WordPress passes $attributes and $block
 * at runtime; the VariableAnalysis suppressions mirror filter-checkbox.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// Phan flags `(array) $attributes` as an undeclared global even under a
// namespace; subscripted access (`$attributes['key']`) isn't flagged.
// WordPress always passes an array for the block's $attributes argument.
// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$attrs     = (array) $attributes;
$variation = Filter_Static::normalize_variation( $attrs['variation'] ?? 'sidebar' );
$filter_id = sanitize_key( (string) ( $attrs['filterId'] ?? '' ) );
$entries   = Filter_Static::filters_for_variation( $variation, $filter_id );

// Short-circuit when nothing is configured for this variation, when the block
// targets a specific filter that isn't registered, or when wp_interactivity_*
// helpers aren't available (introduced in WP 6.5).
if ( empty( $entries ) || ! function_exists( 'wp_interactivity_state' ) || ! function_exists( 'wp_interactivity_data_wp_context' ) ) {
	return;
}

$url_selections = Filter_Static::parse_url_selections();

// URL selection wins over the server's `selected` default. The default seeds
// the radio for first-paint UX; the JS store's later `actions.search()` →
// `syncToUrl()` pipeline is what propagates it back to the address bar.
$configs_payload    = array();
$selections_payload = array();
foreach ( $entries as $entry ) {
	$key                        = $entry['filter_id'];
	$configs_payload[ $key ]    = Filter_Static::build_config( $entry, $attrs );
	$selections_payload[ $key ] = $url_selections[ $key ] ?? (string) $entry['selected'];
}

wp_interactivity_state(
	'jetpack-search',
	array(
		'filterConfigs'          => $configs_payload,
		'staticFilterSelections' => $selections_payload,
	)
);
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'data-variation' => $variation ) ) ); ?>
	data-wp-interactive="jetpack-search"
>
	<?php foreach ( $entries as $entry ) : ?>
		<?php
		$key      = $entry['filter_id'];
		$label    = $configs_payload[ $key ]['label'];
		$selected = $selections_payload[ $key ];
		?>
		<fieldset
			class="jetpack-search-filter__group"
			<?php
			echo wp_kses_data(
				wp_interactivity_data_wp_context(
					array(
						'filterKey' => $key,
						'kind'      => 'static',
					)
				)
			);
			?>
		>
			<?php if ( '' !== $label ) : ?>
				<legend class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></legend>
			<?php endif; ?>
			<ul class="jetpack-search-filter__list">
				<?php foreach ( $entry['values'] as $option ) : ?>
					<li class="jetpack-search-filter__item">
						<label>
							<input
								type="radio"
								name="<?php echo esc_attr( $key ); ?>"
								value="<?php echo esc_attr( $option['value'] ); ?>"
								data-wp-on--change="actions.onStaticFilterChange"
								<?php checked( $option['value'], $selected ); ?>
							/>
							<span class="jetpack-search-filter__label"><?php echo esc_html( $option['name'] ); ?></span>
						</label>
					</li>
				<?php endforeach; ?>
			</ul>
		</fieldset>
	<?php endforeach; ?>
</div>
