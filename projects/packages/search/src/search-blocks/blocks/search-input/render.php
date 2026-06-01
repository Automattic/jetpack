<?php
/**
 * Search Input block render.
 *
 * WordPress passes $attributes, $content, $block to render.php at runtime;
 * VariableAnalysis can't see that, so the sniff is disabled here.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// Trim so a whitespace-only placeholder still falls back to the translated
// default — block.json's static default can't be localized, so the empty/
// whitespace case resolves here.
$placeholder = trim( (string) ( $attributes['placeholder'] ?? '' ) );
if ( '' === $placeholder ) {
	$placeholder = __( 'Search…', 'jetpack-search-pkg' );
}
$show_icon   = (bool) ( $attributes['showIcon'] ?? true );
$submit_only = ! empty( $attributes['submitOnly'] );
// Sanitize the saved `suggestionTypes` array down to a known-good subset of
// the enum, in the canonical render order, deduplicated. Mirrors the
// enum in `block.json::attributes.suggestionTypes.items.enum` and the
// `TYPE_ORDER` constant in `suggestion-rows.js`. Authors can save anything
// the editor lets them — and a future block-version migration could leave
// stale strings here — so the front end stays defensive.
$allowed_suggestion_types = array( 'query', 'taxonomy', 'post' );
$raw_suggestion_types     = $attributes['suggestionTypes'] ?? $allowed_suggestion_types;
if ( ! is_array( $raw_suggestion_types ) ) {
	$raw_suggestion_types = $allowed_suggestion_types;
}
$suggestion_types = array_values(
	array_intersect( $allowed_suggestion_types, array_map( 'strval', $raw_suggestion_types ) )
);
// `enableSuggestions` is the author's master kill switch; an empty
// `suggestionTypes` array collapses to the same outcome (no dropdown). The
// combined gate keeps the rest of the render path branch-free — no listbox,
// no combobox attributes, no `data-wp-context` seeded when either says off.
$enable_suggestions = ! empty( $attributes['enableSuggestions'] ) && ! empty( $suggestion_types );
// Read the URL-derived query through the shared helper so the SSR
// `value=` matches the Interactivity store's seeded `searchQuery`.
// The helper picks `s` vs `q` based on `is_search()` and applies the
// same sanitize_text_field + trim WP would have applied to `s`.
$initial_query = Search_Blocks::parse_url_search_query();
$input_id      = wp_unique_id( 'jetpack-search-input-' );
// A separate id pair is generated for the listbox + status region so the
// input's `aria-controls` / `aria-activedescendant` can resolve to stable
// DOM ids. Only generated (and only emitted) when suggestions are on, to
// keep the default DOM untouched for authors who haven't opted in.
$listbox_id = $enable_suggestions ? wp_unique_id( 'jetpack-search-suggestions-' ) : '';
// `data-wp-context` seeds the per-instance Interactivity state for the
// suggestions dropdown. Keeping it per-block (rather than on the shared
// `jetpack-search` store) means a header + sidebar Search Input on the
// same page never share a dropdown's `showSuggestions` / `activeIndex` —
// each instance owns its own UI state while still pulling the query from
// the shared `state.searchQuery`. Post-type scope lives on the parent
// `search-results` block, not here — inputs are entry points, not
// boundaries.
$context = $enable_suggestions
	? array(
		'showSuggestions' => false,
		'activeIndex'     => -1,
		'activeOptionId'  => '',
		'rows'            => array(),
		'listboxId'       => $listbox_id,
		// `suggestionTypes` is seeded so the view bundle can filter
		// rows client-side without re-reading the block attribute via
		// a roundtrip. Per-instance because two Search Input blocks
		// on the same page could pick different shapes.
		'suggestionTypes' => $suggestion_types,
	)
	: array();
$emit_context = ! empty( $context );
$context_json = $emit_context
	? wp_json_encode( $context, JSON_HEX_AMP | JSON_UNESCAPED_SLASHES )
	: '';

// Mirrors `render_block_core_search()`'s width handling: both halves of the
// (value, unit) pair must be present, then emit `width: <n><unit>;` on the
// wrapper. The inside-wrapper's `display:flex` + `min-width:0` on the field
// shrinks the visible text area in step; icon + clear stay at natural width.
// `widthUnit` is allowlisted against the same units the editor offers —
// `block.json` only types it as a free-form string, so a REST write or a
// future migration can't smuggle an arbitrary unit into the inline style.
$wrapper_extra_attrs = array();
$allowed_width_units = array( 'px', '%' );
$raw_width_unit      = (string) ( $attributes['widthUnit'] ?? '' );
$width_unit          = in_array( $raw_width_unit, $allowed_width_units, true ) ? $raw_width_unit : '';
$has_width           = isset( $attributes['width'] ) && '' !== $attributes['width'] && '' !== $width_unit;
if ( $has_width ) {
	$wrapper_extra_attrs['style'] = sprintf(
		'width:%d%s;',
		(int) $attributes['width'],
		$width_unit
	);
}
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( $wrapper_extra_attrs ) ); ?>
	data-wp-interactive="jetpack-search"
	<?php if ( $emit_context ) : ?>
	data-wp-context='<?php echo esc_attr( $context_json ); ?>'
	<?php endif; ?>
>
	<label class="jetpack-search-input__label screen-reader-text" for="<?php echo esc_attr( $input_id ); ?>">
		<?php esc_html_e( 'Search', 'jetpack-search-pkg' ); ?>
	</label>
	<div class="jetpack-search-input__inside-wrapper">
		<?php if ( $show_icon ) : ?>
		<svg class="jetpack-search-input__icon" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<path d="M13 5c-3.3 0-6 2.7-6 6 0 1.4.5 2.7 1.3 3.7l-3.8 3.8 1.1 1.1 3.8-3.8c1 .8 2.3 1.3 3.7 1.3 3.3 0 6-2.7 6-6s-2.7-6-6-6zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z" />
		</svg>
		<?php endif; ?>
		<input
			id="<?php echo esc_attr( $input_id ); ?>"
			type="search"
			class="jetpack-search-input__field"
			placeholder="<?php echo esc_attr( $placeholder ); ?>"
			value="<?php echo esc_attr( $initial_query ); ?>"
			<?php if ( $submit_only ) : ?>
			data-submit-only="true"
			<?php endif; ?>
			<?php if ( $enable_suggestions ) : ?>
			role="combobox"
			aria-autocomplete="list"
			aria-haspopup="listbox"
			aria-controls="<?php echo esc_attr( $listbox_id ); ?>"
			data-suggestions-enabled="true"
			data-wp-bind--aria-expanded="context.showSuggestions"
			data-wp-bind--aria-activedescendant="context.activeOptionId"
			data-wp-on--focus="actions.onSearchFocus"
			data-wp-on--blur="actions.onSearchBlur"
			<?php endif; ?>
			data-wp-bind--value="state.searchQuery"
			data-wp-on--input="actions.onSearchInput"
			data-wp-on--keydown="actions.onSearchKeydown"
			data-wp-init="callbacks.initFocusInputIfHasQuery"
		/>
		<button
			type="button"
			class="jetpack-search-input__clear"
			data-wp-bind--hidden="!state.searchQuery"
			data-wp-on--click="actions.clearSearch"
		>
			<?php
			/* translators: Button is used to clear the search input query. */
			echo esc_html__( 'clear', 'jetpack-search-pkg' );
			?>
		</button>
		<?php if ( $enable_suggestions ) : ?>
		<ul
			id="<?php echo esc_attr( $listbox_id ); ?>"
			class="jetpack-search-input__suggestions"
			role="listbox"
			aria-label="<?php echo esc_attr__( 'Search suggestions', 'jetpack-search-pkg' ); ?>"
			data-wp-bind--hidden="!context.showSuggestions"
			hidden
		>
			<template
				data-wp-each--row="context.rows"
				data-wp-each-key="context.row.key"
			>
				<li
					class="jetpack-search-input__suggestions-label"
					role="presentation"
					data-wp-bind--hidden="!context.row.isHeader"
					data-wp-text="context.row.label"
				></li>
				<li
					class="jetpack-search-input__suggestions-option"
					role="option"
					data-wp-bind--hidden="context.row.isHeader"
					data-wp-bind--id="context.row.optionId"
					data-wp-bind--aria-selected="state.isRowActive"
					data-wp-class--is-active="state.isRowActive"
					data-wp-on--mousedown="actions.onSuggestionMousedown"
					data-wp-on--click="actions.onSuggestionClick"
					tabindex="-1"
				>
					<span data-wp-text="context.row.text"></span>
				</li>
			</template>
		</ul>
		<?php endif; ?>
	</div>
</div>
