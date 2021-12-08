/**
 * External dependencies
 */
import React from 'react';

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
	const { children } = props;
	return <div className={ styles[ 'jp-container' ] }>{ children }</div>;
};

export default Container;
