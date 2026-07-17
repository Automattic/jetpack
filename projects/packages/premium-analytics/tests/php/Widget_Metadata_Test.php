<?php
/**
 * Tests for the widget metadata pipeline: manifest fields translated,
 * sanitized, and exposed through the widget-modules REST record.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/widget-types.php';
require_once __DIR__ . '/../../src/widget-modules.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\translate_widget_metadata
 * @covers ::Automattic\Jetpack\PremiumAnalytics\sanitize_widget_help
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_widget_metadata_i18n_schema
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_widget_modules_response
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\translate_widget_metadata' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\sanitize_widget_help' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_widget_metadata_i18n_schema' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_widget_modules_response' )]
class Widget_Metadata_Test extends BaseTestCase {

	/**
	 * Without a declared textdomain, strings are translated under the package
	 * text domain, using the contexts from widget-i18n.json.
	 */
	public function test_translate_widget_metadata_defaults_to_package_textdomain() {
		$calls    = array();
		$callback = static function ( $translation, $text, $context, $domain ) use ( &$calls ) {
			$calls[] = array( $text, $context, $domain );
			return $translation;
		};
		add_filter( 'gettext_with_context', $callback, 10, 4 );

		$widget = translate_widget_metadata(
			array(
				'name'        => 'jpa/hello-world',
				'title'       => 'Hello world',
				'description' => 'A friendly greeting.',
				'keywords'    => array( 'greeting' ),
			)
		);

		remove_filter( 'gettext_with_context', $callback );

		$this->assertSame( 'Hello world', $widget['title'], 'Untranslated strings pass through unchanged.' );
		$this->assertContains( array( 'Hello world', 'widget title', 'jetpack-premium-analytics' ), $calls, 'The title is translated under the package domain.' );
		$this->assertContains( array( 'A friendly greeting.', 'widget description', 'jetpack-premium-analytics' ), $calls, 'The description is translated under the package domain.' );
		$this->assertContains( array( 'greeting', 'widget keyword', 'jetpack-premium-analytics' ), $calls, 'Each keyword is translated under the package domain.' );
	}

	/**
	 * A widget-declared textdomain wins over the package default.
	 */
	public function test_translate_widget_metadata_honors_declared_textdomain() {
		$calls    = array();
		$callback = static function ( $translation, $text, $context, $domain ) use ( &$calls ) {
			$calls[] = array( $text, $context, $domain );
			return $translation;
		};
		add_filter( 'gettext_with_context', $callback, 10, 4 );

		translate_widget_metadata(
			array(
				'title'      => 'Hello world',
				'textdomain' => 'my-widget-pack',
			)
		);

		remove_filter( 'gettext_with_context', $callback );

		$this->assertContains( array( 'Hello world', 'widget title', 'my-widget-pack' ), $calls, 'The declared textdomain is used for translation.' );
	}

	/**
	 * A help note without usable string content sanitizes to null.
	 */
	public function test_sanitize_widget_help_requires_string_content() {
		$this->assertNull( sanitize_widget_help( null ), 'Null input stays null.' );
		$this->assertNull( sanitize_widget_help( array() ), 'A help note without content is dropped.' );
		$this->assertNull( sanitize_widget_help( array( 'content' => '' ) ), 'Empty content is dropped.' );
		$this->assertNull( sanitize_widget_help( array( 'content' => 42 ) ), 'Non-string content is dropped.' );
	}

	/**
	 * Help content keeps only `em`/`strong` markup.
	 */
	public function test_sanitize_widget_help_keeps_only_emphasis_markup() {
		$help = sanitize_widget_help(
			array( 'content' => 'Use <strong>bold</strong>, <em>emphasis</em> and <a href="https://example.com">nothing else</a>.' )
		);

		$this->assertSame( 'Use <strong>bold</strong>, <em>emphasis</em> and nothing else.', $help['content'], 'Only em/strong markup survives sanitization.' );
	}

	/**
	 * Links missing a label or href are dropped; surviving links are reduced
	 * to exactly label + href.
	 */
	public function test_sanitize_widget_help_drops_incomplete_links() {
		$help = sanitize_widget_help(
			array(
				'content' => 'Read the docs.',
				'links'   => array(
					array(
						'label'  => 'Docs',
						'href'   => 'https://example.com/docs',
						'target' => '_blank',
					),
					array( 'label' => 'No href' ),
					array( 'href' => 'https://example.com/no-label' ),
					'not-a-link',
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'label' => 'Docs',
					'href'  => 'https://example.com/docs',
				),
			),
			$help['links'],
			'Only complete links survive, reduced to label + href.'
		);
	}

	/**
	 * When no link survives, the `links` key is omitted entirely.
	 */
	public function test_sanitize_widget_help_omits_links_when_none_survive() {
		$help = sanitize_widget_help(
			array(
				'content' => 'Plain.',
				'links'   => array( array( 'label' => 'No href' ) ),
			)
		);

		$this->assertArrayNotHasKey( 'links', $help, 'The links key is omitted when no link survives.' );
	}

	/**
	 * A registered widget type's metadata reaches the widget-modules REST
	 * record intact.
	 */
	public function test_widget_modules_record_carries_metadata() {
		$registry = Widget_Type_Registry::get_instance();
		$registry->register(
			'test/metadata-sentinel',
			array(
				'render_module' => 'test/render',
				'widget_module' => 'test/widget',
				'presentation'  => 'framed',
				'category'      => 'stats',
				'title'         => 'Sentinel',
				'description'   => 'Metadata carrier.',
				'help'          => array( 'content' => 'Helpful.' ),
				'keywords'      => array( 'sentinel' ),
			)
		);

		$records = get_widget_modules_response()->get_data();

		$registry->unregister( 'test/metadata-sentinel' );

		$record = null;
		foreach ( $records as $candidate ) {
			if ( 'test/metadata-sentinel' === $candidate['name'] ) {
				$record = $candidate;
			}
		}

		$this->assertNotNull( $record, 'The registered widget type appears in the REST record list.' );
		$this->assertSame( 'stats', $record['category'], 'The category reaches the record.' );
		$this->assertSame( 'Sentinel', $record['title'], 'The title reaches the record.' );
		$this->assertSame( 'Metadata carrier.', $record['description'], 'The description reaches the record.' );
		$this->assertSame( array( 'content' => 'Helpful.' ), $record['help'], 'The help note reaches the record.' );
		$this->assertSame( array( 'sentinel' ), $record['keywords'], 'The keywords reach the record.' );
	}
}
