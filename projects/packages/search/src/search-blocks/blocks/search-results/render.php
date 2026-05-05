<?php
/**
 * Search Results block render.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

/**
 * Per-layout feature flags. Mirrors layout-features.js so editor preview and
 * frontend agree on which sections each layout opts into.
 *
 * @param string $layout Layout key.
 * @return array{modifier:string, show_image:bool, show_path:bool, show_date:bool, show_price:bool, show_rating:bool}
 */
$resolve_layout = static function ( $layout ) {
	$map = array(
		'card'    => array(
			'modifier'    => 'card',
			'show_image'  => true,
			'show_path'   => true,
			'show_date'   => true,
			'show_price'  => false,
			'show_rating' => false,
		),
		'compact' => array(
			'modifier'    => 'compact',
			'show_image'  => false,
			'show_path'   => false,
			'show_date'   => true,
			'show_price'  => false,
			'show_rating' => false,
		),
		'product' => array(
			'modifier'    => 'product',
			'show_image'  => true,
			'show_path'   => false,
			'show_date'   => false,
			'show_price'  => true,
			'show_rating' => true,
		),
	);
	return $map[ $layout ] ?? $map['card'];
};

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$layout        = ( (array) $attributes )['layout'] ?? 'card';
$features      = $resolve_layout( $layout );
$wrapper_class = 'jetpack-search-results--' . $features['modifier'];
$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $wrapper_class ) );

// Pre-hydration loading state. Skeleton items below render server-side only
// when the URL carries a query/filter that will trigger an initial fetch on
// hydration; otherwise emitting them would freeze placeholder rows on a bare
// /search/ page where no fetch ever fires. Once JS hydrates,
// `data-wp-bind--hidden="state.skeletonHidden"` takes over visibility.
$is_initial_loading = Search_Blocks::is_initial_loading();
$skeleton_count     = $is_compact ? 6 : 4;
?>
<div
	<?php echo wp_kses_data( $wrapper_attrs ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-init="callbacks.initialize"
	data-wp-bind--aria-busy="state.isLoading"
>
	<ul
		class="jetpack-search-results__list"
		aria-live="polite"
	>
		<?php if ( $is_initial_loading ) : ?>
			<?php for ( $i = 0; $i < $skeleton_count; $i++ ) : ?>
				<li
					class="jetpack-search-results__item jetpack-search-results__item--skeleton"
					data-wp-bind--hidden="state.skeletonHidden"
					aria-hidden="true"
				>
					<div class="jetpack-search-results__copy">
						<div class="jetpack-search-skeleton jetpack-search-skeleton--title"></div>
						<?php if ( ! $is_compact ) : ?>
							<div class="jetpack-search-skeleton jetpack-search-skeleton--path"></div>
							<div class="jetpack-search-skeleton jetpack-search-skeleton--meta"></div>
						<?php endif; ?>
					</div>
					<?php if ( ! $is_compact ) : ?>
						<div class="jetpack-search-skeleton jetpack-search-skeleton--image"></div>
					<?php endif; ?>
				</li>
			<?php endfor; ?>
		<?php endif; ?>
		<template
			data-wp-each--result="state.results"
			data-wp-key="context.result.id"
		>
			<li class="jetpack-search-results__item">
				<?php if ( $features['show_image'] && 'product' === $layout ) : ?>
					<a
						class="jetpack-search-results__product-image-link"
						data-wp-bind--href="context.result.permalink"
						tabindex="-1"
						aria-hidden="true"
					>
						<span
							class="jetpack-search-results__product-image"
							data-wp-bind--hidden="!context.result.imageUrl"
							data-wp-style--background-image="context.result.imageBackgroundImage"
						></span>
						<span
							class="jetpack-search-results__product-image-placeholder"
							data-wp-bind--hidden="context.result.imageUrl"
						></span>
					</a>
				<?php endif; ?>
				<div class="jetpack-search-results__copy">
					<h3 class="jetpack-search-results__title">
						<a
							class="jetpack-search-results__title-link"
							data-wp-bind--href="context.result.permalink"
						>
							<span
								data-wp-bind--hidden="context.result.hasTitlePieces"
								data-wp-text="context.result.title"
							></span>
							<template
								data-wp-each--piece="context.result.titlePieces"
								data-wp-key="context.piece.index"
							>
								<span
									data-wp-text="context.piece.text"
									data-wp-class--jetpack-search-results__highlight="context.piece.isHighlight"
								></span>
							</template>
						</a>
					</h3>
					<?php if ( $features['show_path'] ) : ?>
						<div
							class="jetpack-search-results__path"
							data-wp-bind--hidden="!context.result.path"
							data-wp-text="context.result.path"
						></div>
					<?php endif; ?>
					<?php if ( $features['show_price'] ) : ?>
						<div
							class="jetpack-search-results__price"
							data-wp-bind--hidden="!context.result.hasPrice"
						>
							<del
								class="jetpack-search-results__price-regular"
								data-wp-bind--hidden="!context.result.hasSalePrice"
								data-wp-text="context.result.formattedRegularPrice"
							></del>
							<ins
								class="jetpack-search-results__price-sale"
								data-wp-bind--hidden="!context.result.hasSalePrice"
								data-wp-text="context.result.formattedSalePrice"
							></ins>
							<span
								class="jetpack-search-results__price-current"
								data-wp-bind--hidden="context.result.hasSalePrice"
								data-wp-text="context.result.formattedPrice"
							></span>
						</div>
					<?php endif; ?>
					<?php if ( $features['show_rating'] ) : ?>
						<div
							class="jetpack-search-results__rating"
							data-wp-bind--hidden="!context.result.hasRating"
							data-wp-bind--aria-label="context.result.ratingAriaLabel"
						>
							<span class="jetpack-search-results__rating-stars" aria-hidden="true">
								<span
									class="jetpack-search-results__rating-fill"
									data-wp-style--width="context.result.ratingPercent"
								></span>
							</span>
							<span
								class="jetpack-search-results__rating-count"
								data-wp-text="context.result.reviewCountLabel"
							></span>
						</div>
					<?php endif; ?>
					<?php if ( $features['show_date'] ) : ?>
						<div class="jetpack-search-results__meta">
							<span
								class="jetpack-search-results__date"
								data-wp-bind--hidden="!context.result.dateLabel"
								data-wp-text="context.result.dateLabel"
							></span>
						</div>
					<?php endif; ?>
				</div>
				<?php if ( $features['show_image'] && 'product' !== $layout ) : ?>
					<a
						class="jetpack-search-results__image-link"
						data-wp-bind--href="context.result.permalink"
						tabindex="-1"
						aria-hidden="true"
					>
						<img
							class="jetpack-search-results__image"
							data-wp-bind--src="context.result.imageUrl"
							data-wp-bind--hidden="!context.result.imageUrl"
							alt=""
						/>
						<span
							class="jetpack-search-results__image-placeholder"
							data-wp-bind--hidden="context.result.imageUrl"
							aria-hidden="true"
						></span>
					</a>
				<?php endif; ?>
			</li>
		</template>
	</ul>
</div>
