import { Button } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store } from '../../social-store';
import Notice from '../notice';
import { SupportedService, useSupportedServices } from '../services/use-supported-services';
import styles from './styles.module.scss';
import { checkConnectionCode } from './utils';

export const BrokenConnectionsNotice: React.FC = () => {
	const { connections } = useSocialMediaConnections();

	const brokenConnections = connections.filter( connection => {
		return (
			connection.status === 'broken' ||
			// This is a legacy check for connections that are not healthy.
			// TODO remove this check when we are sure that all connections have
			// the status property (same schema for connections endpoints), e.g. on Simple/Atomic sites
			checkConnectionCode( connection, 'broken' )
		);
	} );

	const { connectionsAdminUrl } = usePublicizeConfig();

	const useAdminUiV1 = useSelect( select => select( store ).useAdminUiV1(), [] );
	const { openConnectionsModal } = useDispatch( store );

	const fixLink = useAdminUiV1 ? (
		<Button
			variant="link"
			onClick={ openConnectionsModal }
			className={ styles[ 'broken-connection-btn' ] }
		/>
	) : (
		<ExternalLink href={ connectionsAdminUrl } />
	);

	const supportedServices = useSupportedServices();

	if ( ! brokenConnections.length ) {
		return null;
	}

	const servicesMap = supportedServices.reduce< Record< string, SupportedService > >(
		( acc, service ) => {
			acc[ service.ID ] = service;
			return acc;
		},
		{}
	);

	// Group broken connections by service
	const brokenConnectionsList = Object.groupBy(
		brokenConnections,
		connection => connection.service_name
	);

	return (
		brokenConnections.length > 0 && (
			<Notice type={ 'error' }>
				{ __( 'Your following connections are broken:', 'jetpack' ) }
				<ul>
					{ Object.entries( brokenConnectionsList ).map( ( [ service_name, connectionsList ] ) => {
						const service = servicesMap[ service_name ];

						if ( ! service ) {
							return null;
						}

						return (
							<li key={ service.ID }>
								<div className={ styles[ 'broken-connection-service' ] }>
									<span>
										{ service.label }
										{ _x( ':', 'Colon to display before the list of connections', 'jetpack' ) }
										&nbsp;
									</span>
									{
										// Since Intl.ListFormat is not allowed in Jetpack yet,
										// we join the connections with a comma and space
										connectionsList.map( ( { display_name, external_display, id }, i ) => (
											<Fragment key={ id }>
												<span className={ styles[ 'broken-connection' ] }>
													{ display_name || external_display }
												</span>
												{ i < connectionsList.length - 1 &&
													_x( ',', 'Comma to separate list of social media accounts', 'jetpack' ) +
														' ' }
											</Fragment>
										) )
									}
								</div>
							</li>
						);
					} ) }
				</ul>
				{ createInterpolateElement(
					_x(
						'Please reconnect them in the <fixLink>connections management</fixLink> section.',
						'"them" refers to the broken connections.',
						'jetpack'
					),
					{
						fixLink,
					}
				) }
			</Notice>
		)
	);
};
