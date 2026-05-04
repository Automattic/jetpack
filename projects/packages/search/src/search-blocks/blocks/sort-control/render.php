<?php
/**
 * Sort Control block render.
 *
 * WordPress passes `$attributes` in at runtime; VariableAnalysis can't see
 * that because this file is include()'d rather than declared as a callback
 * parameter, hence the sniff disable.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- WP always supplies $attributes.
$attrs         = (array) $attributes;
$options       = Sort_Control::resolve_available_options( $attrs );
$option_labels = Sort_Control::get_option_labels();
$default_sort  = Sort_Control::normalize_default_sort( $attrs );
$display_as    = Sort_Control::normalize_display_as( $attrs );
$label         = Sort_Control::resolve_label( $attrs );

// Determine the effective sort for first paint and hydration. A URL
// `?orderby=...` always wins so deep links keep their meaning -- same
// precedence as the instant-search overlay. When no URL sort is present,
// fall back to the block's `defaultSort` attribute.
$url_sort       = Sort_Control::parse_url_sort( $options );
$effective_sort = $url_sort ?? $default_sort;
if ( ! in_array( $effective_sort, $options, true ) ) {
	// `defaultSort` may land outside `availableSortOptions` (e.g. an
	// author saved a default, then unchecked it from the list). Rather
	// than render a control that can't represent the current state,
	// pick the first allowed option so the selection is always a valid
	// choice.
	$effective_sort = $options[0];
}

// `wp_interactivity_data_wp_context()` (used in the radio template) was
// introduced in WP 6.5; calling it on older cores would fatal. Fall back
// to the `select` variant -- its template only emits inert
// `data-wp-bind--*` attributes, which degrade harmlessly without
// Interactivity.
if ( 'radio' === $display_as && ! function_exists( 'wp_interactivity_data_wp_context' ) ) {
	$display_as = 'select';
}

// Seed the shared Interactivity state with the resolved sort so the JS
// store hydrates against the value the server rendered. Whether this seed
// "wins" depends on theme type: under classic themes the block renders
// during `wp_enqueue_scripts`, after the Search_Blocks state seeder, so
// `wp_interactivity_state()`'s deep-merge layers on top. Under FSE/block
// themes the block template renders before `wp_enqueue_scripts` fires --
// the Search_Blocks seeder later overwrites this `sortOrder`, falling
// back to `relevance` for any sort key it doesn't recognise. Resolving
// the FSE precedence is tracked separately; this call still does the
// right thing under classic themes and is harmless under FSE.
if ( function_exists( 'wp_interactivity_state' ) ) {
	wp_interactivity_state( 'jetpack-search', array( 'sortOrder' => $effective_sort ) );
}

$select_id = wp_unique_id( 'jetpack-search-sort-' );
$menu_id   = wp_unique_id( 'jetpack-search-sort-menu-' );

$checked_getters = array(
	'relevance' => 'state.isSortByRelevance',
	'newest'    => 'state.isSortByNewest',
	'oldest'    => 'state.isSortByOldest',
);
?>
<?php if ( 'popover' === $display_as ) : ?>
	<div
		<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-sort--popover' ) ) ); ?>
		data-wp-interactive="jetpack-search"
		data-jetpack-search-popover-root
		data-wp-on-window--click="actions.onWindowClickClosePopovers"
		data-wp-on-window--keydown="actions.onEscapeClosePopovers"
	>
		<button
			type="button"
			class="jetpack-search-sort__trigger"
			aria-haspopup="menu"
			aria-expanded="false"
			data-wp-bind--aria-expanded="state.isSortPopoverOpen"
			disabled
			data-wp-bind--disabled="state.isSortTriggerDisabled"
			aria-controls="<?php echo esc_attr( $menu_id ); ?>"
			data-wp-on--click="actions.toggleSortPopover"
			data-wp-on--keydown="actions.onSortTriggerKeydown"
		>
			<svg class="jetpack-search-sort__icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
				<path fill="currentColor" d="M8 4l-4 4h3v12h2V8h3L8 4zm8 16l4-4h-3V4h-2v12h-3l4 4z"/>
			</svg>
			<span class="screen-reader-text"><?php esc_html_e( 'Sort results', 'jetpack-search-pkg' ); ?></span>
		</button>
		<div
			id="<?php echo esc_attr( $menu_id ); ?>"
			class="jetpack-search-sort__menu"
			role="menu"
			data-wp-bind--hidden="!state.isSortPopoverOpen"
			hidden
		>
			<?php foreach ( $options as $sort_key ) : ?>
				<?php
				$option_label    = $option_labels[ $sort_key ] ?? $sort_key;
				$checked_binding = $checked_getters[ $sort_key ] ?? 'false';
				?>
				<button
					type="button"
					role="menuitemradio"
					class="jetpack-search-sort__menu-item"
					value="<?php echo esc_attr( $sort_key ); ?>"
					tabindex="-1"
					data-wp-context='<?php echo esc_attr( wp_json_encode( array( 'sortKey' => $sort_key ), JSON_HEX_AMP | JSON_UNESCAPED_SLASHES ) ); ?>'
					data-wp-bind--aria-checked="<?php echo esc_attr( $checked_binding ); ?>"
					data-wp-bind--tabindex="state.sortMenuItemTabIndex"
					data-wp-on--click="actions.selectSortOrder"
					data-wp-on--keydown="actions.onSortMenuKeydown"
					data-wp-watch="callbacks.focusSelectedSortMenuItem"
				>
					<?php echo esc_html( $option_label ); ?>
				</button>
			<?php endforeach; ?>
		</div>
	</div>
<?php else : ?>
	<div
		<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
		data-wp-interactive="jetpack-search"
	>
		<?php if ( 'radio' === $display_as ) : ?>
			<?php
			// Shared `name` groups the radios so the browser enforces single-
			// selection semantics across the whole block instance. The wrapper's
			// uniquely generated id doubles as the group name -- two sort-control
			// blocks on the same page therefore get distinct names and don't
			// interfere with each other.
			$group_name = $select_id;
			?>
			<fieldset class="jetpack-search-sort-control__radio-group">
				<legend><?php echo esc_html( $label ); ?></legend>
				<?php foreach ( $options as $sort_key ) : ?>
					<?php
					$option_label = $option_labels[ $sort_key ] ?? $sort_key;
					$radio_id     = $select_id . '-' . sanitize_key( $sort_key );
					?>
					<div
						class="jetpack-search-sort-control__radio-item"
						<?php echo wp_kses_data( wp_interactivity_data_wp_context( array( 'sortKey' => $sort_key ) ) ); ?>
					>
						<input
							type="radio"
							id="<?php echo esc_attr( $radio_id ); ?>"
							name="<?php echo esc_attr( $group_name ); ?>"
							value="<?php echo esc_attr( $sort_key ); ?>"
							<?php checked( $effective_sort, $sort_key ); ?>
							data-wp-bind--checked="state.isSortOptionSelected"
							data-wp-on--change="actions.onSortChange"
						/>
						<label for="<?php echo esc_attr( $radio_id ); ?>">
							<?php echo esc_html( $option_label ); ?>
						</label>
					</div>
				<?php endforeach; ?>
			</fieldset>
		<?php else : ?>
			<label for="<?php echo esc_attr( $select_id ); ?>">
				<?php echo esc_html( $label ); ?>
			</label>
			<select
				id="<?php echo esc_attr( $select_id ); ?>"
				data-wp-bind--value="state.sortOrder"
				data-wp-on--change="actions.onSortChange"
			>
				<?php foreach ( $options as $sort_key ) : ?>
					<?php $option_label = $option_labels[ $sort_key ] ?? $sort_key; ?>
					<option
						value="<?php echo esc_attr( $sort_key ); ?>"
						<?php selected( $effective_sort, $sort_key ); ?>
					><?php echo esc_html( $option_label ); ?></option>
				<?php endforeach; ?>
			</select>
		<?php endif; ?>
	</div>
<?php endif; ?>
