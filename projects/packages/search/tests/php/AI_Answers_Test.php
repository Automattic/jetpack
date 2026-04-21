<?php
/**
 * Tests for the AI_Answers class.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;

/**
 * Unit tests for the AI_Answers class.
 */
class AI_Answers_Test extends Search_TestCase {
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		( new AI_Answers() )->init();
		do_action( 'init' );
	}

	public function test_behavior_cpt_registered() {
		$this->assertTrue( post_type_exists( AI_Answers::BEHAVIOR_CPT ) );
	}

	public function test_topic_cpt_registered() {
		$this->assertTrue( post_type_exists( AI_Answers::TOPIC_CPT ) );
	}

	public function test_cpts_are_private() {
		$behavior = get_post_type_object( AI_Answers::BEHAVIOR_CPT );
		$topic    = get_post_type_object( AI_Answers::TOPIC_CPT );
		$this->assertFalse( $behavior->public );
		$this->assertFalse( $topic->public );
	}

	public function test_cpts_show_in_rest() {
		$behavior = get_post_type_object( AI_Answers::BEHAVIOR_CPT );
		$topic    = get_post_type_object( AI_Answers::TOPIC_CPT );
		$this->assertTrue( $behavior->show_in_rest );
		$this->assertTrue( $topic->show_in_rest );
	}

	public function test_topic_postmeta_registered() {
		$registered = get_registered_meta_keys( 'post', AI_Answers::TOPIC_CPT );
		$this->assertArrayHasKey( '_jstopic_keywords', $registered );
		$this->assertArrayHasKey( '_jstopic_url', $registered );
	}
}
