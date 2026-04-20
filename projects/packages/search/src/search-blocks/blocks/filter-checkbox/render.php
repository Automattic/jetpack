<?php
/**
 * Filter-checkbox block render.
 *
 * WordPress passes $attributes, $content, $block at runtime; VariableAnalysis
 * can't see that, so the sniff is disabled here.
 *
 * @package automattic/jetpack-search
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

use Automattic\Jetpack\Search\Filter_Checkbox;

$filter_key   = Filter_Checkbox::derive_filter_key( (array) $attributes );
$es_field     = Filter_Checkbox::derive_es_field( (array) $attributes, $filter_key );
$display_mode = $attributes['displayMode'] ?? 'dynamic';
$show_count   = (bool) ( $attributes['showCount'] ?? true );
$max_items    = max( 1, (int) ( $attributes['maxItems'] ?? 10 ) );
$label        = (string) ( $attributes['label'] ?? '' );

// Default labels for built-in variations when no custom label is set.
if ( '' === $label ) {
	$default_labels = array(
		'category'  => __( 'Category', 'jetpack-search-pkg' ),
		'post_tag'  => __( 'Tag', 'jetpack-search-pkg' ),
		'post_type' => __( 'Post Type', 'jetpack-search-pkg' ),
		'author'    => __( 'Author', 'jetpack-search-pkg' ),
	);
	$label          = $default_labels[ $filter_key ] ?? ucfirst( str_replace( '_', ' ', $filter_key ) );
}

// Register this filter's config into the shared store state. JS reads
// filterConfigs to build aggregation requests and ES filter clauses.
// wp_interactivity_state() deep-merges, so each block adds its own key without
// clobbering others.
$curated_values = 'curated' === $display_mode
	? array_values( array_filter( array_map( 'strval', array_column( (array) ( $attributes['curatedValues'] ?? array() ), 'value' ) ) ) )
	: array();

if ( '' !== $filter_key && '' !== $es_field ) {
	wp_interactivity_state(
		'jetpack-search',
		array(
			'filterConfigs' => array(
				$filter_key => array(
					'filterKey'     => $filter_key,
					'esField'       => $es_field,
					'aggType'       => 'curated' === $display_mode ? 'filters' : 'terms',
					'curatedValues' => $curated_values,
					'showCount'     => $show_count,
					'maxItems'      => $max_items,
				),
			),
		)
	);
}

// Server-render initial item list.
$items = Filter_Checkbox::get_initial_items( (array) $attributes );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	<?php echo wp_kses_data( wp_interactivity_data_wp_context( array( 'filterKey' => $filter_key ) ) ); ?>
>
	<?php if ( '' !== $label ) : ?>
		<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<?php endif; ?>
	<ul class="jetpack-search-filter__list">
		<?php foreach ( $items as $item ) : ?>
			<li
				class="jetpack-search-filter__item"
				<?php
				echo wp_kses_data(
					wp_interactivity_data_wp_context(
						array(
							'filterKey' => $filter_key,
							'itemValue' => $item['value'],
						)
					)
				);
				?>
			>
				<label>
					<input
						type="checkbox"
						value="<?php echo esc_attr( $item['value'] ); ?>"
						data-wp-on--change="actions.onFilterChange"
						data-wp-bind--checked="state.isChecked"
					/>
					<span class="jetpack-search-filter__label"><?php echo esc_html( $item['label'] ); ?></span>
					<?php if ( $show_count ) : ?>
						<span
							class="jetpack-search-filter__count"
							data-wp-bind--hidden="!state.count"
							data-wp-text="state.count"
						></span>
					<?php endif; ?>
				</label>
			</li>
		<?php endforeach; ?>
	</ul>
</div>
