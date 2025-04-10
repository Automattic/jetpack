import { __ } from '@wordpress/i18n';
import { useContext } from 'react';
import { ThreatModalContext } from './index.tsx';
import ThreatActions from './threat-actions.tsx';
import ThreatFixDetails from './threat-fix-details.tsx';
import ThreatNotice from './threat-notice.tsx';
import ThreatSummary from './threat-summary.tsx';
import ThreatTechnicalDetails from './threat-technical-details.tsx';

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
						'jetpack-scan'
					) }
				/>
			) }
			{ ! siteCredentialsNeeded && userConnectionNeeded && (
				<ThreatNotice
					title={ __( 'User connection needed', 'jetpack-scan' ) }
					content={ __(
						'A user connection provides Jetpack the access necessary to ignore and auto-fix threats on your site.',
						'jetpack-scan'
					) }
				/>
			) }
			{ siteCredentialsNeeded && ! userConnectionNeeded && (
				<ThreatNotice
					title={ __( 'Site credentials needed', 'jetpack-scan' ) }
					content={ __(
						'Your server credentials allow Jetpack to access the server that’s powering your website. This information is securely saved and only used to ignore and auto-fix threats detected on your site.',
						'jetpack-scan'
					) }
				/>
			) }
			<ThreatActions />
		</>
	);
};

export default ThreatFixConfirmation;
