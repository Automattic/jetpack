<?php
use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry_Adapter;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Option;
use PHPUnit\Framework\TestCase;

class Test_Integration_Fallback_Values extends TestCase {
	public function test_wordpress_option_fallback_true() {
		$key = 'test_wp_booleans';
		// Ensure the option doesn't exist before we start.
		delete_option( $key );
		$this->assertFalse( get_option( $key ) );

		$schema = Schema::as_boolean()->fallback( true );
		$entry  = new Data_Sync_Entry_Adapter( new Data_Sync_Option( $key ), $schema );

		// Test with a valid value
		$this->assertTrue( $entry->set( true ) );
		$this->assertTrue( $entry->set( 1 ) );
		$this->assertTrue( $entry->set( '1' ) );
		$this->assertFalse( $entry->set( false ) );
		$this->assertFalse( $entry->set( '' ) );
		$this->assertFalse( $entry->set( '0' ) );
		$this->assertFalse( $entry->set( 0 ) );

		// Entry should default to true
		// because the fallback is set.
		$entry->delete();
		$this->assertTrue( $entry->get() );
	}

	public function test_wordpress_option_no_fallback() {
		$key = 'test_wp_booleans';
		// Ensure the option doesn't exist before we start.
		delete_option( $key );
		$this->assertSame( false, get_option( $key ) );

		$schema = Schema::as_boolean();
		$entry  = new Data_Sync_Entry_Adapter( new Data_Sync_Option( $key ), $schema );

		// Test with a valid values
		$this->assertSame( true, $entry->set( true ) );
		$this->assertSame( true, $entry->set( 1 ) );
		$this->assertSame( true, $entry->set( '1' ) );
		$this->assertSame( false, $entry->set( false ) );
		$this->assertSame( false, $entry->set( '' ) );
		$this->assertSame( false, $entry->set( '0' ) );
		$this->assertSame( false, $entry->set( 0 ) );

		// Entry should default to false
		// because the fallback is not set.
		$entry->delete();
		$this->assertSame( false, $entry->get() );
	}
}
