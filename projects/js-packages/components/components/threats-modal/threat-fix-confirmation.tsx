import { getThreatType, type Threat, THREAT_ICONS } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { useContext, useState, useCallback, useMemo } from 'react';
import ContextualUpgradeTrigger from '../contextual-upgrade-trigger';
import useBreakpointMatch from '../layout/use-breakpoint-match';
import Text from '../text';
import ThreatSeverityBadge from '../threat-severity-badge';
import ToggleControl from '../toggle-control';
import ConnectionsNotice from './connections-notice';
import styles from './styles.module.scss';
import ThreatActions from './threat-actions';
import ThreatFixDetails from './threat-fix-details';
import ThreatIgnoreDetails from './threat-ignore-details';
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

	const { currentThreats, isBulk, handleUpgradeClick } = useContext( ThreatsModalContext );

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

	const renderBulkThreat = threat => (
		<div key={ threat.id } className={ styles.bulk }>
			<div className={ styles.bulk__heading }>
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
			{ ! isSm && !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
			<ToggleControl
				className={ styles.bulk__toggle }
				size="small"
				checked={ selectedThreats.some( selectedThreat => selectedThreat.id === threat.id ) }
				onChange={ toggleHandlers[ threat.id ] }
			/>
		</div>
	);

	const renderIndividualThreat = threat => (
		<div key={ threat.id } className={ styles.individual }>
			<div className={ styles.individual__heading }>
				<div className={ styles.individual__title }>
					<Text variant="title-small">{ threat.title }</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</div>
				<ThreatSummary threat={ threat } />
			</div>
			<ThreatTechnicalDetails threat={ threat } />
			<ThreatFixDetails threat={ threat } />
			<ThreatIgnoreDetails threat={ threat } />
		</div>
	);

	return (
		<div className={ styles.threat__details }>
			{ isBulk && <Text>{ 'Jetpack will be fixing the selected threats:' }</Text> }
			{ currentThreats.map( threat =>
				isBulk ? renderBulkThreat( threat ) : renderIndividualThreat( threat )
			) }
			<ConnectionsNotice />
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
		</div>
	);
};

export default ThreatFixConfirmation;
