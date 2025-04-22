import { Button } from '@automattic/jetpack-components';
import { Flex } from '@wordpress/components';
import React from 'react';
import styles from './styles.module.scss';

/**
 * Button Group
 *
 * @param {object}            props          - Component props.
 * @param { React.ReactNode } props.children - Component children.
 *
 * @return { React.ReactNode } The Button Group component.
 */
function ButtonGroup( { children, ...props } ) {
	return (
		<Flex
			gap={ 0 }
			className={ `components-button-group ${ styles[ 'button-group' ] }` }
			{ ...props }
		>
			{ children }
		</Flex>
	);
}

ButtonGroup.Button = ( { onClick, variant = 'secondary', children, ...props } ) => (
	<Button onClick={ onClick } variant={ variant } className="components-button" { ...props }>
		<span>{ children }</span>
	</Button>
);
export default ButtonGroup;
