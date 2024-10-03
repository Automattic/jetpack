<?php

namespace Automattic\Jetpack_Boost\Tests;

use Automattic\Jetpack_Boost\Lib\My_Jetpack;
use Brain\Monkey\Functions;

class My_Jetpack_Test extends Base_Test_Case {
	private $product;

	protected function setUp() {
		parent::setUp();

		// Set up the __ function mock once for all tests
		Functions\when( '__' )->returnArg();

		$this->product = My_Jetpack::get_product();
	}

	public function test_is_correct_tiers() {
		$expected = array(
			'upgraded',
			'free',
		);

		$actual = $this->product['tiers'];
		$this->assertEquals( $expected, $actual );
	}

	public function test_is_correct_features_by_tier_auto_css_optimization() {
		$expected = array(
			'name'  => 'Auto CSS Optimization',
			'info'  => array(
				'content' => 'Move important styling information to the start of the page, which helps pages display your content sooner, so your users don’t have to wait for the entire page to load. Commonly referred to as Critical CSS.',
			),
			'tiers' => array(
				'free'     => array(
					'included'    => false,
					'description' => 'Manual',
					'info'        => array(
						'title'   => 'Manual Critical CSS regeneration',
						'content' => '<p>To enhance the speed of your site, with this plan you will need to optimize CSS by using the Manual Critical CSS generation feature whenever you:</p>
						<ul>
							<li>Make theme changes.</li>
							<li>Write a new post/page.</li>
							<li>Edit a post/page.</li>
							<li>Activate, deactivate, or update plugins that impact your site layout or HTML structure.</li>
							<li>Change settings of plugins that impact your site layout or HTML structure.</li>
							<li>Upgrade your WordPress version if the new release includes core CSS changes.</li>
						</ul>',
					),
				),
				'upgraded' => array(
					'included'    => true,
					'description' => 'Included',
					'info'        => array(
						'title'   => 'Automatic Critical CSS regeneration',
						'content' => '<p>It’s essential to regenerate Critical CSS to optimize your site speed whenever your HTML or CSS structure changes. Being on top of this can be tedious and time-consuming.</p>
						<p>Boost’s cloud service can automatically detect when your site needs the Critical CSS regenerated, and perform this function behind the scenes without requiring you to monitor it manually.</p>',
					),
				),
			),
		);

		$actual = $this->product['features_by_tier'][0];
		$this->assertEquals(
			$this->normalize_whitespace( $expected ),
			$this->normalize_whitespace( $actual )
		);
	}

	public function test_is_correct_features_by_tier_auto_image_size_analysis() {
		$expected = array(
			'name'  => 'Automatic image size analysis',
			'info'  => array(
				'content' => 'Scan your site for images that aren’t properly sized for the device they’re being viewed on.',
			),
			'tiers' => array(
				'free'     => array(
					'included' => false,
				),
				'upgraded' => array(
					'included' => true,
				),
			),
		);

		$actual = $this->product['features_by_tier'][1];
		$this->assertEquals(
			$this->normalize_whitespace( $expected ),
			$this->normalize_whitespace( $actual )
		);
	}

	public function test_is_correct_features_by_tier_historical_performance_scores() {
		$expected = array(
			'name'  => 'Historical performance scores',
			'info'  => array(
				'content' => 'Get access to your historical performance scores and see advanced Core Web Vitals data.',
			),
			'tiers' => array(
				'free'     => array(
					'included' => false,
				),
				'upgraded' => array(
					'included' => true,
				),
			),
		);

		$actual = $this->product['features_by_tier'][2];
		$this->assertEquals(
			$this->normalize_whitespace( $expected ),
			$this->normalize_whitespace( $actual )
		);
	}

	public function test_is_correct_features_by_tier_dedicated_email_support() {
		$expected = array(
			'name'  => 'Dedicated email support',
			'info'  => array(
				'content' => '<p>Paid customers get dedicated email support from our world-class Happiness Engineers to help with any issue.</p>
				<p>All other questions are handled by our team as quickly as we are able to go through the WordPress support forum.</p>',
			),
			'tiers' => array(
				'free'     => array(
					'included' => false,
				),
				'upgraded' => array(
					'included' => true,
				),
			),
		);

		$actual = $this->product['features_by_tier'][3];
		$this->assertEquals(
			$this->normalize_whitespace( $expected ),
			$this->normalize_whitespace( $actual )
		);
	}

	public function test_is_correct_features_by_tier_page_cache() {
		$expected = array(
			'name'  => 'Page Cache',
			'info'  => array(
				'content' => 'Page caching speeds up load times by storing a copy of each web page on the first visit, allowing subsequent visits to be served instantly. This reduces server load and improves user experience by delivering content faster, without waiting for the page to be generated again.',
			),
			'tiers' => array(
				'free'     => array(
					'included' => true,
				),
				'upgraded' => array(
					'included' => true,
				),
			),
		);

		$actual = $this->product['features_by_tier'][4];
		$this->assertEquals(
			$this->normalize_whitespace( $expected ),
			$this->normalize_whitespace( $actual )
		);
	}

	public function test_is_correct_features_by_tier_image_cdn_quality_settings() {
		$expected = array(
			'name'  => 'Image CDN Quality Settings',
			'info'  => array(
				'content' => 'Fine-tune image quality settings to your liking.',
			),
			'tiers' => array(
				'free'     => array(
					'included' => false,
				),
				'upgraded' => array(
					'included' => true,
				),
			),
		);

		$actual = $this->product['features_by_tier'][5];
		$this->assertEquals(
			$this->normalize_whitespace( $expected ),
			$this->normalize_whitespace( $actual )
		);
	}

	public function test_is_correct_features_by_tier_image_cdn_auto_resize_lazy_images() {
		$expected = array(
			'name'  => 'Image CDN Auto-Resize Lazy Images',
			'info'  => array(
				'content' => 'Optimizes lazy-loaded images by dynamically serving perfectly sized images for each device.',
			),
			'tiers' => array(
				'free'     => array(
					'included' => false,
				),
				'upgraded' => array(
					'included' => true,
				),
			),
		);

		$actual = $this->product['features_by_tier'][6];
		$this->assertEquals(
			$this->normalize_whitespace( $expected ),
			$this->normalize_whitespace( $actual )
		);
	}

	public function test_is_correct_features_by_tier_image_cdn() {
		$expected = array(
			'name'  => 'Image CDN',
			'info'  => array(
				'content' => 'Deliver images from Jetpack\'s Content Delivery Network. Automatically resizes your images to an appropriate size, converts them to modern efficient formats like WebP, and serves them from a worldwide network of servers.',
			),
			'tiers' => array(
				'free'     => array(
					'included' => true,
				),
				'upgraded' => array(
					'included' => true,
				),
			),
		);

		$actual = $this->product['features_by_tier'][7];
		$this->assertEquals(
			$this->normalize_whitespace( $expected ),
			$this->normalize_whitespace( $actual )
		);
	}

	public function test_is_correct_features_by_tier_image_guide() {
		$expected = array(
			'name'  => 'Image guide',
			'info'  => array(
				'content' => 'Discover and fix images with a suboptimal resolution, aspect ratio, or file size, improving user experience and page speed.',
			),
			'tiers' => array(
				'free'     => array(
					'included' => true,
				),
				'upgraded' => array(
					'included' => true,
				),
			),
		);

		$actual = $this->product['features_by_tier'][8];
		$this->assertEquals(
			$this->normalize_whitespace( $expected ),
			$this->normalize_whitespace( $actual )
		);
	}

	public function test_is_correct_features_by_tier_defer_non_essential_javascript() {
		$expected = array(
			'name'  => 'Defer non-essential JavaScript',
			'info'  => array(
				'content' => 'Run non-essential JavaScript after the page has loaded so that styles and images can load more quickly.',
			),
			'tiers' => array(
				'free'     => array(
					'included' => true,
				),
				'upgraded' => array(
					'included' => true,
				),
			),
		);

		$actual = $this->product['features_by_tier'][9];
		$this->assertEquals(
			$this->normalize_whitespace( $expected ),
			$this->normalize_whitespace( $actual )
		);
	}

	public function test_is_correct_features_by_tier_concatenate_js_and_css() {
		$expected = array(
			'name'  => 'Concatenate JS and CSS',
			'info'  => array(
				'content' => 'Boost your website performance by merging and compressing JavaScript and CSS files, reducing site loading time and number of requests.',
			),
			'tiers' => array(
				'free'     => array(
					'included' => true,
				),
				'upgraded' => array(
					'included' => true,
				),
			),
		);

		$actual = $this->product['features_by_tier'][10];
		$this->assertEquals(
			$this->normalize_whitespace( $expected ),
			$this->normalize_whitespace( $actual )
		);
	}

	private function normalize_whitespace( $value ) {
		if ( is_string( $value ) ) {
			return preg_replace( '/\s+/', ' ', trim( $value ) );
		}
		if ( is_array( $value ) ) {
			return array_map( array( $this, 'normalize_whitespace' ), $value );
		}
		return $value;
	}
}
