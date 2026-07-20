import { Col, Container, Notice } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { type FC } from 'react';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';

const LOCAL_ENVIRONMENT_NAMES: Record< string, string > = {
	studio: 'WordPress Studio',
	ddev: 'DDEV',
	lando: 'Lando',
	docksal: 'Docksal',
	serverpress: 'ServerPress',
};

/**
 * Single-line banner shown at the top of My Jetpack when the site is in Offline
 * Mode (typically a local development environment). Points to the Jetpack
 * dashboard's offline mode landing page for the full explanation, Studio
 * Preview Sites pitch, and doc links, rather than duplicating that content here.
 *
 * @return {?ReactElement} The notice, or null when not in offline mode.
 */
const LocalDevModeNotice: FC = () => {
	const { offlineMode } = useConnection();

	if ( ! offlineMode?.isActive ) {
		return null;
	}

	const { adminUrl } = getMyJetpackWindowInitialState();

	const environmentName = offlineMode.localEnvironment
		? LOCAL_ENVIRONMENT_NAMES[ offlineMode.localEnvironment ]
		: null;
	const offlineLandingPageUrl = `${ adminUrl }admin.php?page=jetpack#/dashboard`;

	const title = environmentName
		? sprintf(
				/* translators: %s: the name of a local development tool, such as WordPress Studio. */
				__( 'Local development mode (%s)', 'jetpack-my-jetpack' ),
				environmentName
		  )
		: __( 'Local development mode', 'jetpack-my-jetpack' );

	return (
		<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
			<Col>
				<Notice level={ false === offlineMode.hasInternet ? 'warning' : 'info' } title={ title }>
					<p>
						{ createInterpolateElement(
							__(
								'Features needing a connection show sample data. <a>See what still works</a>.',
								'jetpack-my-jetpack'
							),
							{ a: <a href={ offlineLandingPageUrl } /> }
						) }
					</p>
				</Notice>
			</Col>
		</Container>
	);
};

export default LocalDevModeNotice;
