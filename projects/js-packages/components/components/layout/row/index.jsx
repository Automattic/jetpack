/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * JP Row
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} Row component.
 */
const Row = props => {
	const { children } = props;
	return <div className={ styles[ 'jp-row' ] }>{ children }</div>;
};

export default Row;
