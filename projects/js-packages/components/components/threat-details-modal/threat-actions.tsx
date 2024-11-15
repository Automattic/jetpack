import { Button } from '@automattic/jetpack-components';
import { Threat, getFixerAction } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import React, { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import styles from './styles.module.scss';

/**
 * ThreatActions component
 *
 * @param {object}   props                             - The component props.
 * @param {object}   props.threat                      - The threat object containing action details.
 * @param {Function} props.closeModal                  - Function to close the modal.
 * @param {Function} [props.handleFixThreatClick]      - Function to handle fixing the threat.
 * @param {Function} [props.handleIgnoreThreatClick]   - Function to handle ignoring the threat.
 * @param {Function} [props.handleUnignoreThreatClick] - Function to handle unignoring the threat.
 * @param {boolean}  props.showThreatDetails           - Whether to show the threat details.
 * @param {Function} props.setShowThreatDetails        - Function to set the showThreatDetails state.
 * @param {object}   props.fixerState                  - The state of the fixer (inProgress, error, stale).
 * @param {boolean}  props.fixerState.inProgress       - Whether the fixer is in progress.
 * @param {boolean}  props.fixerState.error            - Whether the fixer encountered an error.
 * @param {boolean}  props.fixerState.stale            - Whether the fixer is stale.
 *
 * @return {JSX.Element | null} The rendered action buttons or null if no actions are available.
 */
const ThreatActions = ( {
	threat,
	closeModal,
	handleFixThreatClick,
	handleIgnoreThreatClick,
	handleUnignoreThreatClick,
	showThreatDetails,
	setShowThreatDetails,
	fixerState,
}: {
	threat: Threat;
	closeModal: () => void;
	handleFixThreatClick?: ( threats: Threat[] ) => void;
	handleIgnoreThreatClick?: ( threats: Threat[] ) => void;
	handleUnignoreThreatClick?: ( threats: Threat[] ) => void;
	showThreatDetails: boolean;
	setShowThreatDetails: Dispatch< SetStateAction< boolean > >;
	fixerState: { inProgress: boolean; error: boolean; stale: boolean };
} ): JSX.Element => {
	const fixerAction = useMemo( () => getFixerAction( threat ), [ threat ] );

	const onFixClick = useCallback( () => {
		handleFixThreatClick?.( [ threat ] );
		closeModal();
	}, [ threat, handleFixThreatClick, closeModal ] );

	const onIgnoreClick = useCallback( () => {
		handleIgnoreThreatClick?.( [ threat ] );
		closeModal();
	}, [ threat, handleIgnoreThreatClick, closeModal ] );

	const onUnignoreClick = useCallback( () => {
		handleUnignoreThreatClick?.( [ threat ] );
		closeModal();
	}, [ threat, handleUnignoreThreatClick, closeModal ] );

	const onContinueClick = useCallback(
		() => setShowThreatDetails( false ),
		[ setShowThreatDetails ]
	);
	const onShowThreatDetailsClick = useCallback(
		() => setShowThreatDetails( true ),
		[ setShowThreatDetails ]
	);

	if ( ! handleFixThreatClick && ! handleIgnoreThreatClick && ! handleUnignoreThreatClick ) {
		return null;
	}

	return (
		<div className={ styles[ 'modal-actions' ] }>
			<div className={ styles[ 'threat-actions' ] }>
				{ ! showThreatDetails && (
					<Button onClick={ onShowThreatDetailsClick }>
						{ __( 'Threat details', 'jetpack' ) }
					</Button>
				) }
				<Button variant="secondary" onClick={ closeModal }>
					{ __( 'Close', 'jetpack' ) }
				</Button>
			</div>
			<div className={ styles[ 'threat-actions' ] }>
				{ threat.status === 'ignored' && handleUnignoreThreatClick && (
					<Button
						isDestructive={ true }
						variant="secondary"
						onClick={ showThreatDetails ? onContinueClick : onUnignoreClick }
					>
						{ __( 'Un-ignore', 'jetpack' ) }
					</Button>
				) }
				{ threat.status === 'current' && (
					<>
						{ handleIgnoreThreatClick && (
							<Button
								isDestructive={ true }
								variant="secondary"
								onClick={ showThreatDetails ? onContinueClick : onIgnoreClick }
								disabled={ fixerState.inProgress && ! fixerState.stale }
							>
								{ __( 'Ignore', 'jetpack' ) }
							</Button>
						) }
						{ threat.fixable && handleFixThreatClick && (
							<Button
								isPrimary
								disabled={ fixerState.inProgress && ! fixerState.stale }
								onClick={ showThreatDetails ? onContinueClick : onFixClick }
							>
								{ fixerState.error || fixerState.stale
									? __( 'Retry fix', 'jetpack' )
									: fixerAction }
							</Button>
						) }
					</>
				) }
			</div>
		</div>
	);
};

export default ThreatActions;
