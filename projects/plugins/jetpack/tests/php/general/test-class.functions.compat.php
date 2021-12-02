<?php

class WP_Test_Functions_Compat extends WP_UnitTestCase {

	/**
	 * @author enkrates
	 * @covers ::youtube_sanitize_url
	 * @since 3.2
	 */
	public function test_youtube_sanitize_url_with_valid_url() {

		$valid_url = 'https://www.youtube.com/watch?v=snAvGxz7D04';

		$sanitized_url = youtube_sanitize_url( $valid_url );

		$this->assertEquals( $valid_url, $sanitized_url );
	}

	/**
	 * @author enkrates
	 * @covers ::youtube_sanitize_url
	 * @since 3.2
	 */
	public function test_youtube_sanitize_url_with_shortened_url() {

		$valid_short_url = 'https://youtu.be/snAvGxz7D04';
		$expected_sanitized_url = 'https://youtu.be/?v=snAvGxz7D04';

		$sanitized_url = youtube_sanitize_url( $valid_short_url );

		$this->assertEquals( $expected_sanitized_url, $sanitized_url );
	}

	/**
	 * @author enkrates
	 * @covers ::youtube_sanitize_url
	 * @since 3.2
	 */
	public function test_youtube_sanitize_url_with_slash_v_slash() {

		$slash_v_slash_url = 'https://www.youtube.com/v/9FhMMmqzbD8';
		$expected_sanitized_url = 'https://www.youtube.com/?v=9FhMMmqzbD8';

		$sanitized_url = youtube_sanitize_url( $slash_v_slash_url );

		$this->assertEquals( $expected_sanitized_url, $sanitized_url );
	}

	/**
	 * @author enkrates
	 * @covers ::youtube_sanitize_url
	 * @since 3.2
	 */
	public function test_youtube_sanitize_url_with_hashbang() {

		$hashbang_url = 'https://www.youtube.com/#!v=9FhMMmqzbD8';
		$expected_sanitized_url = 'https://www.youtube.com/?v=9FhMMmqzbD8';

		$sanitized_url = youtube_sanitize_url( $hashbang_url );

		$this->assertEquals( $expected_sanitized_url, $sanitized_url );
	}

	/**
	 * @author enkrates
	 * @covers ::youtube_sanitize_url
	 * @since 3.2
	 */
	public function test_youtube_sanitize_url_with_amp_ampersand() {

		$amp_ampersand_url = 'https://www.youtube.com/watch?v=snAvGxz7D04&amp;hl=en_US';
		$expected_sanitized_url = 'https://www.youtube.com/watch?v=snAvGxz7D04&hl=en_US';

		$sanitized_url = youtube_sanitize_url( $amp_ampersand_url );

		$this->assertEquals( $expected_sanitized_url, $sanitized_url );
	}

	/**
	 * @author enkrates
	 * @covers ::youtube_sanitize_url
	 * @since 3.2
	 */
	public function test_youtube_sanitize_url_with_encoded_ampersand() {

		$encoded_ampersand_url = 'https://www.youtube.com/watch?v=snAvGxz7D04&#038;hl=en_US';
		$expected_sanitized_url = 'https://www.youtube.com/watch?v=snAvGxz7D04&hl=en_US';

		$sanitized_url = youtube_sanitize_url( $encoded_ampersand_url );

		$this->assertEquals( $expected_sanitized_url, $sanitized_url );
	}

	/**
	 * @author enkrates
	 * @covers ::youtube_sanitize_url
	 * @since 3.2
	 */
	public function test_youtube_sanitize_url_with_playlist() {

		$valid_playlist_url = 'https://www.youtube.com/playlist?list=PL56C3506BBE979C1B';
		$expected_sanitized_url = 'https://www.youtube.com/videoseries?list=PL56C3506BBE979C1B';

		$sanitized_url = youtube_sanitize_url( $valid_playlist_url );

		$this->assertEquals( $expected_sanitized_url, $sanitized_url );
	}

	/**
	 * @author enkrates
	 * @covers ::youtube_sanitize_url
	 * @since 3.2
	 */
	public function test_youtube_sanitize_url_with_extra_question_mark() {

		$extra_question_mark_url = 'http://www.youtube.com/v/9FhMMmqzbD8?fs=1&hl=en_US';
		$expected_sanitized_url = 'http://www.youtube.com/?v=9FhMMmqzbD8&fs=1&hl=en_US';

		$sanitized_url = youtube_sanitize_url( $extra_question_mark_url );

		$this->assertEquals( $expected_sanitized_url, $sanitized_url );
	}

	/**
	 * @author enkrates
	 * @covers ::jetpack_get_youtube_id
	 * @since 3.2
	 */
	public function test_jetpack_get_youtube_id_with_single_video_url() {

		$single_video_url = 'https://www.youtube.com/watch?v=snAvGxz7D04';
		$expected_id = 'snAvGxz7D04';

		$youtube_id = jetpack_get_youtube_id( $single_video_url );

		$this->assertEquals( $expected_id, $youtube_id );
	}

	/**
	 * @author enkrates
	 * @covers ::jetpack_get_youtube_id
	 * @since 3.2
	 */
	public function test_jetpack_get_youtube_id_with_playlist_url() {

		$playlist_url = 'https://www.youtube.com/playlist?list=PL56C3506BBE979C1B';
		$expected_id = 'PL56C3506BBE979C1B';

		$youtube_id = jetpack_get_youtube_id( $playlist_url );

		$this->assertEquals( $expected_id, $youtube_id );
	}
} // end class
