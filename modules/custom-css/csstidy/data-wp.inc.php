<?php

unset( $GLOBALS['csstidy']['all_properties']['binding'] );

$GLOBALS['csstidy']['all_properties']['text-size-adjust'] = 'CSS3.0';

// Support browser prefixes for properties only in the latest CSS draft
foreach ( $GLOBALS['csstidy']['all_properties'] as $property => $levels ) {
	if ( strpos( $levels, "," ) === false ) {
		$GLOBALS['csstidy']['all_properties']['-moz-' . $property] = $levels;
		$GLOBALS['csstidy']['all_properties']['-webkit-' . $property] = $levels;
		$GLOBALS['csstidy']['all_properties']['-ms-' . $property] = $levels;
		$GLOBALS['csstidy']['all_properties']['-o-' . $property] = $levels;
		$GLOBALS['csstidy']['all_properties']['-khtml-' . $property] = $levels;

		if ( in_array( $property, $GLOBALS['csstidy']['unit_values'] ) ) {
			$GLOBALS['csstidy']['unit_values'][] = '-moz-' . $property;
			$GLOBALS['csstidy']['unit_values'][] = '-webkit-' . $property;
			$GLOBALS['csstidy']['unit_values'][] = '-ms-' . $property;
			$GLOBALS['csstidy']['unit_values'][] = '-o-' . $property;
			$GLOBALS['csstidy']['unit_values'][] = '-khtml-' . $property;
		}

		if ( in_array( $property, $GLOBALS['csstidy']['color_values'] ) ) {
			$GLOBALS['csstidy']['color_values'][] = '-moz-' . $property;
			$GLOBALS['csstidy']['color_values'][] = '-webkit-' . $property;
			$GLOBALS['csstidy']['color_values'][] = '-ms-' . $property;
			$GLOBALS['csstidy']['color_values'][] = '-o-' . $property;
			$GLOBALS['csstidy']['color_values'][] = '-khtml-' . $property;
		}
	}
}

foreach ( $GLOBALS['csstidy']['multiple_properties'] as $property ) {
	if ( '-' != $property[0] ) {
		$GLOBALS['csstidy']['multiple_properties'][] = '-o-' . $property;
		$GLOBALS['csstidy']['multiple_properties'][] = '-ms-' . $property;
		$GLOBALS['csstidy']['multiple_properties'][] = '-webkit-' . $property;
		$GLOBALS['csstidy']['multiple_properties'][] = '-moz-' . $property;
		$GLOBALS['csstidy']['multiple_properties'][] = '-khtml-' . $property;
	}
}

/**
 * CSS Animation
 *
 * @see https://developer.mozilla.org/en/CSS/CSS_animations
 */
$GLOBALS['csstidy']['at_rules']['-webkit-keyframes'] = 'at';
$GLOBALS['csstidy']['at_rules']['-moz-keyframes'] = 'at';
$GLOBALS['csstidy']['at_rules']['-ms-keyframes'] = 'at';

/**
 * Non-standard CSS properties.  They're not part of any spec, but we say
 * they're in all of them so that we can support them.
 */
$GLOBALS['csstidy']['all_properties']['-webkit-filter'] = 'CSS2.0,CSS2.1,CSS3.0';
$GLOBALS['csstidy']['all_properties']['-moz-filter'] = 'CSS2.0,CSS2.1,CSS3.0';
$GLOBALS['csstidy']['all_properties']['-ms-filter'] = 'CSS2.0,CSS2.1,CSS3.0';
$GLOBALS['csstidy']['all_properties']['filter'] = 'CSS2.0,CSS2.1,CSS3.0';
$GLOBALS['csstidy']['all_properties']['scrollbar-face-color'] = 'CSS2.0,CSS2.1,CSS3.0';
$GLOBALS['csstidy']['all_properties']['-ms-interpolation-mode'] = 'CSS2.0,CSS2.1,CSS3.0';
$GLOBALS['csstidy']['all_properties']['text-rendering'] = 'CSS2.0,CSS2.1,CSS3.0';
$GLOBALS['csstidy']['all_properties']['-webkit-transform-origin-x'] = 'CSS3.0';
$GLOBALS['csstidy']['all_properties']['-webkit-transform-origin-y'] = 'CSS3.0';
$GLOBALS['csstidy']['all_properties']['-webkit-transform-origin-z'] = 'CSS3.0';
$GLOBALS['csstidy']['all_properties']['-webkit-font-smoothing'] = 'CSS3.0';
$GLOBALS['csstidy']['all_properties']['-font-smooth'] = 'CSS3.0';
$GLOBALS['csstidy']['all_properties']['-o-object-fit'] = 'CSS3.0';
$GLOBALS['csstidy']['all_properties']['object-fit'] = 'CSS3.0';
$GLOBALS['csstidy']['all_properties']['-o-object-position'] = 'CSS3.0';
$GLOBALS['csstidy']['all_properties']['object-position'] = 'CSS3.0';
$GLOBALS['csstidy']['all_properties']['text-overflow'] = 'CSS3.0';
$GLOBALS['csstidy']['all_properties']['zoom'] = 'CSS3.0';

