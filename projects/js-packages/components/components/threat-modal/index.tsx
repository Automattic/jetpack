import { Button, ThreatSeverityBadge } from '@automattic/jetpack-components';
import { type Threat, getFixerState } from '@automattic/jetpack-scan';
import { Modal, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import Text from '../text';
import styles from './styles.module.scss';
import ThreatActions from './threat-actions';
import ThreatFixDetails from './threat-fix-details';
import ThreatTechnicalDetails from './threat-technical-details';

/**
 * ThreatModal component
 *
 * @param {object}   props                           - The props.
 * @param {object}   props.threat                    - The threat.
 * @param {Function} props.handleUpgradeClick        - The handleUpgradeClick function.
 * @param {Function} props.handleFixThreatClick      - The handleFixThreatClick function.
 * @param {Function} props.handleIgnoreThreatClick   - The handleIgnoreThreatClick function.
 * @param {Function} props.handleUnignoreThreatClick - The handleUnignoreThreatClick function.
 *
 * @return {JSX.Element} The threat modal.
 */
export default function ThreatModal( {
	threat,
	handleUpgradeClick,
	handleFixThreatClick,
	handleIgnoreThreatClick,
	handleUnignoreThreatClick,
	...modalProps
}: {
	threat: Threat;
	handleUpgradeClick?: () => void;
	handleFixThreatClick?: ( threats: Threat[] ) => void;
	handleIgnoreThreatClick?: ( threats: Threat[] ) => void;
	handleUnignoreThreatClick?: ( threats: Threat[] ) => void;
} & React.ComponentProps< typeof Modal > ): JSX.Element {
	const fixerState = useMemo( () => {
		return getFixerState( threat.fixer );
	}, [ threat.fixer ] );

	return (
		<Modal
			size="large"
			title={
				<div className={ styles.title }>
					<Text variant="title-small">{ threat.title }</Text>
					{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
				</div>
			}
			{ ...modalProps }
		>
			<div className={ styles[ 'threat-details' ] }>
				{ fixerState.error && (
					<Notice isDismissible={ false } status="error">
						<Text>{ __( 'An error occurred auto-fixing this threat.', 'jetpack' ) }</Text>
					</Notice>
				) }
				{ fixerState.stale && (
					<Notice isDismissible={ false } status="error">
						<Text>{ __( 'The auto-fixer is taking longer than expected.', 'jetpack' ) }</Text>
					</Notice>
				) }
				{ fixerState.inProgress && ! fixerState.stale && (
					<Notice isDismissible={ false } status="success">
						<Text>{ __( 'The auto-fixer is in progress.', 'jetpack' ) }</Text>
					</Notice>
				) }
				<div className={ styles.section }>
					{ !! threat.description && <Text>{ threat.description }</Text> }

					{ !! threat.source && (
						<div>
							<Button
								variant="link"
								isExternalLink={ true }
								weight="regular"
								href={ threat.source }
							>
								{ __( 'See more technical details of this threat', 'jetpack' ) }
							</Button>
						</div>
					) }
				</div>

				<ThreatFixDetails threat={ threat } handleUpgradeClick={ handleUpgradeClick } />

				<ThreatTechnicalDetails threat={ threat } />

				<ThreatActions
					threat={ threat }
					closeModal={ modalProps.onRequestClose }
					handleFixThreatClick={ handleFixThreatClick }
					handleIgnoreThreatClick={ handleIgnoreThreatClick }
					handleUnignoreThreatClick={ handleUnignoreThreatClick }
					fixerState={ fixerState }
				/>
			</div>
		</Modal>
	);
}
