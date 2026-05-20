<?php
/**
 * Resolves the header/footer template-part slugs the active theme uses for
 * its search results so the bundled Jetpack Search template can mirror them.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Chooses chrome (header/footer) slugs for the bundled search templates.
 *
 * Resolution order, per slot: theme's `search.html` → `index.html` →
 * alphabetically-first `wp_template_part` with the matching `area` →
 * hardcoded `header`/`footer` defaults.
 */
class Theme_Chrome_Slug_Resolver {

	const DEFAULTS = array(
		'header' => 'header',
		'footer' => 'footer',
	);

	/**
	 * Resolve chrome slugs for the active theme.
	 *
	 * Per-request memo keyed by REQUEST_TIME_FLOAT so the static doesn't
	 * outlive a single request in long-lived PHP-FPM workers; keyed by
	 * `get_called_class()` so anonymous test subclasses can stub
	 * `get_active_theme_template_content()` / `resolve_by_area()` without
	 * polluting each other.
	 *
	 * @return array{header:string,footer:string}
	 */
	public static function resolve(): array {
		static $cache = array();
		$request_id   = isset( $_SERVER['REQUEST_TIME_FLOAT'] )
			? (string) (float) $_SERVER['REQUEST_TIME_FLOAT'] // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
			: (string) microtime( true );
		$key          = get_called_class() . '|' . get_stylesheet() . '|' . $request_id;
		if ( isset( $cache[ $key ] ) ) {
			return $cache[ $key ];
		}

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
		if ( null === $found['header'] || null === $found['footer'] ) {
			$by_area         = static::resolve_by_area();
			$found['header'] = $found['header'] ?? $by_area['header'];
			$found['footer'] = $found['footer'] ?? $by_area['footer'];
		}

		$cache[ $key ] = array(
			'header' => $found['header'] ?? self::DEFAULTS['header'],
			'footer' => $found['footer'] ?? self::DEFAULTS['footer'],
		);
		return $cache[ $key ];
	}

	/**
	 * Pull the first and last top-level `core/template-part` slugs out of
	 * template markup. Slugs outside `[a-zA-Z0-9_-]` are rejected so the
	 * JSON round-trip in the bundled-template substitution can't break.
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
		// A single-template-part shape is header-only; two parts that
		// happen to share a slug are preserved as-is.
		if ( $count < 2 ) {
			$footer = null;
		}
		return array(
			'header' => $header,
			'footer' => $footer,
		);
	}

	/**
	 * Pick the alphabetically-first slug per area from a list of
	 * `wp_template_part` records, scoped to one stylesheet.
	 *
	 * @param array  $parts      Part records with `theme`, `slug`, `area`.
	 * @param string $stylesheet Active stylesheet — parts from other themes are ignored.
	 * @return array{header:?string,footer:?string}
	 */
	public static function extract_from_parts( array $parts, string $stylesheet ): array {
		$by_area = array(
			'header' => array(),
			'footer' => array(),
		);
		foreach ( $parts as $part ) {
			if ( ! isset( $part->theme ) || $part->theme !== $stylesheet ) {
				continue;
			}
			$area = $part->area ?? null;
			$slug = $part->slug ?? null;
			if ( ! is_string( $slug ) || '' === $slug || ! preg_match( '/^[a-zA-Z0-9_-]+$/', $slug ) ) {
				continue;
			}
			if ( isset( $by_area[ $area ] ) ) {
				$by_area[ $area ][] = $slug;
			}
		}
		$out = array(
			'header' => null,
			'footer' => null,
		);
		foreach ( array( 'header', 'footer' ) as $area ) {
			if ( ! empty( $by_area[ $area ] ) ) {
				sort( $by_area[ $area ], SORT_STRING );
				$out[ $area ] = $by_area[ $area ][0];
			}
		}
		return $out;
	}

	/**
	 * Resolved markup for an active-theme template. Overridable seam.
	 *
	 * @param string $template_name Bare template slug (no `theme//` prefix).
	 * @return string|null Markup, or null if it doesn't resolve.
	 */
	protected static function get_active_theme_template_content( string $template_name ): ?string {
		if ( ! function_exists( 'get_block_template' ) ) {
			return null;
		}
		$tmpl = get_block_template( get_stylesheet() . '//' . $template_name, 'wp_template' );
		if ( ! $tmpl || empty( $tmpl->content ) ) {
			return null;
		}
		return (string) $tmpl->content;
	}

	/**
	 * Area-based fallback (rung 3 of resolve()). Overridable seam.
	 *
	 * @return array{header:?string,footer:?string}
	 */
	protected static function resolve_by_area(): array {
		if ( ! function_exists( 'get_block_templates' ) ) {
			return array(
				'header' => null,
				'footer' => null,
			);
		}
		return static::extract_from_parts(
			get_block_templates( array(), 'wp_template_part' ),
			get_stylesheet()
		);
	}
}
