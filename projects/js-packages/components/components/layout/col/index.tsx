import clsx from 'clsx';
import { createElement } from 'react';
import { ColProps } from '../types';
import styles from './style.module.scss';
import type React from 'react';

const smCols = Number( styles.smCols );
const mdCols = Number( styles.mdCols );
const lgCols = Number( styles.lgCols );

/**
 * The basic Col component.
 *
 * @param {ColProps} props         - Component properties.
 * @returns {React.ReactElement}   Col component.
 */
const Col: React.FC< ColProps > = props => {
	const { children, tagName = 'div', className } = props;

	const sm = Math.min( smCols, typeof props.sm === 'number' ? props.sm : smCols ); // max of 4, if undefined = 4
	const smStart = Math.min( smCols, typeof props.sm === 'object' ? props.sm.start : 0 ); // max of 4, if undefined = 0
	const smEnd = Math.min( smCols, typeof props.sm === 'object' ? props.sm.end : 0 ); // max of 4, if undefined = 0

	const md = Math.min( mdCols, typeof props.md === 'number' ? props.md : mdCols ); // max of 8, if undefined = 8
	const mdStart = Math.min( mdCols, typeof props.md === 'object' ? props.md.start : 0 ); // max of 8, if undefined = 0
	const mdEnd = Math.min( mdCols, typeof props.md === 'object' ? props.md.end : 0 ); // max of 8, if undefined = 0

	const lg = Math.min( lgCols, typeof props.lg === 'number' ? props.lg : lgCols ); // max of 12, if undefined = 12
	const lgStart = Math.min( lgCols, typeof props.lg === 'object' ? props.lg.start : 0 ); // max of 12, if undefined = 0
	const lgEnd = Math.min( lgCols, typeof props.lg === 'object' ? props.lg.end : 0 ); // max of 12, if undefined = 0

	const colClassName = clsx( className, {
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

	return createElement(
		tagName,
		{
			className: colClassName,
		},
		children
	);
};

export default Col;
