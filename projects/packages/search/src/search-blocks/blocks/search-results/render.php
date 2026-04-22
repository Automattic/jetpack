<?php
/**
 * Search Results block render.
 *
 * Pure template — no PHP pre-fetch. Search_Blocks::seed_interactivity_state()
 * already seeds empty `results` / `aggregations` / `totalResults` plus an
 * `isLoading` flag that's true whenever the URL carries a search query or
 * filter selection, so the JS store fetches on hydration without flashing
 * the no-results block first.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-init="callbacks.initialize"
	data-wp-bind--aria-busy="state.isLoading"
>
	<div
		class="jetpack-search-results__loading"
		data-wp-bind--hidden="!state.isLoading"
	>
		<?php esc_html_e( 'Loading…', 'jetpack-search-pkg' ); ?>
	</div>

	<ul
		class="jetpack-search-results__list"
		data-wp-bind--hidden="state.isLoading"
		aria-live="polite"
	>
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
								data-wp-bind--hidden="context.result.hasTitleHighlight"
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
					<div
						class="jetpack-search-results__path"
						data-wp-bind--hidden="!context.result.path"
						data-wp-text="context.result.path"
					></div>
					<div
						class="jetpack-search-results__date"
						data-wp-bind--hidden="!context.result.dateLabel"
						data-wp-text="context.result.dateLabel"
					></div>
				</div>
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
			</li>
		</template>
	</ul>
</div>
