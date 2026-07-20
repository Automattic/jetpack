/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { HelloWorldAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type HelloWorldWidgetProps = WidgetRenderProps< HelloWorldAttributes >;

/**
 * Renders the Hello World widget.
 *
 * @param {HelloWorldWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function HelloWorld( { attributes = {} }: HelloWorldWidgetProps ) {
	return (
		<Stack align="center" justify="center" className={ styles.root }>
			<Text variant="heading-2xl" render={ <h2 /> }>
				{ attributes.message || __( 'Hello World', 'jetpack-premium-analytics' ) }
			</Text>
		</Stack>
	);
}
