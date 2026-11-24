<?php
/**
 * Tests for the engine with more than one handler.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Post_Fields_Handler;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposals;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/class-stub-option-handler.php';

/**
 * Typed items and cross-type stale marking.
 *
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Proposals\Proposals
 */
#[CoversClass( Proposals::class )]
class Proposals_Handlers_Test extends Proposals_TestCase {

	/**
	 * The stub handler instance the engine uses.
	 *
	 * @var Stub_Option_Handler
	 */
	private $stub;

	/**
	 * Register the stub handler next to the built-in one.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->stub = new Stub_Option_Handler();
		$stub       = $this->stub;
		add_filter(
			'jetpack_proposals_handlers',
			static function ( $handlers ) use ( $stub ) {
				$handlers[ Stub_Option_Handler::TYPE ] = $stub;
				return $handlers;
			}
		);
	}

	/**
	 * Remove stub options.
	 */
	protected function tearDown(): void {
		global $wpdb;
		$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE 'stub\_%'" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		wp_cache_flush();
		parent::tearDown();
	}

	/**
	 * A stub request.
	 *
	 * @param string $key   Option key.
	 * @param array  $extra Other request fields.
	 */
	private static function stub( string $key, array $extra = array() ): array {
		return array(
			'type'  => Stub_Option_Handler::TYPE,
			'key'   => $key,
			'value' => 'new-' . $key,
		) + $extra;
	}

	public function test_items_of_different_types_validate_and_apply_through_their_own_handlers(): void {
		$page_id  = $this->create_post();
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $page_id,
					'title'   => 'Proposed',
				),
				self::stub( 'colour' ),
			)
		);

		$this->assertSame( array( Post_Fields_Handler::TYPE, Stub_Option_Handler::TYPE ), array_column( $this->stored( $proposal['id'] )['items'], 'type' ) );
		$result = Proposals::apply( $proposal['id'], $proposal['hash'] );

		$this->assert_not_wp_error( $result );
		$this->assertSame( array( 'i1', 'i2' ), array_column( $result['results'], 'item' ) );
		$this->assertSame( 'Proposed', get_post( $page_id )->post_title );
		$this->assertSame( 'new-colour', get_option( 'stub_colour' ) );
	}

	public function test_a_stored_item_its_handler_rejects_empties_the_whole_proposal(): void {
		$proposal                            = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Proposed',
				),
				self::stub( 'colour' ),
			)
		);
		$payload                             = json_decode( get_post( $proposal['id'] )->post_content, true );
		$payload['items'][1]['change']['to'] = array( 'not', 'a', 'string' );
		$this->write_payload_directly( $proposal['id'], (string) wp_json_encode( $payload, JSON_UNESCAPED_SLASHES ) );

		$this->assertSame( array(), $this->stored( $proposal['id'] )['items'] );
	}

	public function test_applying_marks_overlapping_proposals_of_another_type_stale(): void {
		$first  = $this->create_proposal( array( self::stub( 'colour' ) ) );
		$second = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Unrelated',
				),
				self::stub( 'colour', array( 'value' => 'other' ) ),
			)
		);

		$this->assert_not_wp_error( Proposals::apply( $first['id'], $first['hash'] ) );

		$this->assertSame( 'stale', $this->stored( $second['id'] )['status'] );
	}

	public function test_reviewing_needs_every_handler_to_agree(): void {
		$proposal = $this->create_proposal(
			array(
				array(
					'post_id' => $this->create_post(),
					'title'   => 'Proposed',
				),
				self::stub( 'colour' ),
			)
		);
		wp_set_current_user( $this->user( 'editor' ) );

		$this->assertTrue( current_user_can( 'edit_post', $proposal['items'][0]['target']['post_id'] ) );
		$this->assertFalse( Proposals::current_user_can_review( $proposal ), 'An editor lacks manage_options for the stub item.' );
	}
}
