import { Button } from '@automattic/jetpack-components';
import { Threat, getFixerAction } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useMemo } from 'react';
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
	fixerState,
}: {
	threat: Threat;
	closeModal: () => void;
	handleFixThreatClick?: ( threats: Threat[] ) => void;
	handleIgnoreThreatClick?: ( threats: Threat[] ) => void;
	handleUnignoreThreatClick?: ( threats: Threat[] ) => void;
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

	if ( ! handleFixThreatClick && ! handleIgnoreThreatClick && ! handleUnignoreThreatClick ) {
		return null;
	}

	return (
		<div className={ styles[ 'modal-actions' ] }>
			<div className={ styles[ 'threat-actions' ] }>
				{ threat.status === 'ignored' && handleUnignoreThreatClick && (
					<Button isDestructive={ true } variant="secondary" onClick={ onUnignoreClick }>
						{ __( 'Un-ignore', 'jetpack' ) }
					</Button>
				) }
				{ threat.status === 'current' && (
					<>
						{ handleIgnoreThreatClick && (
							<Button
								isDestructive={ true }
								variant="secondary"
								onClick={ onIgnoreClick }
								disabled={ fixerState.inProgress && ! fixerState.stale }
							>
								{ __( 'Ignore', 'jetpack' ) }
							</Button>
						) }
						{ threat.fixable && handleFixThreatClick && (
							<Button
								isPrimary
								disabled={ fixerState.inProgress && ! fixerState.stale }
								onClick={ onFixClick }
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
