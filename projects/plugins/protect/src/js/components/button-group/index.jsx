import { Button } from '@automattic/jetpack-components';
import { Flex } from '@wordpress/components';
import styles from './styles.module.scss';

/**
 * Button Group
 *
 * @param {object}                      props          - Component props.
 * @param { import('react').ReactNode } props.children - Component children.
 *
 * @return { import('react').ReactNode } The Button Group component.
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
