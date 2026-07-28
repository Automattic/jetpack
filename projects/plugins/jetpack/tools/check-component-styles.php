#!/usr/bin/env php
<?php
/**
 * Script to check that the pre-rendered components ship with the styles they need.
 *
 * The components in `extensions/shared/components/index.jsx` are rendered to static
 * HTML at build time and served by `Jetpack_Components::render_component()`, which
 * enqueues a single stylesheet: `_inc/blocks/components.css`. Nothing else loads on
 * the page, so any class in that markup whose rules live in an editor-only stylesheet
 * silently renders unstyled on the frontend.
 *
 * This checks the one invariant that catches that: every class the markup uses must
 * be defined by the stylesheet that ships with it.
 *
 * @package automattic/jetpack
 */

// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped, WordPress.WP.AlternativeFunctions -- This is not WordPress code.

/**
 * Classes that come from a stylesheet `components.css` depends on rather than from
 * `components.css` itself.
 *
 * `render_component()` enqueues `jetpack-components` with `wp-components` as a
 * dependency, so WordPress' own component styles are on the page too.
 *
 * @var string[]
 */
$external_classes = array(
	'components-button',
	'is-primary',
);

chdir( dirname( __DIR__ ) );
$base   = 'projects/plugins/jetpack/';
$script = 'projects/plugins/jetpack/tools/check-component-styles.php';
$issues = array();

$tmp = $external_classes;
sort( $external_classes );
if ( $tmp !== $external_classes ) {
	$issues[ $script ][] = 'The `$external_classes` array is not sorted. Please sort it.';
}

/**
 * Extracts the class names used by a chunk of HTML.
 *
 * @param string $html HTML markup.
 * @return string[] Class names, deduplicated.
 */
function jetpack_extract_html_classes( $html ) {
	$classes = array();
	if ( preg_match_all( '/\sclass=(["\'])(.*?)\1/s', $html, $matches ) ) {
		foreach ( $matches[2] as $attr ) {
			$classes = array_merge( $classes, preg_split( '/\s+/', trim( $attr ), -1, PREG_SPLIT_NO_EMPTY ) );
		}
	}
	return array_unique( $classes );
}

/**
 * Extracts the class names a stylesheet defines rules for.
 *
 * Walks the stylesheet collecting everything that precedes a `{`, which is where
 * selectors (and at-rule preludes, which contain no classes) live, and pulls the
 * class names out of that. Declaration values are skipped, so a `content` or
 * `background-image` value that happens to contain a dot is not mistaken for a rule.
 *
 * @param string $css Stylesheet contents.
 * @return string[] Class names, deduplicated.
 */
function jetpack_extract_css_classes( $css ) {
	// Drop comments so a commented-out selector doesn't count as a rule.
	$css = preg_replace( '#/\*.*?\*/#s', '', $css );

	$classes = array();
	$buffer  = '';
	$length  = strlen( $css );
	for ( $i = 0; $i < $length; $i++ ) {
		$char = $css[ $i ];
		if ( '{' === $char ) {
			if ( preg_match_all( '/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/', $buffer, $matches ) ) {
				$classes = array_merge( $classes, $matches[1] );
			}
			$buffer = '';
		} elseif ( '}' === $char || ';' === $char ) {
			$buffer = '';
		} else {
			$buffer .= $char;
		}
	}
	return array_unique( $classes );
}

$stylesheet = '_inc/blocks/components.css';
if ( ! file_exists( $stylesheet ) ) {
	$issues[ $script ][] = "Cannot check the pre-rendered components, $stylesheet was not found.";
} else {
	$defined = array_fill_keys( jetpack_extract_css_classes( (string) file_get_contents( $stylesheet ) ), true );
	$defined = array_merge( $defined, array_fill_keys( $external_classes, true ) );

	$components = glob( '_inc/blocks/*.html' );
	if ( empty( $components ) ) {
		$issues[ $script ][] = 'Cannot check the pre-rendered components, no `_inc/blocks/*.html` files were found.';
	}
	foreach ( $components as $component ) {
		$undefined = array();
		foreach ( jetpack_extract_html_classes( (string) file_get_contents( $component ) ) as $class ) {
			if ( ! isset( $defined[ $class ] ) ) {
				$undefined[] = $class;
			}
		}
		if ( $undefined ) {
			sort( $undefined );
			$issues[ $base . $component ][] = sprintf(
				"Class(es) used by this pre-rendered component have no rule in %s, so they render unstyled on the frontend: %s.\nEither add the rules to a stylesheet that `Jetpack_Components::render_component()` loads, or drop the class from the markup.",
				$base . $stylesheet,
				implode( ', ', $undefined )
			);
		}
	}
}

if ( ! empty( $issues ) ) {
	echo "\n\n\e[1mPre-rendered component style check detected issues!\e[0m\n";
	foreach ( $issues as $file => $msgs ) {
		echo "\n\e[1mIn $file\e[0m\n" . implode( "\n", $msgs ) . "\n";
	}
	echo "\n\e[32mClasses provided by a stylesheet other than components.css may be allowed by editing the array at the top of $script.\e[0m\n\n";
	exit( 1 );
}
