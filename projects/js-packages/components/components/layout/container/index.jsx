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
	const containerClassName = classNames( className, styles.container, {
		[ styles.fluid ]: fluid,
	} );

	return <div className={ containerClassName }>{ children }</div>;
};

Container.propTypes = {
	className: PropTypes.string,
	fluid: PropTypes.bool,
};

Container.defaultProps = {
	fluid: false,
};

export default Container;
