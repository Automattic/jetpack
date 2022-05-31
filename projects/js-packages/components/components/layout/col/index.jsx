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

	const sm = Math.min( smCols, props?.sm ?? smCols ); // max of 4, if undefined = 4
	const smStart = Math.min( smCols, props?.sm?.start ?? 0 ); // max of 4, if undefined = 0
	const smEnd = Math.min( smCols, props?.sm?.end ?? 0 ); // max of 4, if undefined = 0

	const md = Math.min( mdCols, props?.md ?? mdCols ); // max of 8, if undefined = 8
	const mdStart = Math.min( mdCols, props?.md?.start ?? 0 ); // max of 8, if undefined = 0
	const mdEnd = Math.min( mdCols, props?.md?.end ?? 0 ); // max of 8, if undefined = 0

	const lg = Math.min( lgCols, props?.lg ?? lgCols ); // max of 12, if undefined = 12
	const lgStart = Math.min( lgCols, props?.lg?.start ?? 0 ); // max of 12, if undefined = 0
	const lgEnd = Math.min( lgCols, props?.lg?.end ?? 0 ); // max of 12, if undefined = 0

	const colClassName = classnames( className, {
		// SM
		[ styles[ `col-sm-${ sm }` ] ]: ! ( smStart && smEnd ),
		[ styles[ `col-sm-${ smStart }-start` ] ]: smStart > 0,
		[ styles[ `col-sm-${ smEnd }-end` ] ]: smEnd > 0,
		// MD
		[ styles[ `col-md-${ md }` ] ]: ! ( mdStart && mdEnd ),
		[ styles[ `col-md-${ mdStart }-start` ] ]: mdStart > 0,
		[ styles[ `col-md-${ mdEnd }-end` ] ]: mdEnd > 0,
		// LG
		[ styles[ `col-lg-${ lg }` ] ]: ! ( lgStart && lgEnd ),
		[ styles[ `col-lg-${ lgStart }-start` ] ]: lgStart > 0,
		[ styles[ `col-lg-${ lgEnd }-end` ] ]: lgEnd > 0,
	} );

	return <div className={ colClassName }>{ children }</div>;
};

Col.proptypes = {
	/** Custom className to be inserted. */
	className: PropTypes.string,
	/** Colspan for small viewport. Needs to be an integer. */
	sm: PropTypes.oneOfType( [
		PropTypes.number,
		PropTypes.shape( { start: PropTypes.number, end: PropTypes.number } ),
	] ),
	/** Colstart for medium viewport. Needs to be an integer. */
	md: PropTypes.oneOfType( [
		PropTypes.number,
		PropTypes.shape( { start: PropTypes.number, end: PropTypes.number } ),
	] ),
	/** Colstart for large viewport. Needs to be an integer. */
	lg: PropTypes.oneOfType( [
		PropTypes.number,
		PropTypes.shape( { start: PropTypes.number, end: PropTypes.number } ),
	] ),
	/** Children to be inserted. */
	children: PropTypes.node,
};

export default Col;
