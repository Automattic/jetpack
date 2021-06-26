/**
 * External dependencies
 */
import React from 'react';

const PLACEHOLDER_BACKGROUND_COLOR = '#EEE';

const TextRowPlaceHolder = props => {
	const defaultStyles = {
		display: 'inline-block',
		'border-radius': '10px',
		maxHeight: '1.5em',
		width: '100%',
		height: '1em',
		backgroundColor: PLACEHOLDER_BACKGROUND_COLOR,
		// marginTop: '0.1em',
	};

	return (
		<div
			className="jp-search-dashboard__text-row-placeholder"
			style={ { ...defaultStyles, ...props.style } }
		/>
	);
};

export default TextRowPlaceHolder;
