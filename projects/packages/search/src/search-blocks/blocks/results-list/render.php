<?php
/**
 * Results List block render.
 *
 * Renders three sibling regions inside a single block wrapper:
 *  - the results list (skeleton while loading, then live results),
 *  - the empty-state message (gated by `state.showNoResults`),
 *  - the error message (gated by `state.showError`).
 *
 * The store's existing visibility flags ensure exactly one message is
 * visible at a time, so the regions can coexist without extra wiring.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

/**
 * Per-layout feature flags driving the SSR template below. Edit.js renders
 * each layout as its own explicit JSX template (no shared feature-flag
 * map) — the JS preview prioritizes readability over DRY since each
 * sample list is short. PHP keeps the flag-table form because the
 * Interactivity-bound DOM is identical across layouts and only the
 * `<?php if ?>` gates around image / path / price / rating / date
 * sections differ.
 *
 * @param string $layout Layout key.
 * @return array{modifier:string, show_author:bool, show_content:bool, show_date:bool, show_image:bool, show_path:bool, show_price:bool, show_rating:bool}
 */
$resolve_layout = static function ( $layout ) {
	$map = array(
		'compact'  => array(
			'modifier'     => 'compact',
			'show_image'   => false,
			'show_path'    => false,
			'show_content' => false,
			'show_author'  => false,
			'show_date'    => true,
			'show_price'   => false,
			'show_rating'  => false,
		),
		'expanded' => array(
			'modifier'     => 'expanded',
			'show_image'   => true,
			'show_path'    => true,
			'show_content' => true,
			'show_author'  => true,
			'show_date'    => true,
			'show_price'   => false,
			'show_rating'  => false,
		),
		'product'  => array(
			'modifier'     => 'product',
			'show_image'   => true,
			'show_path'    => false,
			'show_content' => false,
			'show_author'  => false,
			'show_date'    => false,
			'show_price'   => true,
			'show_rating'  => true,
		),
	);
	return $map[ $layout ] ?? $map['expanded'];
};

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$attrs  = (array) $attributes;
$layout = $attrs['layout'] ?? 'expanded';
// Pre-rename block markup used `card` for what is now `expanded`. Promote
// the legacy value so saved content keeps rendering correctly instead of
// falling through `$resolve_layout`'s unknown-layout fallback. Mirrors the
// JS-side normalization in edit.js.
if ( 'card' === $layout ) {
	$layout = 'expanded';
}
// The product layout reads WC-shaped fields (price, sale price, rating)
// off each result. On a non-Woo site those fields don't exist, so
// rendering would emit empty price/rating regions. Collapse to the
// neutral `expanded` layout so an author who saved `product` on a Woo
// site that later deactivates WC still sees a sensible result page.
// Mirrors the inspector-side gate in edit.js.
if ( 'product' === $layout && ! Search_Blocks::woocommerce_blocks_enabled() ) {
	$layout = 'expanded';
}
$features      = $resolve_layout( $layout );
$wrapper_class = 'jetpack-search-results--' . $features['modifier'];
$wrapper_attrs = get_block_wrapper_attributes( array( 'class' => $wrapper_class ) );

// Hand the resolved layout to the store so the TrainTracks `ui_algo` matches
// what visitors actually see. Deep-merges onto the global seed.
if ( function_exists( 'wp_interactivity_state' ) ) {
	wp_interactivity_state( 'jetpack-search', array( 'resultsLayout' => $layout ) );
}

// Skeleton items always render so the IA runtime can re-show them on a
// client-side search from a bare /search/ page. The literal `hidden` keeps
// them out of the pre-hydration paint unless the URL already carries a
// query/filter that fires an initial fetch on hydration; afterwards
// `data-wp-bind--hidden="state.skeletonHidden"` drives visibility reactively.
$is_initial_loading = Search_Blocks::is_initial_loading();
$skeleton_count     = 'compact' === $layout ? 6 : 4;

// `trim()` so a whitespace-only attribute (e.g. an author who saved spaces)
// still falls back to the default copy instead of rendering a blank message.
$no_results_message = trim( (string) ( $attrs['noResultsMessage'] ?? '' ) );
if ( '' === $no_results_message ) {
	$no_results_message = __( 'No results found. Try a different search.', 'jetpack-search-pkg' );
}

// Filter-aware variant — shown when `state.hasActiveFilters` is true. Both
// variants live in the markup so the store's existing reactive getter picks
// which `<p>` is visible without a store-side message-resolution branch.
$no_results_with_filters_message = trim( (string) ( $attrs['noResultsWithFiltersMessage'] ?? '' ) );
if ( '' === $no_results_with_filters_message ) {
	$no_results_with_filters_message = __( 'No results match these filters. Try clearing some, or searching for something else.', 'jetpack-search-pkg' );
}

$error_message = trim( (string) ( $attrs['errorMessage'] ?? '' ) );
if ( '' === $error_message ) {
	$error_message = __( 'Something went wrong. Please try again.', 'jetpack-search-pkg' );
}
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
		<?php for ( $i = 0; $i < $skeleton_count; $i++ ) : ?>
			<li
				class="jetpack-search-results__item jetpack-search-results__item--skeleton"
				data-wp-bind--hidden="state.skeletonHidden"
				aria-hidden="true"
				<?php echo $is_initial_loading ? '' : 'hidden'; ?>
			>
				<?php if ( 'product' === $layout ) : ?>
					<div class="jetpack-search-skeleton jetpack-search-skeleton--product-image"></div>
					<div class="jetpack-search-results__copy">
						<div class="jetpack-search-skeleton jetpack-search-skeleton--title"></div>
						<div class="jetpack-search-skeleton jetpack-search-skeleton--title-secondary"></div>
					</div>
				<?php elseif ( 'compact' === $layout ) : ?>
					<div class="jetpack-search-results__copy">
						<div class="jetpack-search-skeleton jetpack-search-skeleton--title"></div>
					</div>
				<?php else : ?>
					<div class="jetpack-search-results__copy">
						<div class="jetpack-search-skeleton jetpack-search-skeleton--title"></div>
						<div class="jetpack-search-skeleton jetpack-search-skeleton--path"></div>
						<div class="jetpack-search-skeleton jetpack-search-skeleton--meta"></div>
					</div>
					<div class="jetpack-search-skeleton jetpack-search-skeleton--image"></div>
				<?php endif; ?>
			</li>
		<?php endfor; ?>
		<template
			data-wp-each--result="state.results"
			data-wp-each-key="context.result.id"
		>
			<li
				class="jetpack-search-results__item"
				data-wp-on--click="actions.recordResultInteract"
			>
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
								data-wp-each-key="context.piece.index"
							>
								<span
									data-wp-text="context.piece.text"
									data-wp-class--jetpack-search-results__highlight="context.piece.isHighlight"
								></span>
							</template>
						</a>
					</h3>
					<?php if ( $features['show_content'] ) : ?>
						<div
							class="jetpack-search-results__content"
							data-wp-bind--hidden="!context.result.hasContentPieces"
						>
							<template
								data-wp-each--piece="context.result.contentPieces"
								data-wp-each-key="context.piece.index"
							>
								<span
									data-wp-text="context.piece.text"
									data-wp-class--jetpack-search-results__highlight="context.piece.isHighlight"
								></span>
							</template>
						</div>
					<?php endif; ?>
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
							role="img"
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
								aria-hidden="true"
								data-wp-text="context.result.reviewCountLabel"
							></span>
						</div>
					<?php endif; ?>
					<?php if ( 'product' === $layout ) : ?>
						<div
							class="jetpack-search-results__match-hint"
							data-wp-bind--hidden="!context.result.matchHint"
						>
							<mark>
								<span data-wp-bind--hidden="!context.result.matchHintIsComments">
									<?php esc_html_e( 'Matches comments', 'jetpack-search-pkg' ); ?>
								</span>
								<span data-wp-bind--hidden="context.result.matchHintIsComments">
									<?php esc_html_e( 'Matches content', 'jetpack-search-pkg' ); ?>
								</span>
							</mark>
						</div>
					<?php endif; ?>
					<?php if ( $features['show_author'] || $features['show_date'] ) : ?>
						<div class="jetpack-search-results__meta">
							<?php if ( $features['show_author'] ) : ?>
								<span
									class="jetpack-search-results__author"
									data-wp-bind--hidden="!context.result.authorLabel"
									data-wp-text="context.result.authorLabel"
								></span>
							<?php endif; ?>
							<?php if ( $features['show_author'] && $features['show_date'] ) : ?>
								<span
									class="jetpack-search-results__meta-separator"
									aria-hidden="true"
									data-wp-bind--hidden="!context.result.authorLabel || !context.result.dateLabel"
								>&middot;</span>
							<?php endif; ?>
							<?php if ( $features['show_date'] ) : ?>
								<span
									class="jetpack-search-results__date"
									data-wp-bind--hidden="!context.result.dateLabel"
									data-wp-text="context.result.dateLabel"
								></span>
							<?php endif; ?>
						</div>
					<?php endif; ?>
				</div>
				<?php if ( $features['show_image'] && 'product' !== $layout ) : ?>
					<a
						class="jetpack-search-results__image-link"
						data-wp-bind--href="context.result.permalink"
						data-wp-bind--hidden="!context.result.imageUrl"
						tabindex="-1"
						aria-hidden="true"
					>
						<img
							class="jetpack-search-results__image"
							data-wp-bind--src="context.result.imageUrl"
							alt=""
						/>
					</a>
				<?php endif; ?>
			</li>
		</template>
	</ul>
	<div
		class="jetpack-search-results__no-results"
		data-wp-bind--hidden="!state.showNoResults"
		role="status"
		hidden
	>
		<?php
		// Both `<p>` variants render without an initial `hidden` attribute —
		// the outer wrapper's `hidden` covers them on the SSR path, and the IA
		// runtime resolves the inner `data-wp-bind--hidden` atomically when it
		// reveals the region. Don't remove the outer `hidden` without also
		// adding initial `hidden` to one of the variants, or both messages
		// will flash briefly on hydration.
		?>
		<p data-wp-bind--hidden="state.hasActiveFilters"><?php echo esc_html( $no_results_message ); ?></p>
		<p data-wp-bind--hidden="!state.hasActiveFilters"><?php echo esc_html( $no_results_with_filters_message ); ?></p>
	</div>
	<div
		class="jetpack-search-results__error"
		data-wp-bind--hidden="!state.showError"
		role="alert"
		hidden
	>
		<p><?php echo esc_html( $error_message ); ?></p>
	</div>
</div>
