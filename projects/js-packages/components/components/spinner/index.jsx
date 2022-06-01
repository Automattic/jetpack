import PropTypes from 'prop-types';
import React from 'react';

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
	/** The spinner color. */
	color: PropTypes.string,
	/** CSS class names. */
	className: PropTypes.string,
	/** The spinner size. */
	size: PropTypes.number,
};

Spinner.defaultProps = {
	color: '#FFFFFF',
	className: '',
	size: 20,
};

export default Spinner;
