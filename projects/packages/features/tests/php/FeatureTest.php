<?php

use Automattic\Jetpack\Features\Feature;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Features\Feature
 */
#[CoversClass( Feature::class )]
final class FeatureTest extends PHPUnit\Framework\TestCase {

	public function test_defaults_are_applied() {
		$f = new Feature( 'forms-multistep' );
		$this->assertSame( 'forms-multistep', $f->slug() );
		$this->assertSame( '', $f->title() );
		$this->assertSame( 'none', $f->required_connection() );
		$this->assertNull( $f->required_entitlement() );
		$this->assertNull( $f->module() );
		$this->assertSame( array(), $f->recommend() );
		$this->assertSame( array(), $f->available_since() );
		$this->assertNull( $f->active_on_site_callback() );
	}

	public function test_reads_all_fields() {
		$f = new Feature(
			'forms-file-uploads',
			array(
				'title'           => 'File upload field',
				'description'     => 'Attach files.',
				'category'        => 'forms',
				'docs'            => array(
					'wpcom'   => 'https://w.com',
					'jetpack' => 'https://j.com',
				),
				'entitlement'     => 'field-file',
				'connection'      => 'user',
				'module'          => 'contact-form',
				'available_since' => array(
					'jetpack' => '14.2',
					'wpcom'   => '2026-07-06',
				),
				'recommend'       => array( 'high_content_volume' ),
			)
		);
		$this->assertSame( 'field-file', $f->required_entitlement() );
		$this->assertSame( 'user', $f->required_connection() );
		$this->assertSame( 'contact-form', $f->module() );
		$this->assertSame( '14.2', $f->available_since()['jetpack'] );
		$this->assertSame( array( 'high_content_volume' ), $f->recommend() );
		$this->assertSame( 'field-file', $f->to_array()['entitlement'] );
	}

	public function test_empty_slug_throws() {
		$this->expectException( InvalidArgumentException::class );
		// The constructor throws before the assertion runs; wrapping it keeps the result "used".
		$this->assertInstanceOf( Feature::class, new Feature( '' ) );
	}

	public function test_invalid_connection_throws() {
		$this->expectException( InvalidArgumentException::class );
		// The constructor throws before the assertion runs; wrapping it keeps the result "used".
		$this->assertInstanceOf( Feature::class, new Feature( 'x', array( 'connection' => 'account' ) ) );
	}
}
