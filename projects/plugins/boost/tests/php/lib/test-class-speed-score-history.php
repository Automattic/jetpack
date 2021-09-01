<?php
//phpcs:ignoreFile
namespace Automattic\Jetpack_Boost\Tests\Lib;

use Automattic\Jetpack_Boost\Lib\Speed_Score_History;
use Automattic\Jetpack_Boost\Tests\Base_Test_Case;
use Brain\Monkey\Functions;

/**
 * Class WP_Test_Speed_Score_History
 *
 * @package Automattic\Jetpack_Boost\Tests\Lib
 */
class WP_Test_Speed_Score_History extends Base_Test_Case {
	/**
	 * @var Speed_Score_History
	 */
	public $history;
	public $data;

	/**
	 * Set up initial test data
	 */
	protected function set_up() {
		parent::set_up();

		$this->data = array();

		Functions\when( 'get_option' )->alias(
			function () {
				return $this->data;
			}
		);

		Functions\when( 'update_option' )->alias(
			function ( $option_name, $data ) {
				$this->data = $data;
			}
		);

		$this->history = new Speed_Score_History( 'http://example.com' );

		for ( $i = 0; $i < Speed_Score_History::LIMIT; $i ++ ) {
			$this->history->push(
				array(
					'timestamp' => time() - $i * 100,
					'scores'    => (object) array(
						'mobile'  => rand( 0, 100 ),
						'desktop' => rand( 0, 100 ),
					),
				)
			);
		}

		$this->history->push(
			array(
				'timestamp' => time() - 50,
				'scores'    => (object) array(
					'mobile'  => 20,
					'desktop' => 25,
				),
			)
		);

		$this->history->push(
			array(
				'timestamp' => time() - 1000,
				'scores'    => (object) array(
					'mobile'  => 30,
					'desktop' => 35,
				),
			)
		);
	}

	/**
	 * Test if the history is limited to 20 entries
	 */
	public function test_history_is_limited() {
		$this->assertTrue( $this->history->count() === 20 );
	}

	/**
	 * Test if we can accessing latest score by offset works.
	 */
	public function test_receiving_latest_by_offset() {
		$this->assertEquals( 20, $this->history->latest( 1 )['scores']->mobile );
		$this->assertEquals( 25, $this->history->latest( 1 )['scores']->desktop );

		$this->assertEquals( 30, $this->history->latest()['scores']->mobile );
		$this->assertEquals( 35, $this->history->latest()['scores']->desktop );
	}
}
