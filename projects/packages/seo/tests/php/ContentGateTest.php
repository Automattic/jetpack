<?php
/**
 * Tests for the shared content gate.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\DataProvider;
use WP_Post;

/**
 * Every crawler-facing surface in this package asks Content_Gate the same
 * question, so the cases live here once rather than per caller.
 */
class ContentGateTest extends SeoTestCase {

	/**
	 * IDs of posts created by this test.
	 *
	 * @var int[]
	 */
	private $created_post_ids = array();

	/**
	 * Drop the meta this test writes so it cannot reach another class's fixture.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		foreach ( $this->created_post_ids as $post_id ) {
			foreach (
				array(
					Content_Gate::META_NEWSLETTER_ACCESS,
					Content_Gate::META_CONTAINS_PAID_CONTENT,
					Content_Gate::META_CONTAINS_PAYWALLED_CONTENT,
				) as $meta_key
			) {
				delete_post_meta( $post_id, $meta_key );
			}
		}
		$this->created_post_ids = array();

		parent::tearDown();
	}

	/**
	 * An ordinary published post is not gated.
	 *
	 * @return void
	 */
	public function test_plain_post_is_not_gated() {
		$this->assertFalse( Content_Gate::is_gated( $this->make_post() ) );
	}

	/**
	 * Each gating mechanism, on its own, withholds the body.
	 *
	 * @dataProvider provide_gated_posts
	 *
	 * @param array  $fields Post fields to insert.
	 * @param string $meta_key Post meta key to set, or '' for none.
	 * @param mixed  $meta_value Post meta value.
	 * @return void
	 */
	#[DataProvider( 'provide_gated_posts' )]
	public function test_gated_post_is_gated( array $fields, string $meta_key, $meta_value ) {
		$post = $this->make_post( $fields );
		if ( '' !== $meta_key ) {
			update_post_meta( $post->ID, $meta_key, $meta_value );
		}

		$this->assertTrue( Content_Gate::is_gated( get_post( $post->ID ) ) );
	}

	/**
	 * Gated posts, one mechanism each.
	 *
	 * @return array<string, array{0: array, 1: string, 2: mixed}>
	 */
	public static function provide_gated_posts(): array {
		return array(
			'password protected'          => array( array( 'post_password' => 'hunter2' ), '', '' ),
			'paid content meta'           => array( array(), '_jetpack_memberships_contains_paid_content', '1' ),
			'paywalled content meta'      => array( array(), '_jetpack_memberships_contains_paywalled_content', '1' ),
			'premium-content block'       => array( array( 'post_content' => '<!-- wp:premium-content/container -->Secret<!-- /wp:premium-content/container -->' ), '', '' ),
			'paywall block'               => array( array( 'post_content' => '<!-- wp:jetpack/paywall -->Secret<!-- /wp:jetpack/paywall -->' ), '', '' ),
			'newsletter subscribers'      => array( array(), '_jetpack_newsletter_access', 'subscribers' ),
			'newsletter paid'             => array( array(), '_jetpack_newsletter_access', 'paid_subscribers' ),
			'newsletter paid all tiers'   => array( array(), '_jetpack_newsletter_access', 'paid_subscribers_all_tiers' ),
			'unknown future access level' => array( array(), '_jetpack_newsletter_access', 'some_future_tier' ),
		);
	}

	/**
	 * Values that mean "no gate" leave the post ungated, including a corrupt
	 * non-string value, which the front end renders to everyone.
	 *
	 * @dataProvider provide_ungated_access_levels
	 *
	 * @param mixed $access_level Stored meta value.
	 * @return void
	 */
	#[DataProvider( 'provide_ungated_access_levels' )]
	public function test_ungated_access_levels_are_not_gated( $access_level ) {
		$post = $this->make_post();
		update_post_meta( $post->ID, '_jetpack_newsletter_access', $access_level );

		$this->assertFalse( Content_Gate::is_gated( get_post( $post->ID ) ) );
	}

	/**
	 * Access-level values that must not gate.
	 *
	 * @return array<string, array{0: mixed}>
	 */
	public static function provide_ungated_access_levels(): array {
		return array(
			'everybody'     => array( 'everybody' ),
			'empty string'  => array( '' ),
			'corrupt array' => array( array( '' ) ),
		);
	}

	/**
	 * With nothing to reason about, withhold rather than guess.
	 *
	 * @return void
	 */
	public function test_missing_post_is_gated() {
		$this->assertTrue( Content_Gate::is_gated( 0 ) );
	}

	/**
	 * The paywall block's prefix is served to everyone, so it survives the gate.
	 *
	 * @return void
	 */
	public function test_paywall_teaser_is_public() {
		$post = $this->make_post( array( 'post_content' => 'Free intro.<!-- wp:jetpack/paywall /-->Paid body.' ) );

		$this->assertSame( 'Free intro.', Content_Gate::public_teaser( $post ) );
	}

	/**
	 * An access level on top of the paywall block does not withhold the teaser,
	 * matching how Subscriptions::add_paywall() splits the body.
	 *
	 * @return void
	 */
	public function test_paywall_teaser_survives_an_access_level() {
		$post = $this->make_post( array( 'post_content' => 'Free intro.<!-- wp:jetpack/paywall /-->Paid body.' ) );
		update_post_meta( $post->ID, Content_Gate::META_NEWSLETTER_ACCESS, 'paid_subscribers' );

		$this->assertSame( 'Free intro.', Content_Gate::public_teaser( get_post( $post->ID ) ) );
	}

	/**
	 * Premium content below the paywall block does not withhold the teaser above
	 * it, which is the whole point of recovering a prefix.
	 *
	 * @return void
	 */
	public function test_paywall_teaser_survives_premium_content_below_it() {
		$post = $this->make_post(
			array(
				'post_content' => 'Free intro.<!-- wp:jetpack/paywall /--><!-- wp:premium-content/container -->Secret<!-- /wp:premium-content/container -->',
			)
		);

		$this->assertSame( 'Free intro.', Content_Gate::public_teaser( $post ) );
	}

	/**
	 * Gates without a public prefix yield nothing to summarize.
	 *
	 * @dataProvider provide_posts_without_a_teaser
	 *
	 * @param array $fields Post fields to insert.
	 * @return void
	 */
	#[DataProvider( 'provide_posts_without_a_teaser' )]
	public function test_posts_without_a_teaser_yield_nothing( array $fields ) {
		$this->assertSame( '', Content_Gate::public_teaser( $this->make_post( $fields ) ) );
	}

	/**
	 * Posts whose body has no public prefix to recover.
	 *
	 * @return array<string, array{0: array}>
	 */
	public static function provide_posts_without_a_teaser(): array {
		return array(
			'no paywall block'              => array( array( 'post_content' => 'Just a body.' ) ),
			'premium-content'               => array( array( 'post_content' => '<!-- wp:premium-content/container -->Secret<!-- /wp:premium-content/container -->' ) ),
			'paywall opens post'            => array( array( 'post_content' => '<!-- wp:jetpack/paywall /-->Paid body.' ) ),
			'password protected'            => array(
				array(
					'post_content'  => 'Free intro.<!-- wp:jetpack/paywall /-->Paid.',
					'post_password' => 'hunter2',
				),
			),
			'unserialized paywall'          => array( array( 'post_content' => '<!-- wp:jetpack/paywall -->Secret<!-- /wp:jetpack/paywall -->' ) ),

			/*
			 * A premium-content block above the paywall renders to nothing for an
			 * anonymous reader, so its text must not reach a summary built from
			 * raw markup. Its inner views can appear without the container.
			 */
			'premium-content above paywall' => array(
				array( 'post_content' => 'Free intro.<!-- wp:premium-content/container -->Secret<!-- /wp:premium-content/container --><!-- wp:jetpack/paywall /-->Paid.' ),
			),
			'subscriber-view above paywall' => array(
				array( 'post_content' => 'Free intro.<!-- wp:premium-content/subscriber-view -->Secret<!-- /wp:premium-content/subscriber-view --><!-- wp:jetpack/paywall /-->Paid.' ),
			),
		);
	}

	/**
	 * Insert a published post.
	 *
	 * @param array $fields Post fields.
	 * @return WP_Post
	 */
	private function make_post( array $fields = array() ): WP_Post {
		$post_id = wp_insert_post(
			array_merge(
				array(
					'post_title'   => 'Gate fixture',
					'post_content' => 'Body text.',
					'post_status'  => 'publish',
				),
				$fields
			)
		);

		$this->created_post_ids[] = $post_id;

		return get_post( $post_id );
	}
}
