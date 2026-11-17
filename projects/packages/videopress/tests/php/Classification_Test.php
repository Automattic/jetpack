<?php
/**
 * Tests for the VideoPress classification service.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Channel;
use Automattic\Jetpack\VideoPress\Classification;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Test suite for Classification.
 */
class Classification_Test extends BaseTestCase {

	/**
	 * Register the taxonomies as an editor would see them.
	 */
	protected function set_up() {
		Classification::register();
		$editor = wp_insert_user(
			array(
				'user_login' => 'editor',
				'user_pass'  => 'pass',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $editor );
	}

	/**
	 * A VideoPress attachment.
	 *
	 * @param string $guid VideoPress GUID; empty for a plain attachment.
	 * @return int Attachment ID.
	 */
	private function video( $guid = 'abcd1234' ) {
		$id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => $guid ? Channel::MIME_TYPE : 'image/png',
			)
		);
		if ( $guid ) {
			update_post_meta( $id, 'videopress_guid', $guid );
		}
		return $id;
	}

	public function test_registers_local_attachment_taxonomies() {
		foreach ( array_keys( Classification::taxonomies() ) as $taxonomy ) {
			$object = get_taxonomy( $taxonomy );
			$this->assertSame( array( 'attachment' ), $object->object_type );
			$this->assertFalse( $object->show_in_rest, 'Generic term counts would leak hidden videos.' );
			$this->assertFalse( Classification::keep_local( true, $taxonomy ) );
		}
		$this->assertTrue( is_taxonomy_hierarchical( Classification::SERIES ) );
		$this->assertTrue( Classification::keep_local( true, 'category' ) );
	}

	public function test_tax_query_ands_dimensions_and_ors_values() {
		$query = Classification::tax_query(
			array(
				Classification::PERSON => 'Ana,bob,ana',
				Classification::SERIES => array( 'meetup-2026' ),
				'category'             => array( 'news' ),
				Classification::TOPIC  => array(),
			)
		);

		$this->assertSame( 'AND', $query['relation'] );
		$this->assertCount( 3, $query );
		$this->assertSame( Classification::SERIES, $query[0]['taxonomy'] );
		$this->assertTrue( $query[0]['include_children'], 'A parent series matches its child events.' );
		$this->assertSame( array( 'ana', 'bob' ), $query[1]['terms'] );
		$this->assertSame( 'IN', $query[1]['operator'] );
		$this->assertSame( array(), Classification::tax_query( array( 'category' => 'news' ) ) );
	}

	/**
	 * Requests rejected before any term is written.
	 *
	 * @return array[]
	 */
	public static function invalid_assignments() {
		return array(
			'not a VideoPress video' => array( '', array(), null, 'videopress_classification_not_found' ),
			'unknown taxonomy'       => array( 'abcd1234', array( 'category' => array( 1 ) ), null, 'videopress_classification_invalid' ),
			'non-numeric term ID'    => array( 'abcd1234', array( Classification::TOPIC => array( '1 OR 1' ) ), null, 'videopress_classification_invalid' ),
			'missing term'           => array( 'abcd1234', array( Classification::TOPIC => array( 999 ) ), null, 'videopress_classification_invalid' ),
			'stale version'          => array( 'abcd1234', array(), 3, 'videopress_classification_conflict' ),
		);
	}

	/**
	 * Invalid requests fail with a specific error and leave the version alone.
	 *
	 * @param string   $guid    GUID of the attachment.
	 * @param array    $terms   Requested terms.
	 * @param int|null $version Version precondition.
	 * @param string   $code    Expected error code.
	 * @dataProvider invalid_assignments
	 */
	#[DataProvider( 'invalid_assignments' )]
	public function test_invalid_assignments_change_nothing( $guid, $terms, $version, $code ) {
		$id     = $this->video( $guid );
		$result = Classification::set_assignments( $id, $terms, $version );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( $code, $result->get_error_code() );
		$this->assertSame( 0, Classification::version( $id ) );
	}

	public function test_subscribers_cannot_classify() {
		$id = $this->video();
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'reader',
					'user_pass'  => 'pass',
					'role'       => 'subscriber',
				)
			)
		);

		$result = Classification::set_assignments( $id, array( Classification::TOPIC => array() ) );

		$this->assertSame( 'videopress_classification_forbidden', $result->get_error_code() );
		$this->assertFalse( Classification::rest_can_read_vocabularies() );
	}

	public function test_an_empty_list_clears_and_bumps_the_version() {
		$id     = $this->video();
		$result = Classification::set_assignments( $id, array( Classification::TOPIC => array() ), 0 );

		$this->assertSame( 1, $result['version'] );
		$this->assertSame( array(), $result['terms'][ Classification::TOPIC ] );
		$this->assertSame( 'videopress_classification_conflict', Classification::set_assignments( $id, array(), 0 )->get_error_code() );
	}
}
