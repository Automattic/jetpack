<?php
/**
 * Covers reading the AI Website Builder's site spec and mapping it to a wizard input.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * The builder spec decides AI-built detection, the inferred goal and the description.
 */
class AI_Launchpad_Builder_Spec_Test extends \WorDBless\BaseTestCase {

	/**
	 * Only a spec with a non-empty siteType counts as AI-built.
	 *
	 * @dataProvider provide_ai_built_specs
	 *
	 * @param mixed $stored   The stored option value, or null to leave it unset.
	 * @param bool  $expected Whether the site is AI-built.
	 */
	#[DataProvider( 'provide_ai_built_specs' )]
	public function test_is_ai_built_reads_the_spec( $stored, $expected ) {
		if ( null !== $stored ) {
			update_option( 'big_sky_site_metadata', $stored );
		}

		$this->assertSame( $expected, wpcom_ai_launchpad_is_ai_built() );
	}

	/**
	 * Data provider for test_is_ai_built_reads_the_spec.
	 *
	 * @return array
	 */
	public static function provide_ai_built_specs() {
		return array(
			'no spec'                 => array( null, false ),
			'defaults only, as JSON'  => array( '{"siteTitle":"X","siteDescription":"","topic":"General"}', false ),
			'a siteType, as JSON'     => array( '{"siteType":"business"}', true ),
			'a siteType, as an array' => array( array( 'siteType' => 'business' ), true ),
			'an empty siteType'       => array( array( 'siteType' => '' ), false ),
		);
	}

	/**
	 * Each mapping rule from spec to goal.
	 *
	 * @dataProvider provide_goal_specs
	 *
	 * @param array  $spec     The builder spec.
	 * @param string $expected The goal slug.
	 */
	#[DataProvider( 'provide_goal_specs' )]
	public function test_goal_from_builder_spec( $spec, $expected ) {
		$this->assertSame( $expected, wpcom_ai_launchpad_goal_from_builder_spec( $spec ) );
	}

	/**
	 * Data provider for test_goal_from_builder_spec.
	 *
	 * @return array
	 */
	public static function provide_goal_specs() {
		return array(
			'a store'                      => array( array( 'siteType' => 'store' ), 'sell' ),
			'sell_services as a feature'   => array(
				array(
					'siteType'     => 'business',
					'siteFeatures' => array( 'sell_services' ),
				),
				'sell',
			),
			'sell_physical_goods as a map' => array(
				array(
					'siteType'     => 'business',
					'siteFeatures' => array(
						'sell_physical_goods' => true,
						'newsletter'          => false,
					),
				),
				'sell',
			),
			'a truthy non-boolean map'     => array(
				array(
					'siteType'     => 'business',
					'siteFeatures' => array( 'sell_services' => 'yes' ),
				),
				'sell',
			),
			'sell_services as a goal'      => array(
				array(
					'siteType'  => 'business',
					'siteGoals' => array( 'sell_services' ),
				),
				'sell',
			),
			'a blog'                       => array( array( 'siteType' => 'blog' ), 'write' ),
			'news'                         => array( array( 'siteType' => 'news' ), 'write' ),
			'a personal site'              => array( array( 'siteType' => 'personal' ), 'write' ),
			'photography'                  => array( array( 'siteType' => 'photography' ), 'portfolio' ),
			'education'                    => array( array( 'siteType' => 'education' ), 'educate' ),
			'food and beverage'            => array( array( 'siteType' => 'foodAndBeverage' ), 'build' ),
			'an unknown type'              => array( array( 'siteType' => 'something-new' ), 'build' ),
		);
	}

	/**
	 * The description is the spec's description, topic and goals, in that order.
	 *
	 * @dataProvider provide_descriptions
	 *
	 * @param array  $spec     The builder spec.
	 * @param string $expected The expected description.
	 */
	#[DataProvider( 'provide_descriptions' )]
	public function test_builder_input_composes_the_description( $spec, $expected ) {
		update_option( 'big_sky_site_metadata', wp_json_encode( $spec, JSON_UNESCAPED_SLASHES ) );

		$this->assertSame( $expected, $this->builder_input()['description'] );
	}

	/**
	 * Data provider for test_builder_input_composes_the_description.
	 *
	 * @return array
	 */
	public static function provide_descriptions() {
		return array(
			'with a topic'           => array(
				array(
					'siteType'        => 'business',
					'siteDescription' => 'A bakery.',
					'topic'           => 'Baking',
				),
				"A bakery.\nTopic: Baking",
			),
			'with the General topic' => array(
				array(
					'siteType'        => 'business',
					'siteDescription' => 'A bakery.',
					'topic'           => 'General',
				),
				'A bakery.',
			),
			'with goals'             => array(
				array(
					'siteType'        => 'business',
					'siteDescription' => 'A bakery.',
					'siteGoals'       => array( 'sell_services', 42, 'get_bookings' ),
				),
				"A bakery.\nGoals: sell_services; get_bookings",
			),
			'with a topic and goals' => array(
				array(
					'siteType'        => 'business',
					'siteDescription' => 'A bakery.',
					'topic'           => 'Baking',
					'siteGoals'       => array( 'get_bookings' ),
				),
				"A bakery.\nTopic: Baking\nGoals: get_bookings",
			),
			'with only a topic'      => array(
				array(
					'siteType' => 'business',
					'topic'    => 'Baking',
				),
				'Topic: Baking',
			),
		);
	}

	/**
	 * The description never exceeds 1000 characters.
	 */
	public function test_builder_input_caps_the_description() {
		update_option(
			'big_sky_site_metadata',
			wp_json_encode(
				array(
					'siteType'        => 'business',
					'siteDescription' => str_repeat( 'é', 1500 ),
				),
				JSON_UNESCAPED_SLASHES
			)
		);

		$this->assertSame( 1000, mb_strlen( $this->builder_input()['description'] ) );
	}

	/**
	 * The site name is the decoded current blogname, then the spec's title.
	 */
	public function test_builder_input_site_name() {
		update_option(
			'big_sky_site_metadata',
			wp_json_encode(
				array(
					'siteType'        => 'business',
					'siteTitle'       => 'Spec Title',
					'siteDescription' => 'A bakery.',
				),
				JSON_UNESCAPED_SLASHES
			)
		);

		update_option( 'blogname', 'Bob &amp; Sue&#039;s' );
		$this->assertSame( "Bob & Sue's", $this->builder_input()['site_name'] );

		update_option( 'blogname', '' );
		$this->assertSame( 'Spec Title', $this->builder_input()['site_name'] );
	}

	/**
	 * The goal in the input comes from the spec.
	 */
	public function test_builder_input_goal() {
		update_option(
			'big_sky_site_metadata',
			wp_json_encode(
				array(
					'siteType'        => 'store',
					'siteDescription' => 'Shoes.',
				),
				JSON_UNESCAPED_SLASHES
			)
		);

		$this->assertSame( 'sell', $this->builder_input()['goal'] );
	}

	/**
	 * No spec, or nothing to describe, means no input.
	 */
	public function test_builder_input_is_null_without_a_usable_spec() {
		$this->assertNull( wpcom_ai_launchpad_builder_input() );

		update_option(
			'big_sky_site_metadata',
			wp_json_encode(
				array(
					'siteType' => 'business',
					'topic'    => 'General',
				),
				JSON_UNESCAPED_SLASHES
			)
		);
		$this->assertNull( wpcom_ai_launchpad_builder_input() );
	}

	/**
	 * The builder input, asserted non-null.
	 *
	 * @return array
	 */
	private function builder_input() {
		$input = wpcom_ai_launchpad_builder_input();
		$this->assertIsArray( $input );

		return $input;
	}
}
