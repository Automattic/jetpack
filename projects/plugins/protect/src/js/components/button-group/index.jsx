import { Button } from '@automattic/jetpack-components';
import { ButtonGroup as WordPressButtonGroup } from '@wordpress/components';
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
function ButtonGroup( { children, ...props } ) {
	return (
		<WordPressButtonGroup className={ styles[ 'button-group' ] } { ...props }>
			{ children }
		</WordPressButtonGroup>
	);
}

ButtonGroup.Button = props => <Button { ...props } />;

export default ButtonGroup;
