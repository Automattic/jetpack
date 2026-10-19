<?php
/**
 * Tests for the Sharing Buttons and Like block placement options.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Hooked_Blocks;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Hooked_Blocks\Template_Placements
 */
#[CoversClass( Template_Placements::class )]
class Template_Placements_Test extends BaseTestCase {

	/**
	 * Drop both options.
	 */
	public function tear_down() {
		foreach ( Template_Placements::OPTIONS as $option ) {
			delete_option( $option );
		}

		parent::tear_down();
	}

	/**
	 * @return array<string, array{0: string, 1: mixed, 2: string[]}>
	 */
	public static function provide_stored_values(): array {
		return array(
			'never saved'                             => array( Template_Placements::FEATURE_SHARING, null, array() ),
			// The option's earlier boolean form, which meant "after the content".
			'legacy Sharing boolean'                  => array( Template_Placements::FEATURE_SHARING, true, array( 'after_content' ) ),
			'legacy Sharing string'                   => array( Template_Placements::FEATURE_SHARING, '1', array( 'after_content' ) ),
			'legacy Sharing falsy'                    => array( Template_Placements::FEATURE_SHARING, '0', array() ),
			'Likes scalar, which never had a meaning' => array( Template_Placements::FEATURE_LIKES, '1', array() ),
			'unknown values and duplicates'           => array( Template_Placements::FEATURE_LIKES, array( 'post_lists', 1, array( 'before_content' ), 'before_content', 'before_content' ), array( 'before_content' ) ),
			// Core would only insert the block before the content.
			'both sides of the content'               => array( Template_Placements::FEATURE_LIKES, array( 'before_content', 'after_content' ), array( 'after_content' ) ),
		);
	}

	/**
	 * @dataProvider provide_stored_values
	 *
	 * @param string   $feature  Feature to read.
	 * @param mixed    $stored   Option value, or null for none.
	 * @param string[] $expected Placements read back.
	 */
	#[DataProvider( 'provide_stored_values' )]
	public function test_reads_known_placements_only( string $feature, $stored, array $expected ): void {
		if ( null !== $stored ) {
			update_option( Template_Placements::OPTIONS[ $feature ], $stored );
		}

		$this->assertSame( $expected, Template_Placements::get( $feature ) );
	}

	public function test_saves_known_placements_once_on_one_side_of_the_content(): void {
		$saved = Template_Placements::update( Template_Placements::FEATURE_SHARING, array( 'after_content', 'bogus', 'before_content', 'after_content' ) );

		$this->assertSame( array( 'after_content' ), $saved );
		$this->assertSame( $saved, get_option( 'jetpack_sharing_buttons_auto_add' ) );
	}

	/**
	 * Left in place, the legacy boolean would still read as "after the content".
	 */
	public function test_saving_no_placements_replaces_a_legacy_boolean(): void {
		update_option( 'jetpack_sharing_buttons_auto_add', true );

		Template_Placements::update( Template_Placements::FEATURE_SHARING, array() );

		$this->assertSame( array(), Template_Placements::get( Template_Placements::FEATURE_SHARING ) );
	}
}
