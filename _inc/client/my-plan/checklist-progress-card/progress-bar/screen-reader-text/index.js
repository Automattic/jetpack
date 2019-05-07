/**
 * External dependencies
 */
import React from 'react';

/**
 * Style dependencies
 */
// Unused in current build system
// import './style.scss';

export default function ScreenReaderText( { children } ) {
	return <span className="screen-reader-text">{ children }</span>;
}
