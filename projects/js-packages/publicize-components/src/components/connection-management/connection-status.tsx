import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
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
	if ( connection.status !== 'broken' && connection.status !== 'must_reauth' ) {
		return null;
	}

	const statusMessage =
		connection.status === 'broken'
			? __( 'There is an issue with this connection.', 'jetpack-publicize-components' )
			: __(
					'To keep sharing with this connection, please reconnect it.',
					'jetpack-publicize-components'
			  );

	return (
		<div>
			<span className="description">
				{ service
					? statusMessage
					: createInterpolateElement(
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
					  ) }
			</span>
			&nbsp;
			{ service ? (
				<Reconnect connection={ connection } service={ service } />
			) : (
				<Disconnect connection={ connection } variant="link" isDestructive={ false } />
			) }
		</div>
	);
}
