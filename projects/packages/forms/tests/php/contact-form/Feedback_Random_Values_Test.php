<?php
/**
 * Randomized tests for submitted values.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Seeded random values must reach every consumer as plain text.
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Feedback
 * @covers \Automattic\Jetpack\Forms\ContactForm\Contact_Form
 */
#[CoversClass( Feedback::class )]
#[CoversClass( Contact_Form::class )]
class Feedback_Random_Values_Test extends BaseTestCase {

	/**
	 * Marker carried by every attribute the generator writes, so the email check can tell
	 * submitted markup from the template's own.
	 */
	const MARKER = 'zq9';

	/**
	 * Building blocks for random noise.
	 */
	const PIECES = array( '<', '>', '!', '--', '-', '/', ' ', "\t", "\n", "\r", "\x0b", "\x0c", "\x00", "\x01", "\x1f", '\\', '"', "'", '=', '&', ';', '#', '60', 'lt', 'x3c', '%3C', '&lt;', '&#60;', '<!--', '-->', 'a', 'b', 'img', "\xc2\xa0", "\xe2\x80\xa8" );

	/**
	 * Characters that may follow a less-than sign.
	 */
	const SEPARATORS = array( '', ' ', "\t", "\n", "\r", "\x0b", "\x0c", "\x00", "\x01", '\\', '/', ' /' );

	/**
	 * What may follow the separators.
	 */
	const TAILS = array( '!-- zq9 -->', '!-- zq9 {"a":1} /-->', 'a href=zq9>x', 'img src=zq9>', 'b title=zq9>x', 'script title=zq9>', 'A HREF=zq9>', '/a>', '!DOCTYPE x>' );

	/**
	 * The page the forms are submitted from.
	 *
	 * @var \WP_Post
	 */
	private $source_post;

	/**
	 * Set up a page to submit from.
	 */
	public function set_up() {
		parent::set_up();

		$_SERVER['REMOTE_ADDR']     = '127.0.0.1';
		$_SERVER['HTTP_USER_AGENT'] = 'unit-test';
		$_SERVER['HTTP_REFERER']    = 'test';

		$author_id         = wp_insert_user(
			array(
				'user_email' => 'random@example.com',
				'user_login' => 'random_values',
				'user_pass'  => 'abc123',
				'role'       => 'author',
			)
		);
		$this->source_post = get_post(
			wp_insert_post(
				array(
					'post_title'   => 'abc',
					'post_content' => 'def',
					'post_status'  => 'draft',
					'post_author'  => $author_id,
				)
			)
		);

		$GLOBALS['post'] = $this->source_post; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		Contact_Form_Plugin::init()->process_form_submission();
	}

	/**
	 * Reset the form registry.
	 */
	public function tear_down() {
		Contact_Form::$forms        = array();
		Contact_Form::$last         = null;
		Contact_Form::$current_form = null;
		$_POST                      = array();

		parent::tear_down();
	}

	/**
	 * Seeds for the full submission runs.
	 *
	 * @return array
	 */
	public static function provide_seeds() {
		return array(
			'seed 1' => array( 1 ),
			'seed 2' => array( 2 ),
			'seed 3' => array( 3 ),
		);
	}

	/**
	 * Values read from a submission hold no less-than sign.
	 */
	public function test_processed_values_hold_plain_text() {
		mt_srand( 20260917 ); // phpcs:ignore WordPress.WP.AlternativeFunctions.rand_seeding_mt_srand -- Reproducible cases.

		$sanitize = new \ReflectionMethod( Feedback::class, 'sanitize_text_value' );
		if ( PHP_VERSION_ID < 80100 ) {
			$sanitize->setAccessible( true );
		}

		for ( $i = 0; $i < 3000; $i++ ) {
			$input = $this->random_value( true );

			$this->assert_plain_text( array( $sanitize->invoke( null, $input ) ), $input );

			$choice = array(
				'selected'  => $input,
				'label'     => $input,
				'perceived' => $input,
				'image'     => array( 'src' => $input ),
			);
			$this->assert_plain_text( Feedback::process_image_select_field_value( array( wp_slash( wp_json_encode( $choice, JSON_UNESCAPED_SLASHES ) ) ) ), $input );

			$file = array(
				'file_id' => '1',
				'name'    => $input,
				'type'    => $input,
				'size'    => 1,
			);
			$this->assert_plain_text( Feedback::process_file_field_value( array( wp_slash( wp_json_encode( $file, JSON_UNESCAPED_SLASHES ) ) ) ), $input );
		}
	}

	/**
	 * A full submission keeps random values as plain text in the hook, the email and storage.
	 *
	 * @dataProvider provide_seeds
	 *
	 * @param int $seed The random seed.
	 */
	#[DataProvider( 'provide_seeds' )]
	public function test_submissions_hold_plain_text( $seed ) {
		mt_srand( $seed ); // phpcs:ignore WordPress.WP.AlternativeFunctions.rand_seeding_mt_srand -- Reproducible cases.

		$hook = null;
		$mail = null;
		add_action(
			'grunion_pre_message_sent',
			function ( $post_id, $all_values, $extra_values ) use ( &$hook ) {
				$hook = array( $all_values, $extra_values );
			},
			10,
			3
		);
		add_filter(
			'pre_wp_mail',
			function ( $short_circuit, $atts ) use ( &$mail ) {
				$mail = $atts;
				return true;
			},
			1,
			2
		);

		$shortcode = "[contact-field label='Name' type='name'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea'/][contact-field label='Pick' type='checkbox-multiple' options='A,B'/]";
		$submitted = 0;

		for ( $i = 0; $i < 60; $i++ ) {
			// Non-ASCII bytes need a real MySQL charset lookup, which WorDBless cannot do.
			$input = $this->random_value( false );
			$hook  = null;
			$mail  = null;

			// Each form gets a new ID, so post to the IDs this one will read.
			$form  = new Contact_Form( array(), $shortcode );
			$ids   = $form->get_field_ids()['all'];
			$_POST = array( 'contact-form-id' => $this->source_post->ID ) + array_combine(
				$ids,
				array( wp_slash( $input ), 'jane@example.com', wp_slash( $input ), array( wp_slash( $input ), 'A' ) )
			);

			if ( ! is_string( $form->process_submission() ) || null === $hook ) {
				continue;
			}
			++$submitted;

			$this->assert_plain_text( $hook, $input );

			$this->assertNotNull( $mail );
			$this->assertDoesNotMatchRegularExpression(
				'/<(?:!--\s*' . self::MARKER . '|[a-z]+\b[^>]*\s(?:href|src|title)=["\']?' . self::MARKER . ')/i',
				$mail['message'],
				'Email for ' . wp_json_encode( $input, JSON_UNESCAPED_SLASHES )
			);

			$stored = get_posts(
				array(
					'post_type'   => Feedback::POST_TYPE,
					'post_status' => 'any',
					'numberposts' => 1,
					'orderby'     => 'ID',
					'order'       => 'DESC',
				)
			);
			if ( $stored ) {
				$values = array();
				foreach ( Feedback::get( $stored[0]->ID )->get_fields() as $field ) {
					$values[] = $field->get_value();
				}
				$this->assert_plain_text( $values, $input );
				wp_delete_post( $stored[0]->ID, true );
			}
		}

		$this->assertGreaterThan( 40, $submitted );
	}

	/**
	 * Build a random value, usually around a less-than sign.
	 *
	 * @param bool $allow_non_ascii Whether noise may include non-ASCII bytes.
	 *
	 * @return string
	 */
	private function random_value( $allow_non_ascii ) {
		$pieces = $allow_non_ascii ? self::PIECES : array_values( preg_grep( '/[\x80-\xff]/', self::PIECES, PREG_GREP_INVERT ) );
		$value  = $this->random_noise( $pieces );

		for ( $i = 0, $count = mt_rand( 0, 2 ); $i < $count; $i++ ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.rand_mt_rand -- Seeded.
			$separator = '';
			for ( $j = 0, $length = mt_rand( 0, 3 ); $j < $length; $j++ ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.rand_mt_rand -- Seeded.
				$separator .= self::SEPARATORS[ mt_rand( 0, count( self::SEPARATORS ) - 1 ) ]; // phpcs:ignore WordPress.WP.AlternativeFunctions.rand_mt_rand -- Seeded.
			}
			$value .= '<' . $separator . self::TAILS[ mt_rand( 0, count( self::TAILS ) - 1 ) ] . $this->random_noise( $pieces ); // phpcs:ignore WordPress.WP.AlternativeFunctions.rand_mt_rand -- Seeded.
		}

		return $value;
	}

	/**
	 * Build a short run of random pieces.
	 *
	 * @param string[] $pieces Pieces to pick from.
	 *
	 * @return string
	 */
	private function random_noise( $pieces ) {
		$noise = '';
		for ( $i = 0, $length = mt_rand( 0, 6 ); $i < $length; $i++ ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.rand_mt_rand -- Seeded.
			$noise .= $pieces[ mt_rand( 0, count( $pieces ) - 1 ) ]; // phpcs:ignore WordPress.WP.AlternativeFunctions.rand_mt_rand -- Seeded.
		}
		return $noise;
	}

	/**
	 * Assert that no string in a value, before or after the submit filter, holds a less-than sign.
	 *
	 * @param mixed  $value The value to check.
	 * @param string $input The random input, for the failure message.
	 */
	private function assert_plain_text( $value, $input ) {
		$strings = array();
		array_walk_recursive(
			$value,
			function ( $item, $key ) use ( &$strings ) {
				// Only ever read as an integer.
				if ( is_string( $item ) && 'file_id' !== $key ) {
					$strings[] = $item;
				}
			}
		);

		foreach ( $strings as $string ) {
			$this->assertStringNotContainsString( '<', $string, 'Stored for ' . wp_json_encode( $input, JSON_UNESCAPED_SLASHES ) );
			$this->assertStringNotContainsString( '<', Contact_Form_Plugin::strip_tags( $string ), 'Filtered for ' . wp_json_encode( $input, JSON_UNESCAPED_SLASHES ) );
		}
	}
}
