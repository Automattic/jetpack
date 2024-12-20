import { getThreatType, type Threat, THREAT_ICONS } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { useContext, useState, useCallback, useMemo } from 'react';
import ContextualUpgradeTrigger from '../contextual-upgrade-trigger';
import useBreakpointMatch from '../layout/use-breakpoint-match';
import Text from '../text';
import ThreatSeverityBadge from '../threat-severity-badge';
import ToggleControl from '../toggle-control';
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
	const [ isSm ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const {
		currentThreats,
		isBulk,
		userConnectionNeeded,
		siteCredentialsNeeded,
		handleUpgradeClick,
	} = useContext( ThreatsModalContext );

	const [ selectedThreats, setSelectedThreats ] = useState( currentThreats );

	const handleToggleThreat = useCallback( ( threat: Threat, isChecked: boolean ) => {
		setSelectedThreats( prevSelectedThreats => {
			if ( isChecked ) {
				// Add the threat if it's not already in the list
				return [ ...prevSelectedThreats, threat ];
			}
			// Remove the threat if it exists in the list
			return prevSelectedThreats.filter( selectedThreat => selectedThreat.id !== threat.id );
		} );
	}, [] );

	// Memoize toggle handlers for each threat
	const toggleHandlers = useMemo( () => {
		return currentThreats.reduce( ( handlers, threat ) => {
			handlers[ threat.id ] = isChecked => handleToggleThreat( threat, isChecked );
			return handlers;
		}, {} );
	}, [ currentThreats, handleToggleThreat ] );

	return (
		<>
			{ isBulk && <Text>{ 'Jetpack will be fixing the selected threats:' }</Text> }
			{ currentThreats.map( ( threat, index ) => (
				<div key={ threat.id || index } className={ styles[ 'threat-details' ] }>
					{ isBulk ? (
						<div className={ styles.bulk }>
							<div className={ styles.bulk__content }>
								{ ! isSm && (
									<div className={ styles.bulk__media }>
										<Icon icon={ THREAT_ICONS[ getThreatType( threat ) ] } size={ 20 } />
									</div>
								) }
								<div className={ styles.bulk__title }>
									<Text variant="title-small">{ threat.title }</Text>
									<ThreatFixDetails showTitle={ false } threat={ threat } />
								</div>
							</div>
							{ ! isSm && !! threat.severity && (
								<ThreatSeverityBadge severity={ threat.severity } />
							) }
							<ToggleControl
								className={ styles.bulk__toggle }
								size="small"
								checked={ selectedThreats.some(
									selectedThreat => selectedThreat.id === threat.id
								) }
								onChange={ toggleHandlers[ threat.id ] }
							/>
						</div>
					) : (
						<>
							<ThreatSummary threat={ threat } />
							<ThreatTechnicalDetails threat={ threat } />
							<ThreatFixDetails threat={ threat } />
							<ThreatIgnoreDetails threat={ threat } />
						</>
					) }
				</div>
			) ) }
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
			<ThreatActions selectedThreats={ selectedThreats } />
		</>
	);
};

export default ThreatFixConfirmation;
