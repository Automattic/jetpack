import { type Threat } from '@automattic/jetpack-scan';
import React, { ReactNode, useContext } from 'react';
import ThreatActions from './threat-actions';
import ThreatFixDetails from './threat-fix-details';
import ThreatNotice from './threat-notice';
import ThreatSummary from './threat-summary';
import ThreatTechnicalDetails from './threat-technical-details';
import { ThreatModalContext } from '.';

/**
 * ThreatDetailsGate component
 *
 * @param {object}    props                       - The component props.
 * @param {string}    props.title                 - The title of the threat details.
 * @param {Threat}    props.threat                - The threat object containing details.
 * @param {object}    props.fixerState            - The state of the fixer (inProgress, error, stale).
 * @param {boolean}   props.fixerState.inProgress - Whether the fixer is in progress.
 * @param {boolean}   props.fixerState.error      - Whether the fixer encountered an error.
 * @param {boolean}   props.fixerState.stale      - Whether the fixer status is stale.
 * @param {Function}  props.handleUpgradeClick    - Function to handle upgrade clicks.
 * @param {ReactNode} props.children              - The child components to render if details are not shown.
 *
 * @return {JSX.Element} The rendered ThreatDetailsGate component.
 */
const ThreatDetailsGate = ( {
	title,
	threat,
	fixerState,
	handleUpgradeClick,
	children,
}: {
	title: string;
	threat: Threat;
	fixerState: { inProgress: boolean; error: boolean; stale: boolean };
	handleUpgradeClick: () => void;
	children: ReactNode;
} ) => {
	const { showThreatDetails } = useContext( ThreatModalContext );

	if ( showThreatDetails ) {
		return (
			<>
				<ThreatNotice fixerState={ fixerState } />
				<ThreatSummary threat={ threat } title={ title } />
				<ThreatFixDetails threat={ threat } handleUpgradeClick={ handleUpgradeClick } />
				<ThreatTechnicalDetails threat={ threat } />
				<ThreatActions threat={ threat } fixerState={ fixerState } />
			</>
		);
	}

	return <>{ children }</>;
};

export default ThreatDetailsGate;
