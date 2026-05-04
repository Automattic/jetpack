<?php
/**
 * Filter-blog block render.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

if ( ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$config     = Filter_Blog::build_config( (array) $attributes );
$filter_key = $config['filterKey'];
$options    = $config['options'];

if ( empty( $options ) ) {
	return;
}

wp_interactivity_state(
	'jetpack-search',
	array(
		'filterConfigs' => array(
			$filter_key => $config,
		),
	)
);

$seeded_state    = wp_interactivity_state( 'jetpack-search' );
$seeded_selected = (array) ( ( (array) ( $seeded_state['activeFilters'] ?? array() ) )[ $filter_key ] ?? array() );
$selected_value  = $seeded_selected[0] ?? '';

$radio_name = 'jetpack-search-filter-blog-' . sanitize_html_class( $filter_key );
$label      = $config['label'];
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	<?php echo wp_kses_data( wp_interactivity_data_wp_context( array( 'filterKey' => $filter_key ) ) ); ?>
>
	<?php if ( '' !== $label ) : ?>
		<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<?php endif; ?>
	<ul class="jetpack-search-filter__list" role="radiogroup" aria-label="<?php echo esc_attr( $label ); ?>">
		<?php foreach ( $options as $option ) : ?>
			<li
				class="jetpack-search-filter__item"
				<?php echo wp_kses_data( wp_interactivity_data_wp_context( array( 'optionValue' => $option['value'] ) ) ); ?>
			>
				<label>
					<input
						type="radio"
						name="<?php echo esc_attr( $radio_name ); ?>"
						value="<?php echo esc_attr( $option['value'] ); ?>"
						<?php checked( $selected_value, $option['value'] ); ?>
						data-wp-bind--checked="state.isBlogOptionChecked"
						data-wp-on--change="actions.onBlogFilterChange"
					/>
					<span class="jetpack-search-filter__label"><?php echo esc_html( $option['label'] ); ?></span>
				</label>
			</li>
		<?php endforeach; ?>
	</ul>
</div>
