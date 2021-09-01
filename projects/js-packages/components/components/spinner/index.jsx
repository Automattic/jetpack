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

	const style = {
		width: props.size,
		height: props.size,
		fontSize: props.size, // allows border-width to be specified in em units
	};

	return (
		<div className={ className }>
			<div className="jp-components-spinner__outer" style={ style }>
				<div className="jp-components-spinner__inner" />
			</div>
		</div>
	);
};

Spinner.propTypes = {
	className: PropTypes.string,
	size: PropTypes.number,
};

Spinner.defaultProps = {
	size: 20,
	className: '',
};

export default Spinner;
