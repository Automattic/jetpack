import { __, sprintf, _n } from '@wordpress/i18n';
import { useId, useMemo, useState } from 'react';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';
import { Connection } from '../../../social-store/types';
import { ScreenDetails } from '../types';
import { Content } from './content';
import { Sidebar } from './sidebar';

/**
 * Hook to get modal screen details for social post preview.
 *
 * @return screen details
 */
export function useModalScreen(): ScreenDetails {
	const { connections, enabledConnections } = useSocialMediaConnections();

	const [ selectedConnection, setSelectedConnection ] = useState< Connection | null >(
		connections[ 0 ]
	);

	const baseId = useId();

	return useMemo(
		() => ( {
			path: '/',
			title: __( 'Preview and customize', 'jetpack-publicize-components' ),
			isScreenLocked: true,
			sidebar: (
				<Sidebar
					baseId={ baseId }
					onSelectConnection={ setSelectedConnection }
					selectedConnection={ selectedConnection }
				/>
			),
			content: <Content baseId={ baseId } selectedConnection={ selectedConnection } />,
			footerContent: enabledConnections.length ? (
				<span>
					{ sprintf(
						/* translators: %d: Number of enabled connections. */
						_n(
							'Ready to share to %d account.',
							'Ready to share to %d accounts.',
							enabledConnections.length,
							'jetpack-publicize-components'
						),
						enabledConnections.length
					) }
				</span>
			) : null,
			footerActions: [
				// TODO: Add resharing buttons here conditionally
				{
					text: __( 'Save Changes', 'jetpack-publicize-components' ),
					variant: 'primary',
				},
			],
		} ),
		[ baseId, selectedConnection, enabledConnections.length ]
	);
}
