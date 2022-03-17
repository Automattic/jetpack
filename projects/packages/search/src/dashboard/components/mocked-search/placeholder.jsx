/**
 * External dependencies
 */
import React from 'react';

const TextRowPlaceHolder = props => {
	const defaultStyles = {
		display: 'inline-block',
		borderRadius: '10px',
		maxHeight: '1.5em',
		width: '100%',
		height: '1em',
		backgroundColor: '#E9EFF3',
	};

	return (
		<div
			className="jp-search-dashboard__text-row-placeholder"
			style={ { ...defaultStyles, ...props.style } }
		/>
	);
};

export default TextRowPlaceHolder;
