<?php

/**
 * @covers Jetpack_Data
 */
class WP_Test_Jetpack_Data extends WP_UnitTestCase {
	const STORED  = '12345.67890';
	const DEFINED = ';hello;.world';
	const DEFINED_MULTI = ';hello;.world,;foo;.bar,looks-like-a.stored-token';

	public function setUp() {
		parent::setUp();

		Jetpack_Options::update_option( 'blog_token', self::STORED );
		Jetpack_Options::update_option( 'user_tokens', [
			1 => 'user-one.uno.1',
			2 => 'user-two.dos.2',
			4 => 'user-four.cuatro',   // malformed: missing user ID.
			5 => 'user-four-cuatro-5', // malformed: wrong structrue.
			6 => '',                   // malformed: falsey value.
			7 => 'user-seven.siete.1', // malformed: wrong user ID.
		] );
		Jetpack_Options::update_option( 'master_user', 2 );
	}

	public function tearDown() {
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'user_tokens' );
		Jetpack_Options::delete_option( 'master_user' );

		Jetpack_Constants::clear_constants();

		parent::tearDown();
	}

	public function test_get_access_token_with_no_args_returns_false_when_no_blog_token() {
		Jetpack_Options::delete_option( 'blog_token' );
		$token = Jetpack_Data::get_access_token();

		$this->assertFalse( $token );
	}

	public function test_get_access_token_with_no_args_returns_blog_token() {
		$token = Jetpack_Data::get_access_token();

		$this->assertEquals( self::STORED, $token->secret );
		$this->assertEquals( 0, $token->external_user_id );
	}

	public function test_get_access_token_with_no_args_returns_defined_blog_token_when_constant_set() {
		Jetpack_Constants::set_constant( 'JETPACK_BLOG_TOKEN', self::DEFINED );

		$token = Jetpack_Data::get_access_token();

		$this->assertEquals( self::DEFINED, $token->secret );
		$this->assertEquals( 0, $token->external_user_id );
	}

	public function test_get_access_token_with_no_args_returns_defined_blog_token_when_constant_set_and_no_stored_token() {
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Constants::set_constant( 'JETPACK_BLOG_TOKEN', self::DEFINED );

		$token = Jetpack_Data::get_access_token();

		$this->assertEquals( self::DEFINED, $token->secret );
		$this->assertEquals( 0, $token->external_user_id );
	}


	public function test_get_access_token_with_stored_key_returns_stored_blog_token() {
		Jetpack_Constants::set_constant( 'JETPACK_BLOG_TOKEN', self::DEFINED );

		$token = Jetpack_Data::get_access_token( false, '12345' );

		$this->assertEquals( self::STORED, $token->secret );
		$this->assertEquals( 0, $token->external_user_id );
	}

	public function test_get_access_token_with_magic_key_returns_stored_blog_token() {
		Jetpack_Constants::set_constant( 'JETPACK_BLOG_TOKEN', self::DEFINED );

		$token = Jetpack_Data::get_access_token( false, Jetpack_Data::MAGIC_NORMAL_TOKEN_KEY );

		$this->assertEquals( self::STORED, $token->secret );
		$this->assertEquals( 0, $token->external_user_id );
	}


	public function test_get_access_token_with_magic_key_returns_defined_blog_token_if_it_looks_like_a_stored_token_and_no_stored_token() {
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Constants::set_constant( 'JETPACK_BLOG_TOKEN', self::STORED );

		$token = Jetpack_Data::get_access_token( false, Jetpack_Data::MAGIC_NORMAL_TOKEN_KEY );

		$this->assertEquals( self::STORED, $token->secret );
		$this->assertEquals( 0, $token->external_user_id );
	}

	public function test_get_access_token_with_no_args_returns_first_defined_blog_token_when_constant_multi_set() {
		Jetpack_Constants::set_constant( 'JETPACK_BLOG_TOKEN', self::DEFINED_MULTI );

		$token = Jetpack_Data::get_access_token();

		$this->assertEquals( ';hello;.world', $token->secret );
		$this->assertEquals( 0, $token->external_user_id );
	}

	public function test_get_access_token_with_no_args_returns_first_defined_blog_token_when_constant_multi_set_and_no_stored_token() {
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Constants::set_constant( 'JETPACK_BLOG_TOKEN', self::DEFINED_MULTI );

		$token = Jetpack_Data::get_access_token();

		$this->assertEquals( ';hello;.world', $token->secret );
		$this->assertEquals( 0, $token->external_user_id );
	}

	public function test_get_access_token_with_token_key_returns_matching_token_when_constant_multi_set() {
		Jetpack_Constants::set_constant( 'JETPACK_BLOG_TOKEN', self::DEFINED_MULTI );

		$token = Jetpack_Data::get_access_token( false, ';foo;' );

		$this->assertEquals( ';foo;.bar', $token->secret );
		$this->assertEquals( 0, $token->external_user_id );
	}

	public function test_get_access_token_with_token_key_returns_matching_token_when_constant_multi_set_and_no_stored_token() {
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Constants::set_constant( 'JETPACK_BLOG_TOKEN', self::DEFINED_MULTI );

		$token = Jetpack_Data::get_access_token( false, ';foo;' );

		$this->assertEquals( ';foo;.bar', $token->secret );
		$this->assertEquals( 0, $token->external_user_id );
	}

	public function test_get_access_token_with_magic_key_returns_stored_token_when_constant_multi_set() {
		Jetpack_Constants::set_constant( 'JETPACK_BLOG_TOKEN', self::DEFINED_MULTI );

		$token = Jetpack_Data::get_access_token( false, Jetpack_Data::MAGIC_NORMAL_TOKEN_KEY );

		$this->assertEquals( self::STORED, $token->secret );
		$this->assertEquals( 0, $token->external_user_id );
	}

	public function test_get_access_token_with_magic_key_returns_matching_token_when_constant_multi_set_and_no_stored_token() {
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Constants::set_constant( 'JETPACK_BLOG_TOKEN', self::DEFINED_MULTI );

		$token = Jetpack_Data::get_access_token( false, Jetpack_Data::MAGIC_NORMAL_TOKEN_KEY );

		$this->assertEquals( 'looks-like-a.stored-token', $token->secret );
		$this->assertEquals( 0, $token->external_user_id );
	}

	public function test_get_access_token_with_token_key_requires_full_key() {
		Jetpack_Constants::set_constant( 'JETPACK_BLOG_TOKEN', self::DEFINED_MULTI );

		$token = Jetpack_Data::get_access_token( false, ';fo' );

		$this->assertFalse( $token );
	}

	public function test_get_access_token_with_user_id_returns_false_when_no_user_tokens() {
		Jetpack_Options::delete_option( 'user_tokens' );

		$token = Jetpack_Data::get_access_token( 1 );
		$this->assertFalse( $token );
	}

	public function test_get_access_token_with_user_id() {
		$token = Jetpack_Data::get_access_token( 1 );

		$this->assertEquals( 'user-one.uno', $token->secret );
	}

	public function test_get_access_token_with_master_user_returns_false_when_no_master_user() {
		Jetpack_Options::delete_option( 'master_user' );
		$token = Jetpack_Data::get_access_token( JETPACK_MASTER_USER );

		$this->assertFalse( $token );
	}

	public function test_get_access_token_with_master_user() {
		$token = Jetpack_Data::get_access_token( JETPACK_MASTER_USER );

		$this->assertEquals( 'user-two.dos', $token->secret );
	}

	public function test_get_access_token_with_unconnected_user() {
		$token = Jetpack_Data::get_access_token( 3 );

		$this->assertFalse( $token );
	}

	public function test_get_access_token_with_malformed_token_with_missing_user_id() {
		$token = Jetpack_Data::get_access_token( 4 );

		$this->assertFalse( $token );
	}

	public function test_get_access_token_with_malformed_token_with_wrong_structure() {
		$token = Jetpack_Data::get_access_token( 5 );

		$this->assertFalse( $token );
	}

	public function test_get_access_token_with_malformed_token_with_falsey_value() {
		$token = Jetpack_Data::get_access_token( 6 );

		$this->assertFalse( $token );
	}

	public function test_get_access_token_with_malformed_token_with_wrong_user_id() {
		$token = Jetpack_Data::get_access_token( 7 );

		$this->assertFalse( $token );
	}
}
