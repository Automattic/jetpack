<?php
/**
 * AI Answer block render.
 *
 * Renders the panel scaffold that the Interactivity store hydrates with the
 * streaming brief / extended AI answer. The author's decision to insert the
 * block in their post content is the only opt-in switch — there's no site-wide
 * option gate here. The `jetpack_search_ai_answers_enabled` option still
 * governs the instant-search overlay's AI Answers, which is the default UX
 * on any search page; the embedded block is an explicit opt-in surface.
 *
 * AI Answer is a paid feature, so the render is additionally gated on the
 * site having a paid Search plan. Free / no-plan sites emit nothing — the
 * saved block instance is silently hidden on the front end, matching how
 * WordAds / Premium Content behave when their plan check fails.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// Paid-plan gate. AI Answer requires Jetpack Search's paid plan; on a free
// or no-plan site the block contributes nothing to the page (no panel
// scaffold, no `data-wp-interactive` div, no Interactivity hydration). The
// editor surface shows an upgrade prompt instead — see `edit.js`.
if ( ! Search_Blocks::supports_paid_search() ) {
	return;
}

// $attributes is injected by WordPress at block-render time via the
// `render_callback` include scope; static analysis can't see the binding,
// so both phpcs and Phan need a one-line suppression on the next statement.
// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$attrs           = (array) $attributes; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
$heading_raw     = trim( (string) ( $attrs['heading'] ?? '' ) );
$heading         = '' === $heading_raw ? __( 'AI answer', 'jetpack-search-pkg' ) : $heading_raw;
$show_citations  = ! isset( $attrs['showCitations'] ) || $attrs['showCitations'];
$enable_extended = ! isset( $attrs['enableShowMore'] ) || $attrs['enableShowMore'];
$wrapper_attrs   = get_block_wrapper_attributes(
	array( 'class' => 'jp-search-answers-panel' )
);
?>
<div
	<?php echo wp_kses_data( $wrapper_attrs ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-init="callbacks.initializeAiAnswer"
	data-wp-bind--hidden="state.aiPanelHidden"
	aria-live="polite"
	hidden
>
	<h2 class="jp-search-answers-panel__heading"><?php echo esc_html( $heading ); ?></h2>

	<div
		class="jp-search-answers-panel__loading"
		data-wp-bind--hidden="!state.aiIsLoading"
		hidden
	>
		<?php esc_html_e( 'Finding an answer', 'jetpack-search-pkg' ); ?>
		<span class="jp-search-animated-ellipsis" aria-hidden="true">
			<span></span><span></span><span></span>
		</span>
	</div>

	<div
		class="jp-search-answers-panel__error"
		role="alert"
		data-wp-bind--hidden="!state.aiIsError"
		hidden
	>
		<p
			class="jp-search-answers-panel__error-message"
			data-wp-text="state.aiErrorPrimary"
		></p>
		<p
			class="jp-search-answers-panel__error-detail"
			data-wp-bind--hidden="!state.aiHasErrorDetail"
		>
			<span data-wp-text="state.aiErrorDetail"></span>
			<span data-wp-bind--hidden="!state.aiHasErrorCode">
				<br />
				<span data-wp-text="state.aiErrorCodeText"></span>
			</span>
		</p>
	</div>

	<div
		class="jp-search-answers-panel__content"
		data-wp-bind--hidden="!state.aiHasContent"
		hidden
	>
		<div
			class="jp-search-answers-panel__text"
			data-wp-watch="callbacks.renderAiAnswerHtml"
		></div>

		<?php if ( $show_citations ) : ?>
		<ul
			class="jp-search-answers-panel__citations"
			data-wp-bind--hidden="!state.aiHasCitations"
			hidden
		>
			<template
				data-wp-each--citation="state.aiVisibleCitations"
				data-wp-each-key="context.citation.key"
			>
				<li>
					<a
						data-wp-bind--href="context.citation.href"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span data-wp-text="context.citation.title"></span>
						<svg
							width="10"
							height="10"
							viewBox="0 0 10 10"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
							class="jp-search-answers-panel__citation-icon"
						>
							<path d="M1 9L9 1M9 1H5M9 1V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</a>
				</li>
			</template>
		</ul>
		<?php endif; ?>
	</div>

	<p
		class="jp-search-answers-panel__loading-hint"
		data-wp-bind--hidden="!state.aiExtendedLoadingHintShown"
		hidden
	>
		<span data-wp-text="state.aiExtendedLoadingText"></span>
		<span class="jp-search-animated-ellipsis" aria-hidden="true">
			<span></span><span></span><span></span>
		</span>
	</p>

	<?php if ( $enable_extended ) : ?>
	<button
		type="button"
		class="jp-search-answers-panel__toggle"
		data-wp-bind--hidden="!state.aiShowExtendedButton"
		data-wp-on--click="actions.showExtendedAiAnswer"
		hidden
	>
		<?php esc_html_e( 'Show more', 'jetpack-search-pkg' ); ?>
		<span class="jp-search-answers-panel__toggle-icon" aria-hidden="true"></span>
	</button>
	<?php endif; ?>
</div>
