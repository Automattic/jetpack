import { __ } from '@wordpress/i18n';
import { useContext } from 'react';
import ThreatNotice from './threat-notice';
import { ThreatsModalContext } from '.';

/**
 * ConnectionsNotice component
 *
 * @return {JSX.Element | null} The rendered connections notice or null if no notice is available.
 */
const ConnectionsNotice = () => {
	const { siteCredentialsNeeded, userConnectionNeeded } = useContext( ThreatsModalContext );

	if ( ! siteCredentialsNeeded && ! userConnectionNeeded ) {
		return null;
	}

	if ( siteCredentialsNeeded && userConnectionNeeded ) {
		return (
			<ThreatNotice
				title={ 'Additional connections needed' }
				content={ __(
					'A user connection and server credentials provide Jetpack the access necessary to ignore and auto-fix threats on your site.',
					'jetpack-components'
				) }
			/>
		);
	}

	if ( ! siteCredentialsNeeded && userConnectionNeeded ) {
		return (
			<ThreatNotice
				title={ __( 'User connection needed', 'jetpack-components' ) }
				content={ __(
					'A user connection provides Jetpack the access necessary to ignore and auto-fix threats on your site.',
					'jetpack-components'
				) }
			/>
		);
	}

	if ( siteCredentialsNeeded && ! userConnectionNeeded ) {
		return (
			<ThreatNotice
				title={ __( 'Site credentials needed', 'jetpack-components' ) }
				content={ __(
					'Your server credentials allow Jetpack to access the server that’s powering your website. This information is securely saved and only used to ignore and auto-fix threats detected on your site.',
					'jetpack-components'
				) }
			/>
		);
	}

	return null;
};

export default ConnectionsNotice;
