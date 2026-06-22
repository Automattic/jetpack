/**
 * External dependencies
 */
import { Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './style.module.css';

interface HelloWorldAttributes {
	message?: string;
}

type HelloWorldRenderProps = {
	attributes?: HelloWorldAttributes;
};

/**
 * Renders the Hello World widget.
 *
 * @param root0            - Component props.
 * @param root0.attributes - Widget attributes.
 * @return The rendered widget.
 */
export default function HelloWorld( { attributes }: HelloWorldRenderProps ) {
	return (
		<Stack align="center" justify="center" className={ clsx( styles.root ) }>
			<Text variant="heading-2xl">{ attributes?.message || 'Hello World' }</Text>
		</Stack>
	);
}
