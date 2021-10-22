/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import './style.scss';

const Spinner = props => {
	const className = props.className + ' jp-components-spinner';

	const styleOuter = {
		width: props.size,
		height: props.size,
		fontSize: props.size, // allows border-width to be specified in em units
		borderTopColor: props.color,
	};

	const styleInner = {
		borderTopColor: props.color,
		borderRightColor: props.color,
	};

	return (
		<div className={ className }>
			<div className="jp-components-spinner__outer" style={ styleOuter }>
				<div className="jp-components-spinner__inner" style={ styleInner } />
			</div>
		</div>
	);
};

Spinner.propTypes = {
	color: PropTypes.string,
	className: PropTypes.string,
	size: PropTypes.number,
};

Spinner.defaultProps = {
	color: '#000000',
	className: '',
	size: 20,
};

export default Spinner;
