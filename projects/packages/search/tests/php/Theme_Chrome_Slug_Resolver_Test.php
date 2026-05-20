<?php
/**
 * Theme_Chrome_Slug_Resolver tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\Search\Theme_Chrome_Slug_Resolver
 */
#[CoversClass( Theme_Chrome_Slug_Resolver::class )]
class Theme_Chrome_Slug_Resolver_Test extends TestCase {

	/**
	 * Data-driven extractor coverage across all slug shapes.
	 *
	 * @dataProvider provider_extract_from_template_content
	 *
	 * @param string                               $content  Markup.
	 * @param array{header:?string,footer:?string} $expected Expected slugs.
	 */
	#[DataProvider( 'provider_extract_from_template_content' )]
	public function test_extract_from_template_content( string $content, array $expected ) {
		$this->assertSame( $expected, Theme_Chrome_Slug_Resolver::extract_from_template_content( $content ) );
	}

	/**
	 * @return array<string, array{0:string, 1:array{header:?string,footer:?string}}>
	 */
	public static function provider_extract_from_template_content(): array {
		return array(
			'standard header + footer (TT3/4/5 shape)' => array(
				'<!-- wp:template-part {"slug":"header","tagName":"header"} /-->' . "\n"
				. '<main></main>' . "\n"
				. '<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
				array(
					'header' => 'header',
					'footer' => 'footer',
				),
			),
			'variant slugs (bespoke theme with no plain header.html)' => array(
				'<!-- wp:template-part {"slug":"header-large-dark"} /-->' . "\n"
				. '<main></main>' . "\n"
				. '<!-- wp:template-part {"slug":"site-footer"} /-->',
				array(
					'header' => 'header-large-dark',
					'footer' => 'site-footer',
				),
			),
			'single template-part is treated as header-only, footer falls back' => array(
				'<!-- wp:template-part {"slug":"header"} /-->' . "\n"
				. '<main></main>',
				array(
					'header' => 'header',
					'footer' => null,
				),
			),
			'two template-parts with the same slug are preserved (deliberate theme choice, not dedup)' => array(
				'<!-- wp:template-part {"slug":"site-shell"} /-->' . "\n"
				. '<main></main>' . "\n"
				. '<!-- wp:template-part {"slug":"site-shell"} /-->',
				array(
					'header' => 'site-shell',
					'footer' => 'site-shell',
				),
			),
			'slug with unsafe characters is rejected (JSON round-trip guard in substitute_template_placeholders)' => array(
				'<!-- wp:template-part {"slug":"valid"} /-->' . "\n"
				. '<!-- wp:template-part {"slug":"has space"} /-->',
				array(
					'header' => 'valid',
					'footer' => null,
				),
			),
			'nested template-parts in a wrapper are ignored' => array(
				'<!-- wp:group --><div class="wp-block-group">'
				. '<!-- wp:template-part {"slug":"buried-header"} /-->'
				. '</div><!-- /wp:group -->',
				array(
					'header' => null,
					'footer' => null,
				),
			),
			'no template-parts at all yields nulls'    => array(
				'<main><p>No chrome here.</p></main>',
				array(
					'header' => null,
					'footer' => null,
				),
			),
			'empty markup yields nulls'                => array(
				'',
				array(
					'header' => null,
					'footer' => null,
				),
			),
		);
	}

	/** Resolver prefers search.html slugs when available. */
	public function test_resolve_prefers_search_template() {
		$cls = get_class(
			new class() extends Theme_Chrome_Slug_Resolver {
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					if ( 'search' === $template_name ) {
						return '<!-- wp:template-part {"slug":"header-large-dark"} /-->'
							. '<!-- wp:template-part {"slug":"footer"} /-->';
					}
					if ( 'index' === $template_name ) {
						return '<!-- wp:template-part {"slug":"index-header"} /-->'
							. '<!-- wp:template-part {"slug":"index-footer"} /-->';
					}
					return null;
				}
			}
		);
		$this->assertSame(
			array(
				'header' => 'header-large-dark',
				'footer' => 'footer',
			),
			$cls::resolve()
		);
	}

	/** Falls through to index.html when search.html is silent. */
	public function test_resolve_falls_back_to_index_template() {
		$cls = get_class(
			new class() extends Theme_Chrome_Slug_Resolver {
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					if ( 'index' === $template_name ) {
						return '<!-- wp:template-part {"slug":"index-header"} /-->'
							. '<!-- wp:template-part {"slug":"index-footer"} /-->';
					}
					return null;
				}
			}
		);
		$this->assertSame(
			array(
				'header' => 'index-header',
				'footer' => 'index-footer',
			),
			$cls::resolve()
		);
	}

	/** Hardcoded defaults are the last rung when nothing else resolves. */
	public function test_resolve_falls_back_to_defaults() {
		$cls = get_class(
			new class() extends Theme_Chrome_Slug_Resolver {
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					unset( $template_name );
					return null;
				}
				protected static function resolve_by_area(): array {
					return array(
						'header' => null,
						'footer' => null,
					);
				}
			}
		);
		$this->assertSame( Theme_Chrome_Slug_Resolver::DEFAULTS, $cls::resolve() );
	}

	/** Area-based fallback kicks in when both templates have no top-level template-parts. */
	public function test_resolve_uses_area_fallback_when_templates_silent() {
		$cls = get_class(
			new class() extends Theme_Chrome_Slug_Resolver {
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					unset( $template_name );
					return null;
				}
				protected static function resolve_by_area(): array {
					return array(
						'header' => 'site-header',
						'footer' => 'site-footer',
					);
				}
			}
		);
		$this->assertSame(
			array(
				'header' => 'site-header',
				'footer' => 'site-footer',
			),
			$cls::resolve()
		);
	}

	/** Per-slot fill: template provides header only, area fallback fills footer. */
	public function test_resolve_mixes_template_header_with_area_footer() {
		$cls = get_class(
			new class() extends Theme_Chrome_Slug_Resolver {
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					if ( 'search' === $template_name ) {
						return '<!-- wp:template-part {"slug":"hero-header"} /-->';
					}
					return null;
				}
				protected static function resolve_by_area(): array {
					return array(
						'header' => 'never-used',
						'footer' => 'site-footer',
					);
				}
			}
		);
		$this->assertSame(
			array(
				'header' => 'hero-header',
				'footer' => 'site-footer',
			),
			$cls::resolve()
		);
	}

	/** Cross-template fill: search.html has header, index.html supplies footer. */
	public function test_resolve_fills_footer_from_index_when_search_has_header_only() {
		$cls = get_class(
			new class() extends Theme_Chrome_Slug_Resolver {
				protected static function get_active_theme_template_content( string $template_name ): ?string {
					if ( 'search' === $template_name ) {
						return '<!-- wp:template-part {"slug":"search-header"} /-->';
					}
					if ( 'index' === $template_name ) {
						return '<!-- wp:template-part {"slug":"index-header"} /-->'
							. '<!-- wp:template-part {"slug":"index-footer"} /-->';
					}
					return null;
				}
				protected static function resolve_by_area(): array {
					// Should not be reached; both slots are filled by templates.
					return array(
						'header' => 'never-used',
						'footer' => 'never-used',
					);
				}
			}
		);
		$this->assertSame(
			array(
				'header' => 'search-header',
				'footer' => 'index-footer',
			),
			$cls::resolve()
		);
	}

	/** Alphabetical sort makes the area-pick deterministic across requests. */
	public function test_extract_from_parts_picks_alphabetical_first_per_area() {
		$parts = array(
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'header-small-dark',
				'area'  => 'header',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'header-large-dark',
				'area'  => 'header',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'header',
				'area'  => 'header',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'footer-newsletter',
				'area'  => 'footer',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'footer',
				'area'  => 'footer',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'sidebar',
				'area'  => 'uncategorized',
			),
		);
		$this->assertSame(
			array(
				'header' => 'header',
				'footer' => 'footer',
			),
			Theme_Chrome_Slug_Resolver::extract_from_parts( $parts, 'tt-bespoke' )
		);
	}

	/** Cross-theme + unsafe-slug filtering mirrors the template-content guard. */
	public function test_extract_from_parts_filters_by_theme_and_unsafe_slugs() {
		$parts = array(
			(object) array(
				'theme' => 'other-theme',
				'slug'  => 'header',
				'area'  => 'header',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'has space',
				'area'  => 'header',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => 'site-header',
				'area'  => 'header',
			),
			(object) array(
				'theme' => 'tt-bespoke',
				'slug'  => '',
				'area'  => 'footer',
			),
		);
		$this->assertSame(
			array(
				'header' => 'site-header',
				'footer' => null,
			),
			Theme_Chrome_Slug_Resolver::extract_from_parts( $parts, 'tt-bespoke' )
		);
	}
}
