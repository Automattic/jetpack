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

	protected function setUp(): void {
		parent::setUp();
		delete_option( Theme_Chrome_Slug_Resolver::OPTION_NAME );
		unset( $_GET['wp_theme_preview'] );
	}

	protected function tearDown(): void {
		delete_option( Theme_Chrome_Slug_Resolver::OPTION_NAME );
		unset( $_GET['wp_theme_preview'] );
		parent::tearDown();
	}

	/**
	 * Pure extractor coverage.
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
	 * Extractor fixtures.
	 *
	 * @return array<string, array{0:string, 1:array{header:?string,footer:?string}}>
	 */
	public static function provider_extract_from_template_content(): array {
		return array(
			'Standard header + footer (TT3/4/5)'           => array(
				'<!-- wp:template-part {"slug":"header","tagName":"header"} /-->' . "\n"
				. '<main></main>' . "\n"
				. '<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->',
				array(
					'header' => 'header',
					'footer' => 'footer',
				),
			),
			'Variant slugs (career-development)'           => array(
				'<!-- wp:template-part {"slug":"main-header","theme":"career-development","tagName":"header"} /-->' . "\n"
				. '<main></main>' . "\n"
				. '<!-- wp:template-part {"slug":"footer-columns","theme":"career-development","tagName":"footer"} /-->',
				array(
					'header' => 'main-header',
					'footer' => 'footer-columns',
				),
			),
			'Single template-part is header-only'          => array(
				'<!-- wp:template-part {"slug":"header"} /-->' . "\n"
				. '<main></main>',
				array(
					'header' => 'header',
					'footer' => null,
				),
			),
			'Two template-parts sharing a slug are preserved' => array(
				'<!-- wp:template-part {"slug":"site-shell"} /-->' . "\n"
				. '<main></main>' . "\n"
				. '<!-- wp:template-part {"slug":"site-shell"} /-->',
				array(
					'header' => 'site-shell',
					'footer' => 'site-shell',
				),
			),
			'Unsafe slug rejected (JSON round-trip guard)' => array(
				'<!-- wp:template-part {"slug":"valid"} /-->' . "\n"
				. '<!-- wp:template-part {"slug":"has space"} /-->',
				array(
					'header' => 'valid',
					'footer' => null,
				),
			),
			'wp:pattern wrap (Ollie shape) yields nulls'   => array(
				'<!-- wp:pattern {"slug":"ollie/template-page-search"} /-->',
				array(
					'header' => null,
					'footer' => null,
				),
			),
			'Nested template-parts in a wrapper are ignored' => array(
				'<!-- wp:group --><div class="wp-block-group">'
				. '<!-- wp:template-part {"slug":"buried-header"} /-->'
				. '</div><!-- /wp:group -->',
				array(
					'header' => null,
					'footer' => null,
				),
			),
			'Empty markup yields nulls'                    => array(
				'',
				array(
					'header' => null,
					'footer' => null,
				),
			),
		);
	}

	/** Search.html wins when it declares both slots. */
	public function test_resolve_prefers_search_template() {
		$cls = static::stub_with_templates(
			array( 'search' => '<!-- wp:template-part {"slug":"main-header"} /--><!-- wp:template-part {"slug":"footer-columns"} /-->' )
		);
		$this->assertSame(
			array(
				'header' => 'main-header',
				'footer' => 'footer-columns',
			),
			$cls::resolve()
		);
	}

	/** Falls through to index.html when search.html is silent. */
	public function test_resolve_falls_back_to_index_template() {
		$cls = static::stub_with_templates(
			array( 'index' => '<!-- wp:template-part {"slug":"site-header"} /--><!-- wp:template-part {"slug":"site-footer"} /-->' )
		);
		$this->assertSame(
			array(
				'header' => 'site-header',
				'footer' => 'site-footer',
			),
			$cls::resolve()
		);
	}

	/** Per-slot mix: search.html supplies header, index.html supplies footer. */
	public function test_resolve_per_slot_mix_across_search_and_index() {
		$cls = static::stub_with_templates(
			array(
				'search' => '<!-- wp:template-part {"slug":"search-header"} /-->',
				'index'  => '<!-- wp:template-part {"slug":"index-header"} /--><!-- wp:template-part {"slug":"index-footer"} /-->',
			)
		);
		$this->assertSame(
			array(
				'header' => 'search-header',
				'footer' => 'index-footer',
			),
			$cls::resolve()
		);
	}

	/** Both templates silent → hardcoded defaults. */
	public function test_resolve_falls_back_to_defaults_when_nothing_resolves() {
		$cls = static::stub_with_templates( array() );
		$this->assertSame( Theme_Chrome_Slug_Resolver::DEFAULTS, $cls::resolve() );
	}

	/** First resolve() writes the option; second reads from it (cache hit). */
	public function test_resolve_writes_option_cache_on_first_call() {
		$cls   = static::stub_with_templates(
			array( 'search' => '<!-- wp:template-part {"slug":"main-header"} /--><!-- wp:template-part {"slug":"footer-columns"} /-->' )
		);
		$first = $cls::resolve();

		$option = get_option( Theme_Chrome_Slug_Resolver::OPTION_NAME );
		$this->assertIsArray( $option );
		$this->assertSame( (string) get_stylesheet(), $option['stylesheet'] );
		$this->assertSame( 'main-header', $option['header'] );
		$this->assertSame( 'footer-columns', $option['footer'] );

		// A second resolve() with the cache present should return the same shape.
		$this->assertSame( $first, $cls::resolve() );
	}

	/** Cached entry from a different stylesheet is treated as a miss. */
	public function test_cached_entry_for_other_stylesheet_is_ignored() {
		update_option(
			Theme_Chrome_Slug_Resolver::OPTION_NAME,
			array(
				'stylesheet' => 'other-theme',
				'header'     => 'stale-header',
				'footer'     => 'stale-footer',
			),
			false
		);
		$cls    = static::stub_with_templates(
			array( 'search' => '<!-- wp:template-part {"slug":"new-header"} /--><!-- wp:template-part {"slug":"new-footer"} /-->' )
		);
		$result = $cls::resolve();
		$this->assertSame( 'new-header', $result['header'] );
		$this->assertSame( 'new-footer', $result['footer'] );
	}

	/** Invalidate() removes the option. */
	public function test_invalidate_removes_the_option() {
		update_option(
			Theme_Chrome_Slug_Resolver::OPTION_NAME,
			array(
				'stylesheet' => (string) get_stylesheet(),
				'header'     => 'h',
				'footer'     => 'f',
			),
			false
		);
		Theme_Chrome_Slug_Resolver::invalidate();
		$this->assertFalse( get_option( Theme_Chrome_Slug_Resolver::OPTION_NAME ) );
	}

	/** Preview requests bypass cache reads AND skip writes. */
	public function test_preview_skips_cache_read_and_write() {
		$cached_option = array(
			'stylesheet' => (string) get_stylesheet(),
			'header'     => 'cached-header',
			'footer'     => 'cached-footer',
		);
		update_option( Theme_Chrome_Slug_Resolver::OPTION_NAME, $cached_option, false );

		$_GET['wp_theme_preview'] = 'some-preview-theme';
		$cls                      = static::stub_with_templates(
			array( 'search' => '<!-- wp:template-part {"slug":"preview-header"} /--><!-- wp:template-part {"slug":"preview-footer"} /-->' )
		);
		$result                   = $cls::resolve();

		$this->assertSame( 'preview-header', $result['header'], 'preview must not read from cache' );
		$this->assertSame( 'preview-footer', $result['footer'] );
		$this->assertSame( $cached_option, get_option( Theme_Chrome_Slug_Resolver::OPTION_NAME ), 'preview must not overwrite cache' );
	}

	/**
	 * Save_post_wp_template handler: only invalidates when the saved
	 * Template is `search` or `index` on the active theme.
	 */
	public function test_maybe_invalidate_on_template_save_ignores_unrelated_templates() {
		update_option(
			Theme_Chrome_Slug_Resolver::OPTION_NAME,
			array(
				'stylesheet' => (string) get_stylesheet(),
				'header'     => 'h',
				'footer'     => 'f',
			),
			false
		);
		Theme_Chrome_Slug_Resolver::maybe_invalidate_on_template_save( 0, new \WP_Post( (object) array( 'post_name' => 'single' ) ) );
		$this->assertNotFalse(
			get_option( Theme_Chrome_Slug_Resolver::OPTION_NAME ),
			'unrelated template save must not invalidate the cache'
		);
	}

	/** Register_hooks() wires the three invalidation actions. */
	public function test_register_hooks_wires_invalidation_actions() {
		remove_action( 'switch_theme', array( Theme_Chrome_Slug_Resolver::class, 'invalidate' ) );
		remove_action( 'save_post_wp_template', array( Theme_Chrome_Slug_Resolver::class, 'maybe_invalidate_on_template_save' ) );
		remove_action( 'save_post_wp_template_part', array( Theme_Chrome_Slug_Resolver::class, 'invalidate' ) );

		Theme_Chrome_Slug_Resolver::register_hooks();

		$this->assertNotFalse( has_action( 'switch_theme', array( Theme_Chrome_Slug_Resolver::class, 'invalidate' ) ) );
		$this->assertNotFalse( has_action( 'save_post_wp_template', array( Theme_Chrome_Slug_Resolver::class, 'maybe_invalidate_on_template_save' ) ) );
		$this->assertNotFalse( has_action( 'save_post_wp_template_part', array( Theme_Chrome_Slug_Resolver::class, 'invalidate' ) ) );
	}

	/**
	 * Build an anonymous Theme_Chrome_Slug_Resolver subclass whose
	 * `get_active_theme_template_content()` returns canned markup from
	 * The given map (keyed by `search` / `index`). Each test gets its
	 * Own subclass so stubs don't leak.
	 *
	 * @param array<string,string> $templates Map of template_name => markup.
	 * @return class-string<Theme_Chrome_Slug_Resolver>
	 */
	protected static function stub_with_templates( array $templates ): string {
		return get_class(
			new class( $templates ) extends Theme_Chrome_Slug_Resolver {
				/** @var array<string,string> */
				private static $stub_templates = array();

				public function __construct( array $templates ) {
					self::$stub_templates = $templates;
				}

				protected static function get_active_theme_template_content( string $template_name ): ?string {
					return self::$stub_templates[ $template_name ] ?? null;
				}
			}
		);
	}
}
