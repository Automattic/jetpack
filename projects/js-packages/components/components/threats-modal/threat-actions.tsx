import { getFixerState, getDetailedFixerAction, type Threat } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { useCallback, useContext, useMemo } from 'react';
import { Button } from '@automattic/jetpack-components';
import FixerStateNotice from './fixer-state-notice';
import styles from './styles.module.scss';
import { ThreatsModalContext } from '.';

/**
 * ThreatActions component
 *
 * @param {object}   props                 - The props.
 * @param {Threat[]} props.selectedThreats - The selected threats.
 *
 * @return {JSX.Element | null} The rendered action buttons or null if no actions are available.
 */
const ThreatActions = ( { selectedThreats }: { selectedThreats: Threat[] } ): JSX.Element => {
	const {
		closeModal,
		isBulk,
		actionToConfirm,
		handleFixThreatClick,
		handleIgnoreThreatClick,
		handleUnignoreThreatClick,
		userConnectionNeeded,
		siteCredentialsNeeded,
	} = useContext( ThreatsModalContext );

	const firstThreat = selectedThreats[ 0 ];
	const disabled = userConnectionNeeded || siteCredentialsNeeded || selectedThreats.length === 0;

	const fixerState = useMemo(
		() => ( ! isBulk ? getFixerState( firstThreat.fixer ) : null ),
		[ isBulk, firstThreat ]
	);

	const detailedFixerAction = useMemo(
		() => ( ! isBulk ? getDetailedFixerAction( firstThreat ) : null ),
		[ isBulk, firstThreat ]
	);

	const onFixClick = useCallback( () => {
		handleFixThreatClick?.( selectedThreats );
		closeModal();
	}, [ selectedThreats, handleFixThreatClick, closeModal ] );

	const onIgnoreClick = useCallback( () => {
		handleIgnoreThreatClick?.( selectedThreats );
		closeModal();
	}, [ selectedThreats, handleIgnoreThreatClick, closeModal ] );

	const onUnignoreClick = useCallback( () => {
		handleUnignoreThreatClick?.( selectedThreats );
		closeModal();
	}, [ selectedThreats, handleUnignoreThreatClick, closeModal ] );

	if ( ! isBulk && ( ! firstThreat?.status || firstThreat.status === 'fixed' ) ) {
		return null;
	}

	const renderBulkActions = () => (
		<Button disabled={ disabled } onClick={ onFixClick }>
			{ __( 'Fix all threats', 'jetpack-components' ) }
		</Button>
	);

	const renderIndividualActions = () => (
		<>
			{ firstThreat.status === 'ignored' && (
				<Button disabled={ disabled } isDestructive variant="secondary" onClick={ onUnignoreClick }>
					{ __( 'Un-ignore threat', 'jetpack-components' ) }
				</Button>
			) }
			{ firstThreat.status === 'current' && (
				<>
					{ [ 'all', 'ignore' ].includes( actionToConfirm ) && (
						<Button
							isDestructive
							variant="secondary"
							onClick={ onIgnoreClick }
							disabled={ disabled || ( fixerState?.inProgress && ! fixerState?.stale ) }
						>
							{ __( 'Ignore threat', 'jetpack-components' ) }
						</Button>
					) }
					{ firstThreat.fixable && [ 'all', 'fix' ].includes( actionToConfirm ) && (
						<Button
							isPrimary
							disabled={ disabled || ( fixerState?.inProgress && ! fixerState?.stale ) }
							onClick={ onFixClick }
						>
							{ fixerState?.error || fixerState?.stale
								? __( 'Retry fixer', 'jetpack-components' )
								: detailedFixerAction }
						</Button>
					) }
				</>
			) }
		</>
	);

	return (
		<div className={ ! isBulk ? styles[ 'modal-footer' ] : null }>
			{ ! isBulk && <FixerStateNotice fixerState={ fixerState } /> }
			<div className={ styles[ 'threat-actions' ] }>
				{ isBulk ? renderBulkActions() : renderIndividualActions() }
			</div>
		</div>
	);
};

export default ThreatActions;
