import React from 'react';
import styles from './styles.module.scss';

/**
 * Button Group
 *
 * @param {object} props                     - Component props.
 * @param { React.ReactNode } props.children - Component children.
 *
 * @returns { React.ReactNode } The Button Group component.
 */
export default function ButtonGroup( { children } ) {
	return <div className={ styles[ 'button-group' ] }>{ children }</div>;
}
