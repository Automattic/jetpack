<?php
/**
 * AI Answer block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the ai-answer block's render template.
 *
 * Asserts that render output is independent of the site-wide
 * `jetpack_search_ai_answers_enabled` option (block presence in post
 * content is the opt-in signal — the option only governs the overlay),
 * and that the attribute-driven affordances (heading, citations region,
 * Show-more button) appear / disappear in the markup the way the
 * front-end consumer expects.
 */
class Ai_Answer_Render_Test extends TestCase {
	use Toggles_Ai_Master;

	/**
	 * Register the ai-answer block inline so `do_blocks()` can resolve it
	 * without depending on `build/` artifacts referenced by block.json.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			'jetpack-search/ai-answer',
			array(
				'attributes'      => array(
					'heading'        => array(
						'type'    => 'string',
						'default' => '',
					),
					'showCitations'  => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'enableShowMore' => array(
						'type'    => 'boolean',
						'default' => true,
					),
				),
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/ai-answer/render.php';
					return (string) ob_get_clean();
				},
				// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			)
		);
	}

	public static function tearDownAfterClass(): void {
		\unregister_block_type( 'jetpack-search/ai-answer' );
	}

	/**
	 * Seed a paid-plan option so the per-render paid-plan gate in
	 * `render.php` lets through; the assertions in this suite are about
	 * markup shape, not plan logic. The `supports_paid_search()` memo is
	 * cleared in setUp / tearDown so cases that explicitly hide the plan
	 * (`test_renders_nothing_without_paid_search_plan`) get a clean read.
	 */
	public function setUp(): void {
		parent::setUp();
		// Paid Search plan: `supports_instant_search: true` AND a
		// non-free product_slug. The slug matters because WPCOM also
		// reports `supports_instant_search: true` on the free plan, so
		// the gate combines both probes to rule it out.
		update_option(
			Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => true,
				'effective_subscription'  => array( 'product_slug' => 'jetpack_search' ),
			)
		);
		Search_Blocks::reset_supports_paid_search_cache();
	}

	public function tearDown(): void {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		// No per-test WorDBless reset in this plain-TestCase class, so clear the
		// option here too — a failed assertion must not leak it into later tests.
		delete_option( AI_Answers::ENABLED_OPTION );
		Search_Blocks::reset_supports_paid_search_cache();
		Constants::clear_single_constant( 'WP_AI_SUPPORT' );
		remove_filter( 'wp_supports_ai', '__return_false' );
		remove_filter( 'wp_supports_ai', '__return_true' );
		$this->remove_ai_master_filters();
		unset( $GLOBALS['jetpack_search_test_internal_env'] );
		parent::tearDown();
	}

	/**
	 * Set the host's AI support through whichever mechanism this WordPress has:
	 * core's wp_supports_ai() filter where the function exists, the raw
	 * WP_AI_SUPPORT constant on versions that predate it.
	 *
	 * @param bool $supported Whether the host supports AI.
	 */
	private function set_host_ai_support( bool $supported ): void {
		if ( function_exists( 'wp_supports_ai' ) ) {
			add_filter( 'wp_supports_ai', $supported ? '__return_true' : '__return_false' );
			return;
		}
		Constants::set_constant( 'WP_AI_SUPPORT', $supported );
	}

	/**
	 * Render the ai-answer block via `do_blocks()`.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks( '<!-- wp:jetpack-search/ai-answer ' . $json . ' /-->' );
	}

	public function test_renders_panel_wrapper_independent_of_site_option() {
		// The block is its own opt-in surface: presence of the block in
		// post content is the only switch. The site-wide AI Answers option
		// only governs the instant-search overlay; flipping it must not
		// affect the embedded block's render.
		update_option( 'jetpack_search_ai_answers_enabled', false );
		$markup_with_option_off = $this->render();
		delete_option( 'jetpack_search_ai_answers_enabled' );
		$markup_with_option_unset = $this->render();
		update_option( 'jetpack_search_ai_answers_enabled', true );
		$markup_with_option_on = $this->render();
		delete_option( 'jetpack_search_ai_answers_enabled' );

		foreach (
			array(
				'option off'   => $markup_with_option_off,
				'option unset' => $markup_with_option_unset,
				'option on'    => $markup_with_option_on,
			) as $label => $markup
		) {
			$this->assertStringContainsString(
				'jp-search-answers-panel',
				$markup,
				"Block wrapper should render with the site option $label."
			);
			$this->assertStringContainsString(
				'data-wp-interactive="jetpack-search"',
				$markup,
				"Interactivity directive should render with the site option $label."
			);
		}
	}

	public function test_default_heading_is_ai_answer() {
		$markup = $this->render();
		$this->assertStringContainsString( 'AI answer', $markup );
	}

	public function test_custom_heading_overrides_default() {
		$markup = $this->render( array( 'heading' => 'Quick summary' ) );
		$this->assertStringContainsString( 'Quick summary', $markup );
		$this->assertStringNotContainsString( '>AI answer<', $markup );
	}

	public function test_show_citations_true_renders_citations_list() {
		$markup = $this->render( array( 'showCitations' => true ) );
		$this->assertStringContainsString( 'jp-search-answers-panel__citations', $markup );
		$this->assertStringContainsString( 'data-wp-each-key="context.citation.key"', $markup );
		$this->assertStringNotContainsString( 'data-wp-key=', $markup );
	}

	public function test_show_citations_false_omits_citations_list() {
		$markup = $this->render( array( 'showCitations' => false ) );
		$this->assertStringNotContainsString( 'jp-search-answers-panel__citations', $markup );
	}

	public function test_enable_show_more_true_renders_button() {
		$markup = $this->render( array( 'enableShowMore' => true ) );
		$this->assertStringContainsString( 'jp-search-answers-panel__toggle', $markup );
		$this->assertStringContainsString( 'actions.showExtendedAiAnswer', $markup );
	}

	public function test_enable_show_more_false_omits_button() {
		$markup = $this->render( array( 'enableShowMore' => false ) );
		$this->assertStringNotContainsString( 'jp-search-answers-panel__toggle', $markup );
		$this->assertStringNotContainsString( 'showExtendedAiAnswer', $markup );
	}

	public function test_renders_nothing_without_paid_search_plan() {
		// Drop the plan and re-prime the memo: a no-plan site must not
		// emit the panel scaffold (no wrapper, no `data-wp-interactive`
		// hook). Mirrors how WordAds / Premium Content's render_callbacks
		// short-circuit when their plan check fails.
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		Search_Blocks::reset_supports_paid_search_cache();

		$markup = $this->render();

		$this->assertStringNotContainsString( 'jp-search-answers-panel', $markup );
		$this->assertStringNotContainsString( 'data-wp-interactive', $markup );
	}

	public function test_renders_nothing_on_free_search_plan() {
		// WPCOM reports `supports_instant_search: true` on the free
		// Search plan too, so the gate has to combine that probe with
		// the product_slug check. This case exercises that second probe.
		update_option(
			Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => true,
				'effective_subscription'  => array( 'product_slug' => Plan::JETPACK_SEARCH_FREE_PRODUCT_SLUG ),
			)
		);
		Search_Blocks::reset_supports_paid_search_cache();

		$markup = $this->render();

		$this->assertStringNotContainsString( 'jp-search-answers-panel', $markup );
		$this->assertStringNotContainsString( 'data-wp-interactive', $markup );
	}

	public function test_renders_nothing_when_ai_master_is_off() {
		// Paid plan, but the site-wide Jetpack AI master switch is off: the
		// block must emit nothing, same as a failed plan check — the master
		// is a site-wide off switch, not a preference the block may ignore.
		$this->turn_ai_master_off();

		$markup = $this->render();

		$this->assertStringNotContainsString( 'jp-search-answers-panel', $markup );
		$this->assertStringNotContainsString( 'data-wp-interactive', $markup );
	}

	public function test_renders_with_the_master_on_independent_of_site_option() {
		// The contract's Search row: with the master on, the site option only
		// governs the overlay — the embedded block renders either way.
		$this->turn_ai_master_on();

		update_option( 'jetpack_search_ai_answers_enabled', false );
		$markup_with_option_off = $this->render();
		update_option( 'jetpack_search_ai_answers_enabled', true );
		$markup_with_option_on = $this->render();
		delete_option( 'jetpack_search_ai_answers_enabled' );

		foreach (
			array(
				'option off' => $markup_with_option_off,
				'option on'  => $markup_with_option_on,
			) as $label => $markup
		) {
			$this->assertStringContainsString(
				'jp-search-answers-panel',
				$markup,
				"Block wrapper should render with the master on and the site option $label."
			);
		}
	}

	public function test_renders_nothing_when_the_host_disables_ai() {
		// The host owner's AI opt-out (WP_AI_SUPPORT / wp_supports_ai()) already
		// suppresses the overlay; the block must give the same answer.
		$this->set_host_ai_support( false );

		$markup = $this->render();

		$this->assertStringNotContainsString( 'jp-search-answers-panel', $markup );
		$this->assertStringNotContainsString( 'data-wp-interactive', $markup );
	}

	public function test_renders_when_ai_master_is_on() {
		$this->turn_ai_master_on();

		$markup = $this->render();

		$this->assertStringContainsString( 'jp-search-answers-panel', $markup );
		$this->assertStringContainsString( 'data-wp-interactive="jetpack-search"', $markup );
	}

	public function test_renders_when_master_is_off_outside_internal_testing_environments() {
		// The master switch UI ships internal-only for now, so on a public site
		// the front-end gate must stay inert: even with the master off, the
		// block keeps rendering. If the rollout scoping ever moves out of
		// `should_enforce_master()`, this pin has to change deliberately with it.
		$this->turn_ai_master_off();
		$GLOBALS['jetpack_search_test_internal_env'] = false;

		$markup = $this->render();

		$this->assertStringContainsString( 'jp-search-answers-panel', $markup );
		$this->assertStringContainsString( 'data-wp-interactive="jetpack-search"', $markup );
	}

	public function test_renders_when_ai_module_is_not_registered() {
		// Standalone Jetpack Search: no Jetpack plugin, so the `ai` module —
		// and with it the master switch — was never installed. Those sites
		// must keep rendering the block.
		$markup = $this->render();

		$this->assertStringContainsString( 'jp-search-answers-panel', $markup );
		$this->assertStringContainsString( 'data-wp-interactive="jetpack-search"', $markup );
	}

	public function test_renders_when_the_host_allows_ai() {
		$this->set_host_ai_support( true );

		$markup = $this->render();

		$this->assertStringContainsString( 'jp-search-answers-panel', $markup );
	}

	public function test_panel_is_hidden_until_status_changes() {
		$markup = $this->render();
		// The panel binds to `state.aiPanelHidden` and also carries the bare
		// `hidden` attribute so server-rendered visitors never see the
		// scaffold before hydration.
		$this->assertStringContainsString( 'data-wp-bind--hidden="state.aiPanelHidden"', $markup );
		$this->assertMatchesRegularExpression(
			'/aria-live="polite"\s+hidden\s*>/',
			$markup,
			'Expected the rendered wrapper to carry a bare `hidden` attribute right after `aria-live="polite"`.'
		);
	}
}
