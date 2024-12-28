import { __ } from '@wordpress/i18n';
import { useContext } from 'react';
import ThreatActions from './threat-actions';
import ThreatFixDetails from './threat-fix-details';
import ThreatNotice from './threat-notice';
import ThreatSummary from './threat-summary';
import ThreatTechnicalDetails from './threat-technical-details';
import { ThreatModalContext } from '.';

const ThreatFixConfirmation = (): JSX.Element => {
	const { connection, credentials } = useContext( ThreatModalContext );
	const userConnectionNeeded = ! connection.isUserConnected || ! connection.hasConnectedOwner;

	return (
		<>
			<ThreatSummary />
			<ThreatTechnicalDetails />
			<ThreatFixDetails />
			{ ! credentials.hasCredentials && userConnectionNeeded && (
				<ThreatNotice
					title={ 'Additional connections needed' }
					content={ __(
						'A user connection and server credentials provide Jetpack the access necessary to ignore and auto-fix threats on your site.',
						'jetpack-components'
					) }
				/>
			) }
			{ ! credentials.hasCredentials && userConnectionNeeded && (
				<ThreatNotice
					title={ __( 'User connection needed', 'jetpack-components' ) }
					content={ __(
						'A user connection provides Jetpack the access necessary to ignore and auto-fix threats on your site.',
						'jetpack-components'
					) }
				/>
			) }
			{ credentials.hasCredentials && ! userConnectionNeeded && (
				<ThreatNotice
					title={ __( 'Site credentials needed', 'jetpack-components' ) }
					content={ __(
						'Your server credentials allow Jetpack to access the server that’s powering your website. This information is securely saved and only used to ignore and auto-fix threats detected on your site.',
						'jetpack-components'
					) }
				/>
			) }
			<ThreatActions />
		</>
	);
};

export default ThreatFixConfirmation;
