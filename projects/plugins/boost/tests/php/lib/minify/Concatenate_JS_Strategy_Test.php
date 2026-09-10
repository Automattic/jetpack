<?php

namespace Automattic\Jetpack_Boost\Tests\Lib\Minify;

use Automattic\Jetpack_Boost\Lib\Minify\Concatenate_JS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Render_Blocking_JS\Render_Blocking_JS;
use WorDBless\BaseTestCase;
use WP_HTML_Tag_Processor;
use WP_Scripts;

if ( ! defined( 'JETPACK_BOOST_DIR_PATH' ) ) {
	define( 'JETPACK_BOOST_DIR_PATH', dirname( __DIR__, 4 ) );
}
require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/loader.php';

if ( ! function_exists( 'jetpack_boost_ds_get' ) ) {
	require_once JETPACK_BOOST_DIR_PATH . '/wp-js-data-sync.php';
}

class Concatenate_JS_Strategy_Test extends BaseTestCase {
	/**
	 * @var string
	 */
	private $asset_dir;

	public function set_up() {
		parent::set_up();

		// Local files are required for the scripts to be concatenation candidates.
		$this->asset_dir = WP_CONTENT_DIR . '/boost-strategy-test-' . getmypid();
		mkdir( $this->asset_dir, 0755, true );
		foreach ( array( 'dependency', 'consumer', 'other', 'last' ) as $name ) {
			file_put_contents( $this->asset_dir . '/' . $name . '.js', 'var boostStrategyTest = 1;' );
		}
		add_filter( 'js_do_concat', array( $this, 'exclude_dependency' ), 10, 2 );
	}

	public function tear_down() {
		remove_filter( 'js_do_concat', array( $this, 'exclude_dependency' ), 10 );
		foreach ( array( 'dependency', 'consumer', 'other', 'last' ) as $name ) {
			unlink( $this->asset_dir . '/' . $name . '.js' );
		}
		rmdir( $this->asset_dir );

		parent::tear_down();
	}

	public function exclude_dependency( $do_concat, $handle ) {
		return 'boost-strategy-dependency' === $handle ? false : $do_concat;
	}

	private function register( WP_Scripts $scripts, $name, $dependencies = array(), $strategy = '' ) {
		$handle = 'boost-strategy-' . $name;
		$scripts->add( $handle, '/wp-content/' . basename( $this->asset_dir ) . '/' . $name . '.js', $dependencies, null );
		if ( $strategy ) {
			$scripts->add_data( $handle, 'strategy', $strategy );
		}
		return $handle;
	}

	private function render( WP_Scripts $scripts ) {
		ob_start();
		try {
			$scripts->do_items();
		} finally {
			$output = ob_get_clean();
		}

		$processor = new WP_HTML_Tag_Processor( $output );
		$tags      = array();
		while ( $processor->next_tag( 'SCRIPT' ) ) {
			$tags[] = array(
				'id'           => $processor->get_attribute( 'id' ),
				'src'          => $processor->get_attribute( 'src' ),
				'defer'        => $processor->get_attribute( 'defer' ),
				'async'        => $processor->get_attribute( 'async' ),
				'data-handles' => $processor->get_attribute( 'data-handles' ),
				'ignored'      => $processor->get_attribute( 'data-jetpack-boost' ),
			);
		}
		return $tags;
	}

	public function test_deferred_consumer_stays_out_of_a_singleton_group() {
		$this->assert_deferred_dependency_and_consumer( false );
	}

	public function test_deferred_consumer_stays_out_of_a_multi_handle_group() {
		$this->assert_deferred_dependency_and_consumer( true );
	}

	private function assert_deferred_dependency_and_consumer( $with_other_scripts ) {
		$scripts    = new Concatenate_JS( new WP_Scripts() );
		$dependency = $this->register( $scripts, 'dependency', array(), 'defer' );
		$consumer   = $this->register( $scripts, 'consumer', array( $dependency ), 'defer' );
		$scripts->enqueue( $consumer );
		if ( $with_other_scripts ) {
			$scripts->enqueue( $this->register( $scripts, 'other' ) );
			$scripts->enqueue( $this->register( $scripts, 'last' ) );
		}

		$tags = $this->render( $scripts );

		$this->assertCount( $with_other_scripts ? 3 : 2, $tags );
		$this->assertSame( $dependency . '-js', $tags[0]['id'] );
		$this->assertSame( $consumer . '-js', $tags[1]['id'] );
		foreach ( array( 'dependency', 'consumer' ) as $index => $name ) {
			$this->assertNotNull( $tags[ $index ]['defer'] );
			$this->assertNull( $tags[ $index ]['async'] );
			$this->assertStringContainsString( '/' . $name . '.js', $tags[ $index ]['src'] );
		}
		foreach ( $tags as $tag ) {
			$this->assertStringNotContainsString( $consumer, (string) $tag['data-handles'] );
		}
		if ( $with_other_scripts ) {
			if ( WP_DEBUG ) {
				$this->assertSame( 'boost-strategy-other,boost-strategy-last', $tags[2]['data-handles'] );
			}
			$this->assertNull( $tags[2]['id'] );
			$this->assertMatchesRegularExpression( '~/(?:_jb_static/\?\?|boost-cache/static/)~', $tags[2]['src'] );
			$this->assertStringNotContainsString( '/consumer.js', $tags[2]['src'] );
		}
	}

	public function test_async_registration_is_preserved() {
		$scripts = new Concatenate_JS( new WP_Scripts() );
		$handle  = $this->register( $scripts, 'consumer', array(), 'async' );
		$scripts->enqueue( $handle );

		$tags = $this->render( $scripts );

		$this->assertCount( 1, $tags );
		$this->assertSame( $handle . '-js', $tags[0]['id'] );
		$this->assertNotNull( $tags[0]['async'] );
		$this->assertNull( $tags[0]['defer'] );
		$this->assertNull( $tags[0]['data-handles'] );
	}

	public function test_blocking_dependent_removes_defer_as_in_core() {
		$core  = new WP_Scripts();
		$boost = new Concatenate_JS( new WP_Scripts() );
		foreach ( array( $core, $boost ) as $scripts ) {
			$consumer = $this->register( $scripts, 'consumer', array(), 'defer' );
			$other    = $this->register( $scripts, 'other', array( $consumer ) );
			$scripts->enqueue( array( $consumer, $other ) );
		}

		$core_tags  = $this->render( $core );
		$boost_tags = $this->render( $boost );

		$this->assertCount( 2, $boost_tags );
		$this->assertSame( $core_tags[0], $boost_tags[0] );
		$this->assertSame( 'boost-strategy-consumer-js', $boost_tags[0]['id'] );
		$this->assertNull( $boost_tags[0]['defer'] );
		$this->assertNull( $boost_tags[0]['async'] );
		$this->assertStringContainsString( '/other.js', $boost_tags[1]['src'] );
	}

	public function test_scripts_without_a_strategy_still_bundle() {
		$scripts = new Concatenate_JS( new WP_Scripts() );
		$scripts->enqueue( $this->register( $scripts, 'consumer' ) );
		$scripts->enqueue( $this->register( $scripts, 'other' ) );

		$tags = $this->render( $scripts );

		$this->assertCount( 1, $tags );
		$this->assertNull( $tags[0]['id'] );
		$this->assertMatchesRegularExpression( '~/(?:_jb_static/\?\?|boost-cache/static/)~', $tags[0]['src'] );
		$this->assertNull( $tags[0]['defer'] );
		$this->assertNull( $tags[0]['async'] );
	}

	public function exclude_consumer_from_defer( $handles ) {
		$handles[] = 'boost-strategy-consumer';
		return $handles;
	}

	/**
	 * A script excluded from deferred JS must not be concatenated: concatenated scripts share one
	 * tag, so it would have none of its own to carry the ignore attribute and would be moved.
	 */
	public function test_handle_excluded_from_defer_is_not_bundled() {
		$defer = new Render_Blocking_JS();
		$defer->setup();
		add_filter( 'jetpack_boost_render_blocking_js_exclude_handles', array( $this, 'exclude_consumer_from_defer' ) );
		add_filter( 'js_do_concat', array( $defer, 'should_concatenate' ), 10, 2 );
		add_filter( 'script_loader_tag', array( $defer, 'handle_exclusions' ), 10, 2 );

		$scripts = new Concatenate_JS( new WP_Scripts() );
		$scripts->enqueue( $this->register( $scripts, 'consumer' ) );
		$scripts->enqueue( $this->register( $scripts, 'other' ) );
		$scripts->enqueue( $this->register( $scripts, 'last' ) );

		$tags = $this->render( $scripts );

		remove_filter( 'jetpack_boost_render_blocking_js_exclude_handles', array( $this, 'exclude_consumer_from_defer' ) );
		remove_filter( 'js_do_concat', array( $defer, 'should_concatenate' ), 10 );
		remove_filter( 'script_loader_tag', array( $defer, 'handle_exclusions' ), 10 );

		$this->assertCount( 2, $tags );
		$this->assertSame( 'boost-strategy-consumer-js', $tags[0]['id'] );
		$this->assertStringContainsString( '/consumer.js', $tags[0]['src'] );
		$this->assertSame( 'ignore', $tags[0]['ignored'] );

		$this->assertStringNotContainsString( '/consumer.js', $tags[1]['src'] );
		$this->assertStringNotContainsString( 'boost-strategy-consumer', (string) $tags[1]['data-handles'] );
		$this->assertNull( $tags[1]['ignored'] );
	}
}
