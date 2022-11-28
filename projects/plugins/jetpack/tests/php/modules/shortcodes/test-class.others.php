<?php
/**
 * Test Suite for extra oEmbed providers available in Jetpack.
 *
 * @package automattic/jetpack
 */

// Dummy comment so phpcs sees the above as a file doc comment.
require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * Test Extra embeds available.
 */
class WP_Test_Jetpack_Shortcodes_Others extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * After a test method runs, reset any state in WordPress the test method might have changed.
	 */
	public function tear_down() {
		wp_reset_postdata();
		parent::tear_down();
	}

	/**
	 * Test a post including an Odesli link.
	 *
	 * @dataProvider get_odesli_data
	 *
	 * @since 8.4.0
	 *
	 * @param string $embed_link The link we're trying to embed, as pasted in the editor.
	 * @param string $expected   The expected return value of the function.
	 */
	public function test_shortcodes_songlink( $embed_link, $expected ) {
		global $post;

		$post = self::factory()->post->create_and_get( array( 'post_content' => $embed_link ) );

		setup_postdata( $post );

		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();

		$this->assertStringContainsString(
			sprintf(
				'src="%s" frameborder="0" allowtransparency allowfullscreen sandbox="allow-same-origin allow-scripts allow-presentation allow-popups allow-popups-to-escape-sandbox"></iframe>',
				$expected
			),
			$actual
		);
	}

	/**
	 * Test a post including a Loom link.
	 *
	 * @since 9.0.0
	 */
	public function test_shortcodes_loom() {
		// 'How To Install a WordPress Plugin' example.
		$embed_id = 'e3dcec661c37487b818b8e3b8225ec27';
		global $post;
		$post = self::factory()->post->create_and_get(
			array(
				'post_content' => sprintf(
					'https://www.loom.com/share/%s',
					$embed_id
				),
			)
		);
		setup_postdata( $post );
		// Test HTML version.
		ob_start();
		the_content();
		$actual = ob_get_clean();

		// Test different attributes of the loom markup.
		$this->assertStringContainsString(
			sprintf( 'src="https://www.loom.com/embed/%s" frameborder="0"', $embed_id ),
			$actual
		);
		$this->assertStringContainsString( 'title="How To Install a WordPress Plugin"', $actual );
		$this->assertStringContainsString( 'webkitallowfullscreen', $actual );
		$this->assertStringContainsString( 'mozallowfullscreen', $actual );
		$this->assertStringContainsString( 'allowfullscreen', $actual );
	}

	/**
	 * Test embeds for the Odesli service.
	 *
	 * @since 9.0.0
	 */
	public function get_odesli_data() {
		$variations = array(
			'https://song.link/hello',
			'https://album.link/hello',
			'https://pods.link/hello',
			'https://odesli.com/hello',
			'https://odesli.co/hello',
			'https://artist.link/hello',
			'https://playlist.link/hello',
			'https://mylink.page/hello',
			'https://song.link/ca/i/1288547996',
			'https://album.link/song/ca/i/1288547996',
			'https://song.link/i/1288547996',
			'https://odesli.com/song/i/1288547996',
			'https://odesli.co/song/s/6r1siiMXYLrao42oiqQrgj',
			'https://artist.link/song/y/UUDjpNpETzo',
			'https://playlist.link/song/y/6366dxFf-Os',
			'https://mylink.page/song/y/H8tLS_NOWLs',
			'https://song.link/song/g/Tg6zuj3cjgwcgrdi6ewlqdjk6iq',
			'https://album.link/song/d/138241229',
			'https://odesli.com/song/t/72268642',
			'https://odesli.co/song/a/B01NAE38YO',
			'https://artist.link/song/n/tra.246588040',
			'https://playlist.link/song/sc/347741803',
			'https://playlist.link/song/ya/32504596',
			'https://mylink.page/song/p/TR:5791220',
			'https://song.link/sp/1767083',
			'https://album.link/ca/i/1279947491',
			'https://song.link/album/i/1279947491',
			'https://album.link/album/s/6JckISQKS5IwOH4YrFrfIB',
			'https://odesli.com/album/y/OLAK5uy_nErvzigwPVzj76NSzpte5pmiViP_F0gNE',
			'https://odesli.co/album/g/B7xsarspqwsinxzont6zdvd2hny',
			'https://artist.link/album/d/14843037',
			'https://playlist.link/album/t/67784530',
			'https://mylink.page/album/a/B01N48U32A',
			'https://album.link/n/alb.246588025',
			'https://song.link/album/sc/228667052',
			'https://odesli.com/album/ya/297720',
			'https://odesli.co/album/p/AL:668238',
			'https://artist.link/album/sp/145895',
			'https://pods.link/us/i/360084272',
			'https://mylink.page/podcast/i/360084272',
		);

		$test_data = array();

		// Loop through each possible embed variation, and create a test case for it.
		foreach ( $variations as $variation ) {
			$test_name               = esc_attr( $variation );
			$test_data[ $test_name ] = array(
				$variation,
				sprintf( 'https://embed.song.link/?url=%s', rawurlencode( $variation ) ),
			);
		}

		return $test_data;
	}
}
