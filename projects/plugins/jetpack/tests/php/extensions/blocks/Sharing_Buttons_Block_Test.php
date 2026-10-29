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
}
