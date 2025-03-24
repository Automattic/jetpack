import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import { SupportedService } from '../services/use-supported-services';
import { Disconnect } from './disconnect';
import { Reconnect } from './reconnect';

export type ConnectionStatusProps = {
	connection: Connection;
	service: SupportedService;
};

/**
 * Connection status component
 *
 * @param {ConnectionStatusProps} props - component props
 *
 * @return {import('react').ReactNode} - React element
 */
export function ConnectionStatus( { connection, service }: ConnectionStatusProps ) {
	const isUnsupported = useSelect(
		select => {
			return select( socialStore )
				.getServicesBy( 'status', 'unsupported' )
				.some( ( { id } ) => id === connection.service_name );
		},
		[ connection ]
	);

	const showStatus =
		// If it's broken.
		connection.status === 'broken' ||
		// If it needs re-authentication.
		connection.status === 'must_reauth' ||
		// If it's unsupported.
		isUnsupported;

	if ( ! showStatus ) {
		return null;
	}

	return (
		<div>
			<span className="description">
				{ ( ( unsupported, status ) => {
					if ( unsupported ) {
						return createInterpolateElement(
							sprintf(
								'%1$s %2$s',
								__( 'This platform is no longer supported.', 'jetpack-publicize-components' ),
								__(
									'You can use our <link>Manual Sharing</link> feature instead.',
									'jetpack-publicize-components'
								)
							),
							{
								link: (
									<ExternalLink href={ getRedirectUrl( 'jetpack-social-manual-sharing-help' ) } />
								),
							}
						);
					}

					return status === 'broken'
						? _x(
								'There is an issue with this connection.',
								'This notice is shown when a social media connection is broken.',
								'jetpack-publicize-components'
						  )
						: _x(
								'To keep sharing with this connection, please reconnect it.',
								'This notice is shown when a social media connection needs to be reconnected.',
								'jetpack-publicize-components'
						  );
				} )( isUnsupported, connection.status ) }
			</span>
			&nbsp;
			{ ! isUnsupported && service ? (
				<Reconnect connection={ connection } service={ service } />
			) : (
				<Disconnect connection={ connection } variant="link" isDestructive={ false } />
			) }
		</div>
	);
}
