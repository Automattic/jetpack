/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * JP Wrap
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} Wrap component.
 */
const Wrap = props => {
	const { children } = props;
	return <div className={ styles[ 'jp-wrap' ] }>{ children }</div>;
};

export default Wrap;
