<?php

require_once __DIR__ . '/trait.http-request-cache.php';

class WP_Test_Jetpack_Shortcodes_Quiz extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Verify that [quiz] exists.
	 *
	 * @since  4.5.0
	 */
	public function test_shortcodes_quiz_exists() {
		$this->assertEquals( shortcode_exists( 'quiz' ), true );
	}

	/**
	 * Verify that calling shortcode doesn't return the same content and since it doesn't have content, return nothing.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_quiz() {
		$content = '[quiz][/quiz]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
		$this->assertSame( '', $shortcode_content );
	}

	/**
	 * Verify [quiz] writes the correct track id when passed as attribute.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_quiz_id() {
		$shortcode_content = do_shortcode( '[quiz trackid="the-quiz"][question]What is the right answer?[/question][/quiz]' );
		$this->assertEquals( '<div class="jetpack-quiz quiz" data-trackid="the-quiz"><div class="jetpack-quiz-question question" tabindex="-1">What is the right answer?</div></div>', $shortcode_content );
	}

	/**
	 * Verify that a [question] is not rendered when they're outside a [quiz].
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_question() {
		$shortcode_content = do_shortcode( '[question]What is the right answer?[/question]' );
		$this->assertSame( '', $shortcode_content );

		$shortcode_content = do_shortcode( '[quiz][question]What is the right answer?[/question][/quiz]' );
		$this->assertEquals( '<div class="jetpack-quiz quiz"><div class="jetpack-quiz-question question" tabindex="-1">What is the right answer?</div></div>', $shortcode_content );
	}

	/**
	 * Verify that an [answer] is not rendered when they're outside a [quiz].
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_answer() {
		$shortcode_content = do_shortcode( '[answer]This is the right answer![/answer]' );
		$this->assertSame( '', $shortcode_content );

		$shortcode_content = do_shortcode( '[quiz][answer]This is the right answer![/answer][/quiz]' );
		$this->assertEquals( '<div class="jetpack-quiz quiz"><div class="jetpack-quiz-answer answer" data-correct="1">This is the right answer!</div></div>', $shortcode_content );
	}

	/**
	 * Verify that a [wrong] is not rendered when they're outside a [quiz].
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_wrong() {
		$shortcode_content = do_shortcode( '[wrong]This is so wrong...[/wrong]' );
		$this->assertSame( '', $shortcode_content );

		$shortcode_content = do_shortcode( '[quiz][wrong]This is so wrong...[/wrong][/quiz]' );
		$this->assertEquals( '<div class="jetpack-quiz quiz"><div class="jetpack-quiz-answer answer">This is so wrong...</div></div>', $shortcode_content );
	}

	/**
	 * Verify that a [explanation] is not rendered when they're outside a [quiz].
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_explanation() {
		$shortcode_content = do_shortcode( '[explanation]This is why this is right or wrong.[/explanation]' );
		$this->assertSame( '', $shortcode_content );

		$shortcode_content = do_shortcode( '[quiz][explanation]This is why this is right or wrong.[/explanation][/quiz]' );
		$this->assertEquals( '<div class="jetpack-quiz quiz"><div class="jetpack-quiz-explanation explanation">This is why this is right or wrong.</div></div>', $shortcode_content );
	}

	/**
	 * Verify the shortcode renders correctly when it's correctly written.
	 *
	 * @since 4.5.0
	 */
	public function test_shortcodes_complete() {
		$shortcode_content = do_shortcode( '[quiz][question]What is the right answer?[/question][wrong]This is so wrong...[explanation]This is why this is wrong.[/explanation][/wrong][answer]Yes, this is right![explanation]Yay![/explanation][/answer][/quiz]' );
		$this->assertEquals( '<div class="jetpack-quiz quiz"><div class="jetpack-quiz-question question" tabindex="-1">What is the right answer?</div><div class="jetpack-quiz-answer answer">This is so wrong...<div class="jetpack-quiz-explanation explanation">This is why this is wrong.</div></div><div class="jetpack-quiz-answer answer" data-correct="1">Yes, this is right!<div class="jetpack-quiz-explanation explanation">Yay!</div></div></div>', $shortcode_content );
	}

}
