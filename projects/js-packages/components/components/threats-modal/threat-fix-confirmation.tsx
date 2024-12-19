import { __ } from '@wordpress/i18n';
import { useContext } from 'react';
import ContextualUpgradeTrigger from '../contextual-upgrade-trigger';
import Text from '../text';
import ThreatSeverityBadge from '../threat-severity-badge';
import styles from './styles.module.scss';
import ThreatActions from './threat-actions';
import ThreatFixDetails from './threat-fix-details';
import ThreatIgnoreDetails from './threat-ignore-details';
import ThreatNotice from './threat-notice';
import ThreatSummary from './threat-summary';
import ThreatTechnicalDetails from './threat-technical-details';
import { ThreatsModalContext } from '.';

/**
 * ThreatFixConfirmation component
 *
 * @return {JSX.Element} The rendered fix confirmation.
 */
const ThreatFixConfirmation = () => {
	const {
		currentThreats,
		isSingleThreat,
		// actionToConfirm,
		userConnectionNeeded,
		siteCredentialsNeeded,
		handleUpgradeClick,
	} = useContext( ThreatsModalContext );

	return (
		<>
			{ currentThreats.map( ( threat, index ) => (
				<div key={ threat.id || index } className={ styles[ 'threat-details' ] }>
					{ ! isSingleThreat && (
						<div className={ styles.title }>
							<Text variant="title-small">{ threat.title }</Text>
							{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
						</div>
					) }
					<ThreatSummary threat={ threat } />
					{ isSingleThreat && (
						<>
							<ThreatTechnicalDetails threat={ threat } />
							<ThreatFixDetails threat={ threat } />
						</>
					) }
				</div>
			) ) }
			{ isSingleThreat && currentThreats[ 0 ].status && <ThreatIgnoreDetails /> }
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
			{ handleUpgradeClick && (
				<ContextualUpgradeTrigger
					description={ __(
						'Looking for advanced scan results and one-click fixes?',
						'jetpack-components'
					) }
					cta={ __( 'Upgrade Jetpack now', 'jetpack-components' ) }
					onClick={ handleUpgradeClick }
				/>
			) }
			<ThreatActions />
		</>
	);
};

export default ThreatFixConfirmation;
