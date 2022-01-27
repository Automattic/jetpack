/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * JP Container
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} Container component.
 */
const Container = props => {
	const { children, fluid, className } = props;

	const horizontalSpacing = `calc( var(--horizontal-spacing) * ${ props.horizontalSpacing } )`;
	const horizontalGap = `calc( var(--horizontal-spacing) * ${ props.horizontalGap } )`;

	const containerStyle = {
		paddingTop: horizontalSpacing,
		paddingBottom: horizontalSpacing,
		rowGap: horizontalGap,
	};

	const containerClassName = classNames( className, styles.container, {
		[ styles.fluid ]: fluid,
	} );

	return (
		<div className={ containerClassName } style={ containerStyle }>
			{ children }
		</div>
	);
};

Container.propTypes = {
	fluid: PropTypes.bool,
	className: PropTypes.string,
	horizontalSpacing: PropTypes.number,
	horizontalGap: PropTypes.number,
};

Container.defaultProps = {
	fluid: false,
	horizontalGap: 1,
	horizontalSpacing: 1,
};

export default Container;
