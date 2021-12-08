/**
 * External dependencies
 */
import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * The basic Col component.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} Col component.
 */
const Col = props => {
	const { children, sm, md, lg } = props;
	const small = Number.isInteger( sm ) ? sm : 0;
	const medium = Number.isInteger( md ) ? md : 0;
	const large = Number.isInteger( lg ) ? lg : 0;
	const minimum = [ small, medium, large ].reduce( ( prev, curr ) =>
		curr > 0 && curr < prev ? curr : prev
	);

	const className = classnames(
		small > 0 ? styles[ 'sm-col-span-' + small ] : styles[ 'sm-col-span-' + minimum ],
		medium > 0 ? styles[ 'md-col-span-' + medium ] : styles[ 'md-col-span-' + minimum ],
		large > 0 ? styles[ 'lg-col-span-' + large ] : styles[ 'lg-col-span-' + minimum ]
	);
	return <div className={ className }>{ children }</div>;
};

Col.proptypes = {
	/** Colspan for small viewport. Needs to be an integer. Defaults to the smallest colspan informed. */
	sm: PropTypes.number,
	/** Colspan for medium viewport. Needs to be an integer. Defaults to the smallest colspan informed. */
	md: PropTypes.number,
	/** Colspan for large viewport. Needs to be an integer. Defaults to the smallest colspan informed. */
	lg: PropTypes.number,
};

export default Col;
