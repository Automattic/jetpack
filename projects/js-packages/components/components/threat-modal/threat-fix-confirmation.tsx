import { __ } from '@wordpress/i18n';
import { useContext } from 'react';
import ThreatActions from './threat-actions.js';
import ThreatFixDetails from './threat-fix-details.js';
import ThreatNotice from './threat-notice.js';
import ThreatSummary from './threat-summary.js';
import ThreatTechnicalDetails from './threat-technical-details.js';
import { ThreatModalContext } from './index.js';

/**
 * ThreatFixConfirmation component
 *
 * @return {JSX.Element} The rendered fix confirmation.
 */
const ThreatFixConfirmation = () => {
	const { userConnectionNeeded, siteCredentialsNeeded } = useContext( ThreatModalContext );
	return (
		<>
			<ThreatSummary />
			<ThreatTechnicalDetails />
			<ThreatFixDetails />
			{ siteCredentialsNeeded && userConnectionNeeded && (
				<ThreatNotice
					title={ 'Additional connections needed' }
					content={ __(
						'A user connection and server credentials provide Jetpack the access necessary to ignore and auto-fix threats on your site.',
						'jetpack-components'
					) }
				/>
			) }
			{ ! siteCredentialsNeeded && userConnectionNeeded && (
				<ThreatNotice
					title={ __( 'User connection needed', 'jetpack-components' ) }
					content={ __(
						'A user connection provides Jetpack the access necessary to ignore and auto-fix threats on your site.',
						'jetpack-components'
					) }
				/>
			) }
			{ siteCredentialsNeeded && ! userConnectionNeeded && (
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
