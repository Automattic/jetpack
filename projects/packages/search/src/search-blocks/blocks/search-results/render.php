<?php
/**
 * Search Results block render.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$layout        = ( (array) $attributes )['layout'] ?? 'card';
$is_compact    = 'compact' === $layout;
$wrapper_class = $is_compact ? 'jetpack-search-results--compact' : 'jetpack-search-results--card';
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
					<?php if ( ! $is_compact ) : ?>
						<div
							class="jetpack-search-results__path"
							data-wp-bind--hidden="!context.result.path"
							data-wp-text="context.result.path"
						></div>
					<?php endif; ?>
					<div class="jetpack-search-results__meta">
						<span
							class="jetpack-search-results__date"
							data-wp-bind--hidden="!context.result.dateLabel"
							data-wp-text="context.result.dateLabel"
						></span>
					</div>
				</div>
				<?php if ( ! $is_compact ) : ?>
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
</div>
