/**
 * External dependencies
 */
import React, { useMemo } from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

export type SpinnerProps = {
	/**
	 * The spinner color.
	 */
	color?: string;
	/**
	 * CSS class names.
	 */
	className?: string;
	/**
	 * The spinner size.
	 */
	size?: number;
};

/**
 * Renders a spinner which can be used as loading indicator.
 *
 * @param {SpinnerProps} props - Component props
 * @returns {React.ReactNode}  - Rendered spinner
 */
const Spinner: React.FC< SpinnerProps > = ( { className, color = '#FFFFFF', size = 20 } ) => {
	const wrapperClassName = classNames( className, 'jp-components-spinner' );

	const styleOuter = useMemo(
		() => ( {
			width: size,
			height: size,
			fontSize: size, // allows border-width to be specified in em units
			borderTopColor: color,
		} ),
		[ color, size ]
	);

	const styleInner = useMemo(
		() => ( {
			borderTopColor: color,
			borderRightColor: color,
		} ),
		[ color ]
	);

	return (
		<div className={ wrapperClassName }>
			<div className="jp-components-spinner__outer" style={ styleOuter }>
				<div className="jp-components-spinner__inner" style={ styleInner } />
			</div>
		</div>
	);
};

export default Spinner;
