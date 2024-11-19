import { type Threat } from '@automattic/jetpack-scan';
import React, { ReactElement, useContext } from 'react';
import ThreatDetailsActions from './threat-details-actions';
import ThreatFixDetails from './threat-fix-details';
import ThreatNotice from './threat-notice';
import ThreatSummary from './threat-summary';
import ThreatTechnicalDetails from './threat-technical-details';
import { ThreatModalContext } from '.';

/**
 * ThreatDetailsGate component
 *
 * @param {object}       props                       - The component props.
 * @param {Threat}       props.threat                - The threat object containing details.
 * @param {object}       props.fixerState            - The state of the fixer (inProgress, error, stale).
 * @param {boolean}      props.fixerState.inProgress - Whether the fixer is in progress.
 * @param {boolean}      props.fixerState.error      - Whether the fixer encountered an error.
 * @param {boolean}      props.fixerState.stale      - Whether the fixer status is stale.
 * @param {Function}     props.handleUpgradeClick    - Function to handle upgrade clicks.
 * @param {ReactElement} props.children              - The child components to render if details are not shown.
 *
 * @return {JSX.Element} The rendered ThreatDetailsGate component.
 */
const ThreatDetailsGate = ( {
	threat,
	fixerState,
	handleUpgradeClick,
	children,
}: {
	threat: Threat;
	fixerState: { inProgress: boolean; error: boolean; stale: boolean };
	handleUpgradeClick: () => void;
	children: ReactElement;
} ): JSX.Element => {
	const { showThreatDetails } = useContext( ThreatModalContext );

	if ( ! showThreatDetails ) {
		return children;
	}

	return (
		<>
			<ThreatNotice fixerState={ fixerState } />
			<ThreatSummary threat={ threat } />
			<ThreatFixDetails threat={ threat } handleUpgradeClick={ handleUpgradeClick } />
			<ThreatTechnicalDetails threat={ threat } />
			<ThreatDetailsActions threat={ threat } fixerState={ fixerState } />
		</>
	);
};

export default ThreatDetailsGate;
