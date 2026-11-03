<?php
/**
 * Empty-state logic shared by the `no-results` block and `results-list`.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * The one implementation of what the results region shows instead of results.
 *
 * Two renderers can emit an empty state — the `no-results` block's variants and
 * `results-list`'s legacy regions — and they have to agree on which of them
 * covers each condition, on the copy, and on the store getter that reveals it.
 * Condition logic belongs here rather than in either `render.php`.
 */
class No_Results {

	/**
	 * Conditions a variant can be scoped to.
	 */
	const CONDITIONS = array( 'any', 'filtered', 'error' );

	/**
	 * Coverage of the markup currently being rendered on its own, set only for
	 * the duration of `render_self_contained()`. Null during a page render.
	 *
	 * @var array<string,bool>|null
	 */
	private static $self_contained_coverage = null;

	/**
	 * Render block markup as a region of its own, resolving the empty-state
	 * hand-off from its own composition rather than the page-global flags.
	 *
	 * The block-template overlay is pre-rendered on every front-end request,
	 * whether or not a visitor opens it. Seeding coverage from that pass would
	 * retire the legacy regions of unrelated in-page results markup, blanking a
	 * message the site showed yesterday. Its composition is known up front, so
	 * it doesn't need the flags at all.
	 *
	 * @param string $content Block markup.
	 * @return string Rendered HTML.
	 */
	public static function render_self_contained( string $content ): string {
		// Restored, not cleared: a nested call that reset to null would drop the
		// outer render back onto the page-global getters *and* let it resume
		// seeding — silently reintroducing the leak this exists to prevent.
		// Nothing nests today; this keeps that cheap to add.
		$previous                      = self::$self_contained_coverage;
		self::$self_contained_coverage = self::collect_coverage( $content );
		try {
			return do_blocks( $content );
		} finally {
			self::$self_contained_coverage = $previous;
		}
	}

	/**
	 * Which conditions the `no-results` blocks in a chunk of block markup cover.
	 *
	 * @param string $content Block markup.
	 * @return array<string,bool> Keyed by condition.
	 */
	public static function collect_coverage( string $content ): array {
		$coverage = array_fill_keys( self::CONDITIONS, false );
		self::walk_coverage( parse_blocks( $content ), $coverage );
		return $coverage;
	}

	/**
	 * Accumulate coverage across a parsed block tree.
	 *
	 * @param array              $blocks   Parsed blocks.
	 * @param array<string,bool> $coverage Coverage accumulator, by reference.
	 * @return void
	 */
	private static function walk_coverage( array $blocks, array &$coverage ): void {
		foreach ( $blocks as $block ) {
			$inner_blocks = $block['innerBlocks'] ?? array();
			if ( 'jetpack-search/no-results' !== ( $block['blockName'] ?? '' ) ) {
				self::walk_coverage( $inner_blocks, $coverage );
				continue;
			}

			$conditions = array();
			$has_strays = false;
			foreach ( $inner_blocks as $inner_block ) {
				$inner_name = $inner_block['blockName'] ?? '';
				if ( 'jetpack-search/no-results-slot' === $inner_name ) {
					$conditions[] = self::normalize_condition( $inner_block['attrs']['condition'] ?? '' );
				} elseif ( ! empty( $inner_name ) || '' !== trim( (string) ( $inner_block['innerHTML'] ?? '' ) ) ) {
					$has_strays = true;
				}
			}
			// Mirrors the renderer: it wraps stray children as an unscoped
			// variant, and a container with nothing else stands in for one. If
			// this disagreed, both the wrapped strays and the legacy region
			// would bind to the same getter and show together.
			if ( $has_strays ) {
				$conditions[] = 'any';
			}
			foreach ( $conditions ? $conditions : array( 'any' ) as $condition ) {
				$coverage[ $condition ] = true;
			}
		}
	}

	/**
	 * Normalize a saved `no-results-slot` condition.
	 *
	 * @param mixed $condition Saved attribute value.
	 * @return string One of `any`, `filtered`, `error`.
	 */
	public static function normalize_condition( $condition ): string {
		return in_array( $condition, array( 'filtered', 'error' ), true ) ? $condition : 'any';
	}

	/**
	 * Seed which empty states a variant covers.
	 *
	 * `results-list`'s legacy regions stand down only for the cases actually
	 * covered, so a lone variant scoped to one condition doesn't leave the
	 * others with no message at all. `wp_interactivity_state()` deep-merges and
	 * nothing ever seeds `false`, so variants compose into full coverage.
	 *
	 * A `filtered` variant additionally claims that state, and an unscoped
	 * (`any`) one yields where it did — otherwise the two would stack on a
	 * filtered empty search. `error` is disjoint from both: it retires only the
	 * legacy error region, which keeps `any` the safe default.
	 *
	 * @param string $condition One of `any`, `filtered`, `error`.
	 * @return void
	 */
	public static function seed_coverage( string $condition ): void {
		if ( ! function_exists( 'wp_interactivity_state' ) || null !== self::$self_contained_coverage ) {
			return;
		}
		if ( 'error' === $condition ) {
			$coverage = array( 'hasErrorBlock' => true );
		} else {
			$coverage = array( 'hasNoResultsFiltered' => true );
			if ( 'filtered' === $condition ) {
				$coverage['hasScopedNoResultsFiltered'] = true;
			} else {
				$coverage['hasNoResultsUnfiltered'] = true;
			}
		}
		wp_interactivity_state( 'jetpack-search', $coverage );
	}

	/**
	 * Store getter that decides whether a condition is showing.
	 *
	 * `data-wp-bind` only evaluates simple property paths, so each condition
	 * needs its own getter rather than an inline expression.
	 *
	 * @param string $condition One of `any`, `filtered`, `error`.
	 * @return string Getter path.
	 */
	public static function visibility_getter( string $condition ): string {
		$coverage = self::$self_contained_coverage;

		// `showNoResultsAny` yields to whichever variant claimed the filtered
		// state, which it reads from flags a self-contained render never
		// writes. That render knows the answer outright.
		if ( 'any' === $condition && null !== $coverage ) {
			return $coverage['filtered'] ? 'state.showNoResultsUnfiltered' : 'state.showNoResults';
		}

		$getters = array(
			'any'      => 'state.showNoResultsAny',
			'filtered' => 'state.showNoResultsFiltered',
			'error'    => 'state.showError',
		);
		return $getters[ $condition ] ?? $getters['any'];
	}

	/**
	 * Store getter that shows `results-list`'s legacy empty-state region, or an
	 * empty string when nothing is left for it to cover.
	 *
	 * @return string Getter path, or '' to drop the region.
	 */
	public static function legacy_no_results_getter(): string {
		$coverage = self::$self_contained_coverage;
		if ( null === $coverage ) {
			return 'state.showLegacyNoResults';
		}
		if ( $coverage['any'] ) {
			return '';
		}
		return $coverage['filtered'] ? 'state.showNoResultsUnfiltered' : 'state.showNoResults';
	}

	/**
	 * Store getter that shows `results-list`'s legacy error region, or an empty
	 * string when a variant covers the failure case.
	 *
	 * @return string Getter path, or '' to drop the region.
	 */
	public static function legacy_error_getter(): string {
		$coverage = self::$self_contained_coverage;
		if ( null === $coverage ) {
			return 'state.showLegacyError';
		}
		return $coverage['error'] ? '' : 'state.showError';
	}

	/**
	 * Live-region attribute for a condition's default copy.
	 *
	 * A failure is assertive, an empty result set is not — the same split
	 * `results-list` has always emitted between its two regions. Only the
	 * default copy gets one: announcing an author's whole composition verbatim
	 * on every empty search is worse than not announcing it.
	 *
	 * Every message gets one, authored or not. `results-list` announced its
	 * custom copy too, so wrapping only the fallback would leave a screen
	 * reader silent on the transition to empty for exactly the authors who
	 * cared enough to write their own message.
	 *
	 * @param string $condition One of `any`, `filtered`, `error`.
	 * @return string Attribute markup.
	 */
	public static function live_region_attribute( string $condition ): string {
		return 'error' === $condition ? 'role="alert"' : 'role="status"';
	}

	/**
	 * Default copy for the states the results region can show instead of
	 * results, keyed by state.
	 *
	 * Single source for the two renderers that can emit them, so the strings
	 * can't drift into near-identical translator entries that disagree. The
	 * editor-side mirror lives in `blocks/no-results/slot/edit.jsx`.
	 *
	 * @return array{unfiltered:string, filtered:string, error:string}
	 */
	public static function default_messages(): array {
		return array(
			'unfiltered' => __( 'No results found. Try a different search.', 'jetpack-search-pkg' ),
			'filtered'   => __( 'No results match these filters. Try clearing some, or searching for something else.', 'jetpack-search-pkg' ),
			'error'      => __( 'Something went wrong. Please try again.', 'jetpack-search-pkg' ),
		);
	}

	/**
	 * Emit the localized default copy for a condition.
	 *
	 * The unscoped case keeps the filter-aware pair `results-list` has always
	 * rendered, so a stock install reads the same as before the block existed.
	 * Neither `<p>` carries an initial `hidden` — the wrapper's covers the SSR
	 * path and the Interactivity runtime resolves the inner binds atomically on
	 * reveal; adding one here makes the other flash.
	 *
	 * @param string $condition One of `any`, `filtered`, `error`.
	 * @return void
	 */
	public static function render_default_copy( string $condition ): void {
		$defaults = self::default_messages();
		if ( 'filtered' === $condition ) {
			printf( '<p>%s</p>', esc_html( $defaults['filtered'] ) );
			return;
		}
		if ( 'error' === $condition ) {
			printf( '<p>%s</p>', esc_html( $defaults['error'] ) );
			return;
		}
		printf(
			'<p data-wp-bind--hidden="state.hasActiveFilters">%s</p><p data-wp-bind--hidden="!state.hasActiveFilters">%s</p>',
			esc_html( $defaults['unfiltered'] ),
			esc_html( $defaults['filtered'] )
		);
	}
}
