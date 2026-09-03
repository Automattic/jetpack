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
require_once __DIR__ . '/fixtures/widget-modules-manifest.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\register_widget_types
 * @covers ::Automattic\Jetpack\PremiumAnalytics\translate_widget_metadata
 * @covers ::Automattic\Jetpack\PremiumAnalytics\sanitize_widget_help
 * @covers ::Automattic\Jetpack\PremiumAnalytics\sanitize_widget_icon
 * @covers ::Automattic\Jetpack\PremiumAnalytics\sanitize_widget_actions
 * @covers ::Automattic\Jetpack\PremiumAnalytics\resolve_widget_action_href
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_widget_metadata_i18n_schema
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_widget_modules_response
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\register_widget_types' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\translate_widget_metadata' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\sanitize_widget_help' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\sanitize_widget_icon' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\sanitize_widget_actions' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\resolve_widget_action_href' )]
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
		$this->assertContains( array( 'Hello world', 'widget title', 'jetpack-premium-analytics-pkg' ), $calls, 'The title is translated under the package domain.' );
		$this->assertContains( array( 'A friendly greeting.', 'widget description', 'jetpack-premium-analytics-pkg' ), $calls, 'The description is translated under the package domain.' );
		$this->assertContains( array( 'greeting', 'widget keyword', 'jetpack-premium-analytics-pkg' ), $calls, 'Each keyword is translated under the package domain.' );
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
	 * Action labels are translated with the action label context; the other
	 * action keys pass through untouched.
	 */
	public function test_translate_widget_metadata_translates_action_labels() {
		$calls    = array();
		$callback = static function ( $translation, $text, $context, $domain ) use ( &$calls ) {
			$calls[] = array( $text, $context, $domain );
			return $translation;
		};
		add_filter( 'gettext_with_context', $callback, 10, 4 );

		$widget = translate_widget_metadata(
			array(
				'actions' => array(
					array(
						'id'    => 'export',
						'label' => 'Export CSV',
						'href'  => 'https://example.com/export.csv',
					),
				),
			)
		);

		remove_filter( 'gettext_with_context', $callback );

		$this->assertContains( array( 'Export CSV', 'widget action label', 'jetpack-premium-analytics-pkg' ), $calls, 'Each action label is translated under the package domain.' );
		$this->assertSame( 'https://example.com/export.csv', $widget['actions'][0]['href'], 'Non-translatable action keys pass through untouched.' );
	}

	/**
	 * Hydration registers manifest candidates with metadata translated,
	 * the help note sanitized, and every field mapped onto the type.
	 */
	public function test_register_widget_types_hydrates_metadata_from_manifest() {
		$GLOBALS['jpa_test_widget_manifest'] = array(
			array(
				'name'          => 'test/hydration-sentinel',
				'render_module' => 'test/hydration/render',
				'widget_module' => 'test/hydration/widget',
				'presentation'  => 'framed',
				'category'      => 'stats',
				'title'         => 'Hydration sentinel',
				'description'   => 'Carries metadata through hydration.',
				'help'          => array(
					'content' => 'Read <em>this</em> <script>carefully</script>.',
					'links'   => array(
						array(
							'label' => 'Docs',
							'href'  => 'https://example.com/docs',
						),
					),
				),
				'icon'          => 'core/chart-bar',
				'actions'       => array(
					array(
						'id'        => 'export',
						'label'     => 'Export CSV',
						'href'      => 'https://example.com/export.csv',
						'download'  => true,
						'icon'      => 'core/download',
						'relevance' => 'high',
						'extra'     => 'dropped',
					),
				),
				'keywords'      => array( 'sentinel' ),
			),
		);

		try {
			register_widget_types();

			$registered = get_registered_widget_types();
			$this->assertArrayHasKey( 'test/hydration-sentinel', $registered, 'The manifest candidate is registered.' );

			$widget_type = $registered['test/hydration-sentinel'];
			$this->assertSame( 'test/hydration/render', $widget_type->render_module, 'The render module is mapped.' );
			$this->assertSame( 'framed', $widget_type->presentation, 'The presentation is mapped.' );
			$this->assertSame( 'stats', $widget_type->category, 'The category is mapped.' );
			$this->assertSame( 'Hydration sentinel', $widget_type->title, 'The title is mapped.' );
			$this->assertSame( 'Carries metadata through hydration.', $widget_type->description, 'The description is mapped.' );
			$this->assertSame( array( 'sentinel' ), $widget_type->keywords, 'The keywords are mapped.' );
			$this->assertSame(
				array(
					'content' => 'Read <em>this</em> carefully.',
					'links'   => array(
						array(
							'label' => 'Docs',
							'href'  => 'https://example.com/docs',
						),
					),
				),
				$widget_type->help,
				'The help note is sanitized during hydration.'
			);
			$this->assertSame( 'core/chart-bar', $widget_type->icon, 'The icon reference is mapped.' );
			$this->assertSame(
				array(
					array(
						'id'        => 'export',
						'label'     => 'Export CSV',
						'href'      => 'https://example.com/export.csv',
						'download'  => true,
						'icon'      => 'core/download',
						'relevance' => 'high',
					),
				),
				$widget_type->actions,
				'The actions are sanitized during hydration.'
			);
		} finally {
			Widget_Type_Registry::get_instance()->unregister( 'test/hydration-sentinel' );
			unset( $GLOBALS['jpa_test_widget_manifest'] );
		}
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
		$this->assertSame(
			array( 'content' => 'Use <strong>bold</strong>, <em>emphasis</em> and nothing else.' ),
			sanitize_widget_help(
				array( 'content' => 'Use <strong>bold</strong>, <em>emphasis</em> and <a href="https://example.com">nothing else</a>.' )
			),
			'Only em/strong markup survives sanitization, and no other key rides along.'
		);
	}

	/**
	 * Links missing a label or href are dropped; surviving links are reduced
	 * to exactly label + href.
	 */
	public function test_sanitize_widget_help_drops_incomplete_links() {
		$this->assertSame(
			array(
				'content' => 'Read the docs.',
				'links'   => array(
					array(
						'label' => 'Docs',
						'href'  => 'https://example.com/docs',
					),
				),
			),
			sanitize_widget_help(
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
			),
			'Only complete links survive, reduced to exactly label + href.'
		);
	}

	/**
	 * Each link href goes through esc_url_raw(): a disallowed protocol drops
	 * the whole link, and safe URLs pass through unchanged.
	 */
	public function test_sanitize_widget_help_rejects_unsafe_link_protocols() {
		$this->assertSame(
			array(
				'content' => 'Read the docs.',
				'links'   => array(
					array(
						'label' => 'Docs',
						'href'  => 'https://example.com/docs',
					),
				),
			),
			sanitize_widget_help(
				array(
					'content' => 'Read the docs.',
					'links'   => array(
						array(
							'label' => 'Bad',
							'href'  => 'javascript:alert(1)',
						),
						array(
							'label' => 'Docs',
							'href'  => 'https://example.com/docs',
						),
					),
				)
			),
			'A link whose href does not survive esc_url_raw() is dropped; safe links pass unchanged.'
		);
	}

	/**
	 * When no link survives, the `links` key is omitted entirely.
	 */
	public function test_sanitize_widget_help_omits_links_when_none_survive() {
		$this->assertSame(
			array( 'content' => 'Plain.' ),
			sanitize_widget_help(
				array(
					'content' => 'Plain.',
					'links'   => array( array( 'label' => 'No href' ) ),
				)
			),
			'The links key is omitted when no link survives.'
		);
	}

	/**
	 * Only `collection/icon-name` references survive; anything else drops to null.
	 */
	public function test_sanitize_widget_icon_accepts_only_registered_icon_names() {
		$this->assertSame( 'core/chart-bar', sanitize_widget_icon( 'core/chart-bar' ), 'A registered icon name passes through.' );
		$this->assertSame( 'jpa/site_logo-2', sanitize_widget_icon( 'jpa/site_logo-2' ), 'Digits, hyphens and underscores are allowed inside a segment.' );
		$this->assertNull( sanitize_widget_icon( null ), 'Null stays null.' );
		$this->assertNull( sanitize_widget_icon( '' ), 'An empty string drops.' );
		$this->assertNull( sanitize_widget_icon( 'chart-bar' ), 'A bare name without a collection drops.' );
		$this->assertNull( sanitize_widget_icon( 'Core/Plus' ), 'Uppercase letters drop.' );
		$this->assertNull( sanitize_widget_icon( 'core/-plus' ), 'A segment cannot start with a separator.' );
		$this->assertNull( sanitize_widget_icon( 'core/plus/extra' ), 'Only two segments are allowed.' );
		$this->assertNull( sanitize_widget_icon( array( 'core/plus' ) ), 'A non-string reference drops.' );
	}

	/**
	 * Entries missing a non-empty string id, label or href are dropped; when
	 * none survive the result is null.
	 */
	public function test_sanitize_widget_actions_drops_incomplete_entries() {
		$this->assertNull( sanitize_widget_actions( null ), 'Null input stays null.' );
		$this->assertNull( sanitize_widget_actions( 'export' ), 'A non-array input is dropped.' );
		$this->assertNull(
			sanitize_widget_actions(
				array(
					'not-an-action',
					array(
						'label' => 'No id',
						'href'  => 'https://example.com',
					),
					array(
						'id'   => 'no-label',
						'href' => 'https://example.com',
					),
					array(
						'id'    => 'no-href',
						'label' => 'No href',
					),
					array(
						'id'    => '',
						'label' => 'Empty id',
						'href'  => 'https://example.com',
					),
					array(
						'id'    => 42,
						'label' => 'Numeric id',
						'href'  => 'https://example.com',
					),
				)
			),
			'Incomplete entries are dropped and an empty result becomes null.'
		);
	}

	/**
	 * Hrefs go through resolve_widget_action_href() and esc_url_raw(): absolute,
	 * scheme-relative, root-relative and single-segment admin `.php` hrefs pass;
	 * everything else drops the action with a _doing_it_wrong() notice.
	 */
	public function test_sanitize_widget_actions_keeps_only_allowed_hrefs() {
		$notices  = array();
		$callback = static function ( $function_name ) use ( &$notices ) {
			$notices[] = $function_name;
		};
		add_action( 'doing_it_wrong_run', $callback );
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );

		$actions = sanitize_widget_actions(
			array(
				array(
					'id'    => 'absolute',
					'label' => 'Absolute',
					'href'  => 'https://example.com/report.csv?range=7d',
				),
				array(
					'id'    => 'scheme-relative',
					'label' => 'Scheme relative',
					'href'  => '//example.com/report.csv',
				),
				array(
					'id'    => 'root',
					'label' => 'Root relative',
					'href'  => '/wp-admin/export.php?type=csv',
				),
				array(
					'id'    => 'admin',
					'label' => 'Admin entry point',
					'href'  => 'export.php?type=csv',
				),
				array(
					'id'    => 'script',
					'label' => 'Script',
					'href'  => 'javascript:alert(1)',
				),
				array(
					'id'    => 'traversal',
					'label' => 'Traversal',
					'href'  => '../secret.csv',
				),
				array(
					'id'    => 'nested-php',
					'label' => 'Nested PHP',
					'href'  => 'sub/dir.php',
				),
				array(
					'id'    => 'local-file',
					'label' => 'Local file',
					'href'  => 'report.csv',
				),
			)
		);

		remove_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		remove_action( 'doing_it_wrong_run', $callback );

		$this->assertSame(
			array(
				array(
					'id'    => 'absolute',
					'label' => 'Absolute',
					'href'  => 'https://example.com/report.csv?range=7d',
				),
				array(
					'id'    => 'scheme-relative',
					'label' => 'Scheme relative',
					'href'  => '//example.com/report.csv',
				),
				array(
					'id'    => 'root',
					'label' => 'Root relative',
					'href'  => '/wp-admin/export.php?type=csv',
				),
				array(
					'id'    => 'admin',
					'label' => 'Admin entry point',
					'href'  => 'export.php?type=csv',
				),
			),
			$actions,
			'Only absolute, scheme-relative, root-relative and single-segment .php hrefs survive, unchanged.'
		);
		$this->assertSame( array_fill( 0, 4, __NAMESPACE__ . '\\sanitize_widget_actions' ), $notices, 'Each dropped href is reported through _doing_it_wrong().' );
	}

	/**
	 * Optional fields are normalized: `download` keeps booleans and sanitizes
	 * filenames, `openInNewTab` casts to bool, and a malformed `icon` or
	 * `relevance` drops the key but keeps the action. Unknown keys never ride along.
	 */
	public function test_sanitize_widget_actions_normalizes_optional_fields() {
		$this->assertSame(
			array(
				array(
					'id'           => 'download-bool',
					'label'        => 'Download',
					'href'         => 'https://example.com/report.csv',
					'download'     => true,
					'openInNewTab' => true,
					'icon'         => 'core/download',
					'relevance'    => 'high',
				),
				array(
					'id'       => 'download-name',
					'label'    => 'Download as',
					'href'     => 'https://example.com/report.csv',
					'download' => 'My-Report.csv',
				),
			),
			sanitize_widget_actions(
				array(
					array(
						'id'           => 'download-bool',
						'label'        => 'Download',
						'href'         => 'https://example.com/report.csv',
						'download'     => true,
						'openInNewTab' => 1,
						'icon'         => 'core/download',
						'relevance'    => 'high',
						'extra'        => 'dropped',
					),
					array(
						'id'        => 'download-name',
						'label'     => 'Download as',
						'href'      => 'https://example.com/report.csv',
						'download'  => 'My Report.csv',
						'icon'      => 'not a reference',
						'relevance' => 'urgent',
					),
				)
			),
			'Optional fields are normalized and unknown keys dropped.'
		);
	}

	/**
	 * Every download value but `false` keeps the download: a usable filename
	 * survives sanitization, anything else falls back to the original name.
	 */
	public function test_sanitize_widget_actions_keeps_download_intent() {
		$href = 'https://example.com/export.csv';

		$actions = sanitize_widget_actions(
			array(
				array(
					'id'       => 'empty',
					'label'    => 'Empty string',
					'href'     => $href,
					'download' => '',
				),
				array(
					'id'       => 'zero',
					'label'    => 'Zero',
					'href'     => $href,
					'download' => '0',
				),
				array(
					'id'       => 'unusable',
					'label'    => 'Unusable name',
					'href'     => $href,
					'download' => '???',
				),
				array(
					'id'       => 'flag',
					'label'    => 'Boolean true',
					'href'     => $href,
					'download' => true,
				),
				array(
					'id'       => 'off',
					'label'    => 'Boolean false',
					'href'     => $href,
					'download' => false,
				),
			)
		);

		$this->assertSame( array( true, '0', true, true, false ), array_column( $actions, 'download' ), 'Only false means navigation; an unusable name downloads under the original one.' );
	}

	/**
	 * The three relevance tiers survive; any other value drops the key and
	 * keeps the action.
	 */
	public function test_sanitize_widget_actions_keeps_every_relevance_tier() {
		$href = 'https://example.com/report';

		$actions = sanitize_widget_actions(
			array(
				array(
					'id'        => 'high',
					'label'     => 'High',
					'href'      => $href,
					'relevance' => 'high',
				),
				array(
					'id'        => 'medium',
					'label'     => 'Medium',
					'href'      => $href,
					'relevance' => 'medium',
				),
				array(
					'id'        => 'low',
					'label'     => 'Low',
					'href'      => $href,
					'relevance' => 'low',
				),
				array(
					'id'        => 'unknown',
					'label'     => 'Unknown',
					'href'      => $href,
					'relevance' => 'urgent',
				),
			)
		);

		$this->assertSame( array( 'high', 'medium', 'low' ), array_column( $actions, 'relevance' ), 'Every tier survives in order.' );
		$this->assertSame( array( 'high', 'medium', 'low', 'unknown' ), array_column( $actions, 'id' ), 'An unknown tier keeps the action.' );
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
				'icon'          => 'core/chart-bar',
				'actions'       => array(
					array(
						'id'    => 'export',
						'label' => 'Export',
						'href'  => 'https://example.com/export.csv',
					),
				),
				'keywords'      => array( 'sentinel' ),
			)
		);

		// A local build/ would otherwise be required on first use and redeclare the fixture stub.
		$manifest_path = static function () {
			return __DIR__ . '/fixtures/build-entry/widgets.php';
		};
		add_filter( 'jetpack_premium_analytics_widgets_manifest_path', $manifest_path );

		$records = array();
		try {
			$records = get_widget_modules_response()->get_data();
		} finally {
			remove_filter( 'jetpack_premium_analytics_widgets_manifest_path', $manifest_path );
			$registry->unregister( 'test/metadata-sentinel' );
		}

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
		$this->assertSame( 'core/chart-bar', $record['icon'], 'The icon reference reaches the record.' );
		$this->assertSame(
			array(
				array(
					'id'    => 'export',
					'label' => 'Export',
					'href'  => 'https://example.com/export.csv',
				),
			),
			$record['actions'],
			'The actions reach the record.'
		);
		$this->assertSame( array( 'sentinel' ), $record['keywords'], 'The keywords reach the record.' );
	}
}
