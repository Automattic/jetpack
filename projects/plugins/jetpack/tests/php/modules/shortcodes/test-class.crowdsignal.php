<?php

require_once __DIR__ . '/trait.http-request-cache.php';

/**
 * Test class for CrowdsignalShortcode
 *
 * @covers CrowdsignalShortcode
 */
class WP_Test_Jetpack_Shortcodes_CrowdSignal extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		// Register the scripts needed by the shortcode.
		CrowdsignalShortcode::register_scripts();
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_shortcodes_crowdsignal_exists() {
		$this->assertEquals( shortcode_exists( 'crowdsignal' ), true );
		$this->assertEquals( shortcode_exists( 'polldaddy' ), true );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_shortcodes_crowdsignal() {
		$content = '[crowdsignal]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_shortcodes_polldaddy() {
		$content = '[polldaddy]';

		$shortcode_content = do_shortcode( $content );

		$this->assertNotEquals( $content, $shortcode_content );
	}

	/**
	 * Test a basic legacy Polldaddy poll.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcodes_polldaddy_poll() {
		$id      = 9541291;
		$content = '[polldaddy poll=' . $id . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals(
			sprintf(
				'<a name="pd_a_%1$d"></a><div class="CSS_Poll PDS_Poll" id="PDI_container%1$d" data-settings="{&quot;url&quot;:&quot;https:\/\/secure.polldaddy.com\/p\/%1$d.js&quot;}" style=""></div><div id="PD_superContainer"></div><noscript><a href="https://polldaddy.com/p/%1$d" target="_blank">Take Our Poll</a></noscript>',
				$id
			),
			$shortcode_content
		);
		$this->assertTrue( wp_script_is( 'crowdsignal-shortcode', 'enqueued' ) );
	}

	/**
	 * Test a basic Crowdsignal poll.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcodes_crowdsignal_poll() {
		$id      = 9541291;
		$content = '[crowdsignal poll=' . $id . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals(
			sprintf(
				'<a name="pd_a_%1$d"></a><div class="CSS_Poll PDS_Poll" id="PDI_container%1$d" data-settings="{&quot;url&quot;:&quot;https:\/\/secure.polldaddy.com\/p\/%1$d.js&quot;}" style=""></div><div id="PD_superContainer"></div><noscript><a href="https://poll.fm/%1$d" target="_blank">Take Our Poll</a></noscript>',
				$id
			),
			$shortcode_content
		);
		$this->assertTrue( wp_script_is( 'crowdsignal-shortcode', 'enqueued' ) );
	}

	/**
	 * Test a Crowdsignal slider poll (sticks to the bottom right corner of the page).
	 *
	 * @since 7.4.0
	 */
	public function test_shortcodes_crowdsignal_poll_slider() {
		$id      = 9541291;
		$content = '[crowdsignal poll=' . $id . ' type="slider"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals(
			sprintf(
				'<div class="cs-embed pd-embed" data-settings="{&quot;type&quot;:&quot;slider&quot;,&quot;embed&quot;:&quot;poll&quot;,&quot;delay&quot;:100,&quot;visit&quot;:&quot;single&quot;,&quot;id&quot;:%1$d,&quot;site&quot;:&quot;crowdsignal.com&quot;}"></div><noscript><a href="https://poll.fm/%1$d" target="_blank">Take Our Poll</a></noscript>',
				$id
			),
			$shortcode_content
		);
		$this->assertTrue( wp_script_is( 'crowdsignal-survey', 'enqueued' ) );
	}

	/**
	 * Test a basic legacy Polldaddy survey.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcodes_polldaddy_survey() {
		$id      = '7676FB1FF2B56CE9';
		$content = '[polldaddy survey=' . $id . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals(
			sprintf(
				'<a class="cs-embed pd-embed" href="https://polldaddy.com/s/%1$s" data-settings="{&quot;title&quot;:&quot;Take Our Survey&quot;,&quot;type&quot;:&quot;button&quot;,&quot;text_color&quot;:&quot;000000&quot;,&quot;back_color&quot;:&quot;FFFFFF&quot;,&quot;id&quot;:&quot;%1$s&quot;,&quot;site&quot;:&quot;polldaddy.com&quot;}">Take Our Survey</a>',
				$id
			),
			$shortcode_content
		);
		$this->assertTrue( wp_script_is( 'crowdsignal-survey', 'enqueued' ) );
	}

	/**
	 * Test a basic Crowdsignal survey.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcodes_crowdsignal_survey() {
		$id      = '7676FB1FF2B56CE9';
		$content = '[crowdsignal survey=' . $id . ']';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals(
			sprintf(
				'<a class="cs-embed pd-embed" href="https://survey.fm/%1$s" data-settings="{&quot;title&quot;:&quot;Take Our Survey&quot;,&quot;type&quot;:&quot;button&quot;,&quot;text_color&quot;:&quot;000000&quot;,&quot;back_color&quot;:&quot;FFFFFF&quot;,&quot;id&quot;:&quot;%1$s&quot;,&quot;site&quot;:&quot;crowdsignal.com&quot;}">Take Our Survey</a>',
				$id
			),
			$shortcode_content
		);
		$this->assertTrue( wp_script_is( 'crowdsignal-survey', 'enqueued' ) );
	}

	/**
	 * Test a Crowdsignal survey in an iFrame.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcodes_crowdsignal_survey_iframe() {
		$id      = '7676FB1FF2B56CE9';
		$content = '[crowdsignal survey=' . $id . ' type="iframe" width="400" height="600"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals(
			sprintf(
				'<iframe src="https://survey.fm/%1$s?iframe=1" frameborder="0" width="400" height="600" scrolling="auto" allowtransparency="true" marginheight="0" marginwidth="0"><a href="https://survey.fm/%1$s" target="_blank" rel="noopener noreferrer">Take Our Survey</a></iframe>',
				$id
			),
			$shortcode_content
		);
	}

	/**
	 * Test a Crowdsignal survey in an iFrame, using a custom domain name, and a custom title.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcodes_crowdsignal_survey_iframe_customdomain() {
		$id      = '7676FB1FF2B56CE9';
		$domain  = 'jeherve';
		$name    = 'a-survey';
		$title   = 'A test survey';
		$content = sprintf(
			'[crowdsignal survey="%1$s" type="iframe" width="400" height="auto" domain="%2$s" id="%3$s" title="%4$s"]',
			$id,
			$domain,
			$name,
			$title
		);

		$shortcode_content = do_shortcode( $content );

		$this->assertEquals(
			sprintf(
				'<div class="cs-embed pd-embed" data-settings="{&quot;type&quot;:&quot;iframe&quot;,&quot;auto&quot;:true,&quot;domain&quot;:&quot;%2$s.survey.fm\/&quot;,&quot;id&quot;:&quot;%3$s&quot;,&quot;site&quot;:&quot;crowdsignal.com&quot;}"></div><noscript><a href="https://survey.fm/%1$s" target="_blank" rel="noopener noreferrer">%4$s</a></noscript>',
				$id,
				$domain,
				$name,
				$title
			),
			$shortcode_content
		);
		$this->assertTrue( wp_script_is( 'crowdsignal-survey', 'enqueued' ) );
	}

	/**
	 * Test a basic legacy Polldaddy rating.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcodes_polldaddy_rating() {
		global $post;

		$id      = 8755352;
		$content = '[polldaddy rating=' . $id . ']';
		$post    = self::factory()->post->create_and_get( array( 'post_content' => $content ) );

		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertStringContainsString(
			sprintf(
				'<div class="cs-rating pd-rating" id="pd_rating_holder_%1$d_post_%2$d"></div>',
				$id,
				$post->ID
			),
			$actual
		);
		wp_reset_postdata();
	}

	/**
	 * Test a basic Crowdsignal rating.
	 *
	 * @since 7.4.0
	 */
	public function test_shortcodes_crowdsignal_rating() {
		global $post;

		$id      = 8755352;
		$content = '[crowdsignal rating=' . $id . ']';
		$post    = self::factory()->post->create_and_get( array( 'post_content' => $content ) );

		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		$this->assertStringContainsString(
			sprintf(
				'<div class="cs-rating pd-rating" id="pd_rating_holder_%1$d_post_%2$d"></div>',
				$id,
				$post->ID
			),
			$actual
		);
		wp_reset_postdata();
	}
}
