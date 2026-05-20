<?php
/**
 * Resolves the header/footer template-part slugs the active theme uses for
 * its search results so the bundled Jetpack Search template can mirror them.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Resolves chrome (header/footer) slugs for the bundled search templates,
 * cached in a site option, invalidated on theme switch + relevant Site
 * Editor saves.
 *
 * Resolution chain (per slot): theme's `search.html` → `index.html` →
 * hardcoded `header`/`footer` defaults. The 237-theme wordpress.org
 * survey behind SEARCH-217 found this two-rung chain covers every theme
 * that ships parts at non-default slugs (the long tail of `wp:pattern`-
 * wrap themes already works with the defaults because they still ship
 * `parts/header.html` / `parts/footer.html`).
 */
class Theme_Chrome_Slug_Resolver {

	const OPTION_NAME = 'jetpack_search_resolved_chrome_slugs';

	const DEFAULTS = array(
		'header' => 'header',
		'footer' => 'footer',
	);

	/**
	 * Hook invalidation actions. Idempotent — safe to call from init.
	 *
	 * `save_post_wp_template_part` is broader than the wp_template hook
	 * (no narrowing by slug or theme): part edits are rare and even an
	 * over-eager invalidation is cheap (one extra `compute()` next request).
	 */
	public static function register_hooks() {
		add_action( 'switch_theme', array( static::class, 'invalidate' ) );
		add_action( 'save_post_wp_template', array( static::class, 'maybe_invalidate_on_template_save' ), 10, 2 );
		add_action( 'save_post_wp_template_part', array( static::class, 'invalidate' ) );
	}

	/**
	 * Resolved chrome slugs for the active theme.
	 *
	 * @return array{header:string,footer:string}
	 */
	public static function resolve(): array {
		$stylesheet = (string) get_stylesheet();
		if ( static::is_preview() ) {
			// Preview themes: resolve fresh, never read or write the cache.
			return static::compute();
		}
		$cached = static::read_cache( $stylesheet );
		if ( null !== $cached ) {
			return $cached;
		}
		$computed = static::compute();
		static::write_cache( $stylesheet, $computed );
		return $computed;
	}

	/**
	 * Clear the cache. Hooked to `switch_theme` and template-part saves.
	 */
	public static function invalidate() {
		delete_option( self::OPTION_NAME );
	}

	/**
	 * `save_post_wp_template` handler — only invalidate when the saved
	 * template is one we read from (`search` or `index`) on the active
	 * theme. Cuts noise from unrelated template edits.
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 */
	public static function maybe_invalidate_on_template_save( $post_id, $post ) {
		if ( ! $post instanceof \WP_Post ) {
			return;
		}
		if ( 'search' !== $post->post_name && 'index' !== $post->post_name ) {
			return;
		}
		$terms = wp_get_post_terms( $post_id, 'wp_theme', array( 'fields' => 'names' ) );
		if ( is_wp_error( $terms ) || ! in_array( (string) get_stylesheet(), (array) $terms, true ) ) {
			return;
		}
		static::invalidate();
	}

	/**
	 * Pull the first and last top-level `core/template-part` slugs out of
	 * template markup. Slugs outside `[a-zA-Z0-9_-]` are rejected so the
	 * JSON round-trip in the bundled-template substitution can't break.
	 * A single top-level template-part is treated as header-only. Only
	 * top-level blocks are walked — parts nested inside `wp:group`
	 * containers are skipped on purpose (a theme that buries its chrome
	 * inside a wrapper falls back to the resolver's later rungs).
	 *
	 * @param string $template_content Block markup.
	 * @return array{header:?string,footer:?string}
	 */
	public static function extract_from_template_content( string $template_content ): array {
		$header = null;
		$footer = null;
		$count  = 0;
		if ( '' === $template_content || ! function_exists( 'parse_blocks' ) ) {
			return array(
				'header' => $header,
				'footer' => $footer,
			);
		}
		foreach ( parse_blocks( $template_content ) as $block ) {
			if ( 'core/template-part' !== ( $block['blockName'] ?? '' ) ) {
				continue;
			}
			$slug = $block['attrs']['slug'] ?? null;
			if ( ! is_string( $slug ) || '' === $slug || ! preg_match( '/^[a-zA-Z0-9_-]+$/', $slug ) ) {
				continue;
			}
			if ( null === $header ) {
				$header = $slug;
			}
			$footer = $slug;
			++$count;
		}
		if ( $count < 2 ) {
			$footer = null;
		}
		return array(
			'header' => $header,
			'footer' => $footer,
		);
	}

	/**
	 * Run the resolution chain. Doesn't touch the cache (caller decides).
	 * The active stylesheet is implicit via `get_active_theme_template_content()`.
	 *
	 * @return array{header:string,footer:string}
	 */
	protected static function compute(): array {
		$found = array(
			'header' => null,
			'footer' => null,
		);
		foreach ( array( 'search', 'index' ) as $template_name ) {
			if ( null !== $found['header'] && null !== $found['footer'] ) {
				break;
			}
			$content = static::get_active_theme_template_content( $template_name );
			if ( null === $content ) {
				continue;
			}
			$extracted       = static::extract_from_template_content( $content );
			$found['header'] = $found['header'] ?? $extracted['header'];
			$found['footer'] = $found['footer'] ?? $extracted['footer'];
		}
		return array(
			'header' => $found['header'] ?? self::DEFAULTS['header'],
			'footer' => $found['footer'] ?? self::DEFAULTS['footer'],
		);
	}

	/**
	 * Read the option-backed cache. Returns null on miss or when the
	 * stored stylesheet doesn't match the active one (handles the rare
	 * case where `switch_theme` fired without clearing the option).
	 *
	 * @param string $stylesheet Active stylesheet.
	 * @return array{header:string,footer:string}|null
	 */
	protected static function read_cache( string $stylesheet ): ?array {
		$raw = get_option( self::OPTION_NAME );
		if ( ! is_array( $raw ) || ( $raw['stylesheet'] ?? null ) !== $stylesheet ) {
			return null;
		}
		$header = $raw['header'] ?? null;
		$footer = $raw['footer'] ?? null;
		if ( ! is_string( $header ) || ! is_string( $footer ) ) {
			return null;
		}
		return array(
			'header' => $header,
			'footer' => $footer,
		);
	}

	/**
	 * Persist the resolved slugs to the option-backed cache.
	 *
	 * `autoload=false`: the option changes only on theme switches /
	 * search.html edits, so we don't want it in the `alloptions` payload
	 * fetched on every request. The first `get_option()` per request
	 * issues its own DB query (or hits the object cache on sites that
	 * have one) instead.
	 *
	 * Cache-cold race: two concurrent requests can both compute and write
	 * with last-writer-wins semantics. Same input → same output, so
	 * correctness isn't affected.
	 *
	 * @param string                             $stylesheet Active stylesheet.
	 * @param array{header:string,footer:string} $slugs      Resolved slugs.
	 */
	protected static function write_cache( string $stylesheet, array $slugs ) {
		update_option(
			self::OPTION_NAME,
			array(
				'stylesheet' => $stylesheet,
				'header'     => $slugs['header'],
				'footer'     => $slugs['footer'],
			),
			false
		);
	}

	/**
	 * Whether the current request is a theme preview (Customizer or
	 * Site Editor theme preview). Cache reads and writes are skipped in
	 * this state so a preview never pollutes the production-theme cache.
	 *
	 * @return bool
	 */
	protected static function is_preview(): bool {
		if ( function_exists( 'is_customize_preview' ) && is_customize_preview() ) {
			return true;
		}
		// Site Editor theme preview surfaces as `?wp_theme_preview=<theme-slug>`.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only preview detection.
		return ! empty( $_GET['wp_theme_preview'] );
	}

	/**
	 * Resolved markup for an active-theme template. Overridable seam.
	 *
	 * @param string $template_name Bare template slug (no `theme//` prefix).
	 * @return string|null
	 */
	protected static function get_active_theme_template_content( string $template_name ): ?string {
		if ( ! function_exists( 'get_block_template' ) ) {
			return null;
		}
		$tmpl = get_block_template( (string) get_stylesheet() . '//' . $template_name, 'wp_template' );
		if ( ! $tmpl || empty( $tmpl->content ) ) {
			return null;
		}
		return (string) $tmpl->content;
	}
}
