/**
 * External dependencies
 */
import React from 'react';

/**
 * Relies on WordPress core styling via "screen-reader-text" class:
 * https://make.wordpress.org/accessibility/handbook/markup/the-css-class-screen-reader-text/
 */

export default function ScreenReaderText( { children } ) {
	return <span className="screen-reader-text">{ children }</span>;
}
