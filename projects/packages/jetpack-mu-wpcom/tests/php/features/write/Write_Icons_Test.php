<?php
/**
 * Tests for the Write editor inline SVG icons.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/write/icons.php';

/**
 * Class Write_Icons_Test
 *
 * The icons source is dependency-free (a static map printed via printf), so
 * these are plain unit tests with no WordPress environment.
 */
class Write_Icons_Test extends TestCase {

	/**
	 * Capture the output of wpcom_write_icon() for a given name.
	 *
	 * @param string $name Icon name.
	 * @return string Printed markup.
	 */
	private function render_icon( $name ) {
		ob_start();
		wpcom_write_icon( $name );
		return ob_get_clean();
	}

	/**
	 * A known icon prints the shared SVG wrapper.
	 */
	public function test_known_icon_renders_svg_wrapper() {
		$svg = $this->render_icon( 'bold' );

		$this->assertStringStartsWith( '<svg class="bw-icon"', $svg, 'Icon should render the shared bw-icon wrapper.' );
		$this->assertStringContainsString( 'aria-hidden="true"', $svg, 'Decorative icon should be hidden from assistive tech.' );
		$this->assertStringContainsString( 'viewBox="0 0 24 24"', $svg, 'Icon should use the 24x24 viewBox.' );
		$this->assertStringContainsString( 'currentColor', $svg, 'Wrapper should carry real drawing content, not be empty.' );
		$this->assertStringContainsString( '</svg>', $svg, 'Icon markup should be a complete SVG element.' );
	}

	/**
	 * An unknown name prints nothing, rather than an empty <svg> or a notice.
	 *
	 * Covers the early-return guard, which no template-rendering test exercises.
	 */
	public function test_unknown_icon_outputs_nothing() {
		$this->assertSame( '', $this->render_icon( 'does-not-exist' ), 'Unknown icon names should print nothing.' );
	}

	/**
	 * Every icon draws with currentColor and carries no hardcoded fill.
	 *
	 * The icons source documents this invariant ("Do not reintroduce hardcoded
	 * fills"): icons inherit their button's color and its hover/active/disabled
	 * states only while they draw with currentColor. This pins that contract.
	 *
	 * @dataProvider provider_icon_names
	 * @param string $name Icon name.
	 */
	#[DataProvider( 'provider_icon_names' )]
	public function test_icon_uses_current_color( $name ) {
		$svg = $this->render_icon( $name );

		$this->assertStringContainsString( 'currentColor', $svg, "Icon '$name' should draw with currentColor." );
		$this->assertDoesNotMatchRegularExpression(
			'/(?:fill|stroke)\s*=\s*"#/',
			$svg,
			"Icon '$name' should not hardcode a hex fill or stroke."
		);
	}

	/**
	 * Every icon name referenced by the Write template resolves to real markup.
	 *
	 * The template server-renders icons by name (e.g. wpcom_write_icon( 'undo' )).
	 * A renamed map key or a typo'd call site would silently render an empty icon
	 * with no PHP error, so assert the producer (icons.php) and every consumer
	 * (write.php) still agree.
	 */
	public function test_all_template_icon_names_are_defined() {
		$template = file_get_contents( Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/write/write.php' );
		$this->assertNotFalse( $template, 'Should be able to read write.php.' );

		preg_match_all( "/wpcom_write_icon\(\s*'([^']+)'/", $template, $matches );
		$names = array_unique( $matches[1] );

		$this->assertNotEmpty( $names, 'Expected the template to reference icons by name.' );

		foreach ( $names as $name ) {
			$svg = $this->render_icon( $name );
			$this->assertStringStartsWith(
				'<svg class="bw-icon"',
				$svg,
				"Template references icon '$name' but icons.php does not define it."
			);
			// currentColor proves the wrapper carries real path/stroke content:
			// a missing icon would print an empty <svg> that still starts with
			// the wrapper, so the prefix check alone would not catch it.
			$this->assertStringContainsString(
				'currentColor',
				$svg,
				"Template references icon '$name' but icons.php renders it empty."
			);
		}
	}

	/**
	 * Data provider: every icon name the template can request.
	 *
	 * @return array<int, array{0: string}>
	 */
	public static function provider_icon_names() {
		$names = array(
			'undo',
			'redo',
			'chevron-down',
			'bold',
			'italic',
			'underline',
			'strikethrough',
			'text-color',
			'align-left',
			'align-center',
			'align-right',
			'align-justify',
			'list-bullets',
			'list-numbered',
			'link',
			'quote',
			'image',
			'back',
			'kebab',
		);

		return array_map(
			static function ( $name ) {
				return array( $name );
			},
			$names
		);
	}
}
