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
	const { children, className, xs, sm, md, lg, xl } = props;

	const colClassName = classnames( className, {
		[ styles[ `col-xs-${ xs }` ] ]: Number.isInteger( xs ),
		[ styles[ `col-sm-${ sm }` ] ]: Number.isInteger( sm ),
		[ styles[ `col-md-${ md }` ] ]: Number.isInteger( md ),
		[ styles[ `col-lg-${ lg }` ] ]: Number.isInteger( lg ),
		[ styles[ `col-xl-${ xl }` ] ]: Number.isInteger( xl ),
	} );

	return <div className={ colClassName }>{ children }</div>;
};

Col.proptypes = {
	/** Custom className to be inserted. */
	className: PropTypes.string,
	/** Colspan for extra small viewport. Needs to be an integer. */
	xs: PropTypes.number.isRequired,
	/** Colspan for small viewport. Needs to be an integer. */
	sm: PropTypes.number,
	/** Colspan for medium viewport. Needs to be an integer. */
	md: PropTypes.number,
	/** Colspan for large viewport. Needs to be an integer. */
	lg: PropTypes.number,
	/** Colspan for extra large viewport. Needs to be an integer. */
	xl: PropTypes.number,
};

export default Col;
