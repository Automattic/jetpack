/**
 * External dependencies
 */
import {
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
/**
 * Types
 */
import type { ReactNode } from 'react';

type EmptyWrapperProps = {
	heading?: string;
	body?: string | ReactNode;
	actions?: ReactNode;
};

/**
 * Shared empty state wrapper for dashboard screens.
 *
 * @param {EmptyWrapperProps} props - Component props.
 * @return {JSX.Element} Wrapper content.
 */
export default function EmptyWrapper( {
	heading = '',
	body = '',
	actions = null,
}: EmptyWrapperProps ) {
	return (
		<VStack alignment="center" spacing="2">
			{ heading && (
				<Text as="h3" weight="500" size="15">
					{ heading }
				</Text>
			) }
			{ body && <Text variant="muted">{ body }</Text> }
			{ actions && <span style={ { marginBlockStart: '16px' } }>{ actions }</span> }
		</VStack>
	);
}
