<?php
/**
 * Sharing Buttons block render tests.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use function Automattic\Jetpack\Extensions\Sharing_Buttons\register_block;

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/sharing-buttons/sharing-buttons.php';

/**
 * @covers ::Automattic\Jetpack\Extensions\Sharing_Buttons\render_block_implementation
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Sharing_Buttons\render_block_implementation' )]
class Sharing_Buttons_Block_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	private const LIST_ID = 'jetpack-sharing-serivces-list';

	/**
	 * The first list rendered keeps save.jsx's id for site CSS; repeats must not reuse it.
	 *
	 * Isolated because the render remembers, per request, that the id was handed out.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_repeated_list_gets_its_own_id() {
		$this->assertFalse( function_exists( 'Automattic\Jetpack\Extensions\Sharing_Buttons\render_block_implementation' ) );
		register_block();
		add_filter( 'jetpack_is_frontend', '__return_true' );
		$block = '<!-- wp:jetpack/sharing-buttons --><ul class="wp-block-jetpack-sharing-buttons has-normal-icon-size jetpack-sharing-buttons__services-list" id="' . self::LIST_ID . '"></ul><!-- /wp:jetpack/sharing-buttons -->';

		$tags = new WP_HTML_Tag_Processor( do_blocks( $block . $block ) );
		$ids  = array();
		while ( $tags->next_tag( 'ul' ) ) {
			$ids[] = $tags->get_attribute( 'id' );
		}

		$this->assertCount( 2, $ids );
		$this->assertSame( self::LIST_ID, $ids[0] );
		$this->assertIsString( $ids[1] );
		$this->assertNotSame( self::LIST_ID, $ids[1] );
	}

	/**
	 * A theme's flex gap must not spread the buttons apart on the front end.
	 *
	 * The theme's `.is-layout-flex` gap has the same specificity as the block's
	 * stylesheet and loads after it, so the block's default gap has to come from
	 * global styles, after the theme's rule.
	 *
	 * Isolated because it registers the block and filters the theme's global styles.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_block_default_gap_overrides_theme_flex_gap() {
		register_block();
		add_filter(
			'wp_theme_json_data_theme',
			function ( $theme_json ) {
				return $theme_json->update_with(
					array(
						'version'  => 3,
						'settings' => array( 'spacing' => array( 'blockGap' => true ) ),
						'styles'   => array( 'spacing' => array( 'blockGap' => '1.2rem' ) ),
					)
				);
			}
		);
		wp_clean_theme_json_cache();

		$css = WP_Theme_JSON_Resolver::get_merged_data()->get_stylesheet( array( 'styles' ) );

		$this->assertSame( 1, preg_match( '/:where\(\.is-layout-flex\)\s*\{[^}]*gap:\s*1\.2rem/', $css, $theme_gap, PREG_OFFSET_CAPTURE ), 'Global styles have no theme flex gap rule.' );
		$this->assertSame( 1, preg_match( '/:where\(\.wp-block-jetpack-sharing-buttons-is-layout-flex\)\s*\{[^}]*gap:\s*0\s*[;}]/', $css, $block_gap, PREG_OFFSET_CAPTURE ), 'Global styles have no default gap rule for the block.' );
		$this->assertGreaterThan( $theme_gap[0][1], $block_gap[0][1], 'The block default gap must be printed after the theme flex gap.' );
	}
}
