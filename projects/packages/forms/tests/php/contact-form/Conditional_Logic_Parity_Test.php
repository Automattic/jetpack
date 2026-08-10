<?php
/**
 * Guards the contract between the two conditional-logic evaluators.
 *
 * Conditional logic is implemented twice: once in TypeScript for the editor and the browser
 * runtime, once in PHP for validation and storage. They agree only by convention, and a
 * silent divergence is expensive — a field the visitor never saw gets stored, or an answer
 * they did give gets dropped. These tests turn that convention into a failing build.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

/**
 * @covers Automattic\Jetpack\Forms\ContactForm\Conditional_Logic
 */
#[CoversClass( Conditional_Logic::class )]
class Conditional_Logic_Parity_Test extends TestCase {

	/**
	 * Absolute path to the TypeScript module that owns the shared vocabulary.
	 *
	 * @return string
	 */
	private function field_types_path(): string {
		return __DIR__ . '/../../../src/blocks/shared/conditional-logic/util/field-types.ts';
	}

	/**
	 * Read the TypeScript source that defines the shared tables.
	 *
	 * @return string
	 */
	private function field_types_source(): string {
		$path = $this->field_types_path();
		$this->assertFileExists( $path, 'field-types.ts moved; update this test to match.' );

		$source = file_get_contents( $path );
		$this->assertNotEmpty( $source, 'field-types.ts is empty.' );

		return $source;
	}

	/**
	 * The PHP operator constants must match the TypeScript OPERATORS values exactly.
	 *
	 * Operator strings are persisted in post content, so a rename on one side silently stops
	 * matching rules saved by the other.
	 */
	public function test_php_operator_constants_match_the_typescript_source() {
		$source = $this->field_types_source();

		$matched = preg_match( '/export const OPERATORS = \{(.*?)\} as const;/s', $source, $block );
		$this->assertSame( 1, $matched, 'Could not locate the OPERATORS object in field-types.ts.' );

		preg_match_all( "/^\s*[A-Z_]+:\s*'([a-z_]+)',/m", $block[1], $matches );
		$ts_operators = $matches[1];
		$this->assertNotEmpty( $ts_operators, 'No operators parsed from field-types.ts.' );

		$php_operators = array();
		foreach ( ( new ReflectionClass( Conditional_Logic::class ) )->getConstants() as $name => $value ) {
			if ( 0 === strpos( $name, 'OP_' ) ) {
				$php_operators[] = $value;
			}
		}

		sort( $ts_operators );
		sort( $php_operators );

		$this->assertSame(
			$ts_operators,
			$php_operators,
			'Operator drift between field-types.ts and Conditional_Logic.'
		);
	}

	/**
	 * Both sides must agree on how a shortcode field type compares.
	 *
	 * The editor keys off block names and the runtime keys off shortcode types; this table is
	 * where the two meet, so it has to be identical in both languages.
	 */
	public function test_php_field_type_table_matches_the_typescript_source() {
		$source = $this->field_types_source();

		$matched = preg_match(
			'/export const TYPE_KEY_BY_FIELD_TYPE: Record< string, TypeKey > = \{(.*?)\n\};/s',
			$source,
			$block
		);
		$this->assertSame( 1, $matched, 'Could not locate TYPE_KEY_BY_FIELD_TYPE in field-types.ts.' );

		preg_match_all( "/^\s*'?([a-z-]+)'?:\s*'([a-z]+)',/m", $block[1], $matches, PREG_SET_ORDER );
		$this->assertNotEmpty( $matches, 'No field type entries parsed from field-types.ts.' );

		$ts_table = array();
		foreach ( $matches as $entry ) {
			$ts_table[ $entry[1] ] = $entry[2];
		}

		$php_table = Conditional_Logic::TYPE_KEY_BY_FIELD_TYPE;

		ksort( $ts_table );
		ksort( $php_table );

		$this->assertSame(
			$ts_table,
			$php_table,
			'Field type mapping drift between field-types.ts and Conditional_Logic.'
		);
	}

}
