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
	const { children, className } = props;

	const sm = Math.min( 4, props.sm ?? 4 ); // max of 4, if undefined = 4
	const md = Math.min( 8, props.md ?? 8 ); // max of 8, if undefined = 8
	const lg = Math.min( 12, props.lg ?? 12 ); // max of 12, if undefined = 12

	const colClassName = classnames( className, {
		[ styles[ `col-sm-${ sm }` ] ]: Number.isInteger( sm ),
		[ styles[ `col-md-${ md }` ] ]: Number.isInteger( md ),
		[ styles[ `col-lg-${ lg }` ] ]: Number.isInteger( lg ),
	} );

	return <div className={ colClassName }>{ children }</div>;
};

Col.proptypes = {
	/** Custom className to be inserted. */
	className: PropTypes.string,
	/** Colspan for small viewport. Needs to be an integer. */
	sm: PropTypes.number.isRequired,
	/** Colspan for medium viewport. Needs to be an integer. */
	md: PropTypes.number,
	/** Colspan for large viewport. Needs to be an integer. */
	lg: PropTypes.number,
};

export default Col;
