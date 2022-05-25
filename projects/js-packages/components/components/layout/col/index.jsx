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

const smCols = Number( styles.smCols );
const mdCols = Number( styles.mdCols );
const lgCols = Number( styles.lgCols );

/**
 * The basic Col component.
 *
 * @param {object} props         - Component properties.
 * @returns {React.ReactElement}   Col component.
 */
const Col = props => {
	const { children, className } = props;

	const smSpan = Math.min( smCols, props?.sm?.span ?? props?.sm ?? smCols ); // max of 4, if undefined = 4
	const smOffset = Math.min( 12, props?.sm?.offset ?? 0 ); // max of 4, if undefined = 0

	const mdSpan = Math.min( mdCols, props?.md?.span ?? props?.md ?? mdCols ); // max of 8, if undefined = 8
	const mdOffset = Math.min( 12, props?.md?.offset ?? 0 ); // max of 8, if undefined = 0

	const lgSpan = Math.min( lgCols, props?.lg?.span ?? props?.lg ?? lgCols ); // max of 12, if undefined = 12
	const lgOffset = Math.min( 12, props?.lg?.offset ?? 0 ); // max of 12, if undefined = 0

	const colClassName = classnames( className, {
		[ styles[ `col-sm-span-${ smSpan }` ] ]: Number.isInteger( smSpan ),
		[ styles[ `col-sm-offset-${ smOffset }` ] ]: smOffset,

		[ styles[ `col-md-span-${ mdSpan }` ] ]: Number.isInteger( mdSpan ),
		[ styles[ `col-md-offset-${ mdOffset }` ] ]: mdOffset,

		[ styles[ `col-lg-span-${ lgSpan }` ] ]: Number.isInteger( lgSpan ),
		[ styles[ `col-lg-offset-${ lgOffset }` ] ]: lgOffset,
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
	/** Children to be inserted. */
	children: PropTypes.node,
};

export default Col;
