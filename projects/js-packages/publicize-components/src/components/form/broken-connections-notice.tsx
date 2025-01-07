import { Button } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { store } from '../../social-store';
import { Connection } from '../../social-store/types';
import { getSocialScriptData } from '../../utils/script-data';
import Notice from '../notice';
import { useServiceLabel } from '../services/use-service-label';
import styles from './styles.module.scss';

export const BrokenConnectionsNotice: React.FC = () => {
	const brokenConnections = useSelect( select => select( store ).getBrokenConnections(), [] );

	const { connectionsPageUrl } = usePublicizeConfig();

	const { useAdminUiV1 } = getSocialScriptData().feature_flags;

	const { openConnectionsModal } = useDispatch( store );

	const fixLink = useAdminUiV1 ? (
		<Button
			variant="link"
			onClick={ openConnectionsModal }
			className={ styles[ 'broken-connection-btn' ] }
		/>
	) : (
		<ExternalLink href={ connectionsPageUrl } />
	);

	const getServiceLabel = useServiceLabel();

	if ( ! brokenConnections.length ) {
		return null;
	}

	// Group broken connections by service
	// Since Object.groupBy is not supported widely yet, we use a manual grouping
	const brokenConnectionsList = brokenConnections.reduce< Record< string, Array< Connection > > >(
		( acc, connection ) => {
			if ( ! acc[ connection.service_name ] ) {
				acc[ connection.service_name ] = [];
			}
			acc[ connection.service_name ].push( connection );
			return acc;
		},
		{}
	);

	return (
		brokenConnections.length > 0 && (
			<Notice type={ 'error' }>
				{ __(
					'Your following connections need to be reconnected:',
					'jetpack-publicize-components'
				) }
				<ul>
					{ Object.entries( brokenConnectionsList ).map( ( [ service_name, connectionsList ] ) => {
						const serviceLabel = getServiceLabel( service_name );

						return (
							<li key={ service_name }>
								<div className={ styles[ 'broken-connection-service' ] }>
									<span>
										{ serviceLabel }
										{ _x(
											':',
											'Colon to display before the list of connections',
											'jetpack-publicize-components'
										) }
										&nbsp;
									</span>
									{
										// Since Intl.ListFormat is not allowed in Jetpack yet,
										// we join the connections with a comma and space
										connectionsList.map( ( { display_name, connection_id }, i ) => (
											<Fragment key={ connection_id }>
												<span className={ styles[ 'broken-connection' ] }>{ display_name }</span>
												{ i < connectionsList.length - 1 &&
													_x(
														',',
														'Comma to separate list of social media accounts',
														'jetpack-publicize-components'
													) + ' ' }
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
						'jetpack-publicize-components'
					),
					{
						fixLink,
					}
				) }
			</Notice>
		)
	);
};
