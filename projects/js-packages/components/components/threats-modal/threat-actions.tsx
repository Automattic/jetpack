import { getFixerState, getDetailedFixerAction } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { useCallback, useContext, useMemo } from 'react';
import { Button } from '@automattic/jetpack-components';
import FixerStateNotice from './fixer-state-notice';
import styles from './styles.module.scss';
import { ThreatsModalContext } from '.';

/**
 * ThreatActions component
 *
 * @return {JSX.Element | null} The rendered action buttons or null if no actions are available.
 */
const ThreatActions = (): JSX.Element => {
	const {
		closeModal,
		currentThreats,
		isSingleThreat,
		actionToConfirm,
		handleFixThreatClick,
		handleIgnoreThreatClick,
		handleUnignoreThreatClick,
		userConnectionNeeded,
		siteCredentialsNeeded,
	} = useContext( ThreatsModalContext );
	const disabled = userConnectionNeeded || siteCredentialsNeeded;

	const fixerState = useMemo(
		() => ( isSingleThreat ? getFixerState( currentThreats[ 0 ].fixer ) : null ),
		[ isSingleThreat, currentThreats ]
	);

	const detailedFixerAction = useMemo(
		() => ( isSingleThreat ? getDetailedFixerAction( currentThreats[ 0 ] ) : null ),
		[ isSingleThreat, currentThreats ]
	);

	const onFixClick = useCallback( () => {
		handleFixThreatClick?.( currentThreats );
		closeModal();
	}, [ currentThreats, handleFixThreatClick, closeModal ] );

	const onIgnoreClick = useCallback( () => {
		handleIgnoreThreatClick?.( currentThreats );
		closeModal();
	}, [ currentThreats, handleIgnoreThreatClick, closeModal ] );

	const onUnignoreClick = useCallback( () => {
		handleUnignoreThreatClick?.( currentThreats );
		closeModal();
	}, [ currentThreats, handleUnignoreThreatClick, closeModal ] );

	if (
		isSingleThreat &&
		( ! currentThreats[ 0 ]?.status || currentThreats[ 0 ].status === 'fixed' )
	) {
		return null;
	}

	return (
		<div className={ styles[ 'modal-footer' ] }>
			{ isSingleThreat && <FixerStateNotice fixerState={ fixerState } /> }
			<div className={ styles[ 'threat-actions' ] }>
				{ isSingleThreat ? (
					<>
						{ currentThreats[ 0 ]?.status === 'ignored' && (
							<Button
								disabled={ disabled }
								isDestructive={ true }
								variant="secondary"
								onClick={ onUnignoreClick }
							>
								{ __( 'Un-ignore threat', 'jetpack-components' ) }
							</Button>
						) }
						{ currentThreats[ 0 ]?.status === 'current' && (
							<>
								{ [ 'all', 'ignore' ].includes( actionToConfirm ) && (
									<Button
										isDestructive={ true }
										variant="secondary"
										onClick={ onIgnoreClick }
										disabled={ disabled || ( fixerState.inProgress && ! fixerState.stale ) }
									>
										{ __( 'Ignore threat', 'jetpack-components' ) }
									</Button>
								) }
								{ currentThreats[ 0 ]?.fixable && [ 'all', 'fix' ].includes( actionToConfirm ) && (
									<Button
										isPrimary
										disabled={ disabled || ( fixerState.inProgress && ! fixerState.stale ) }
										onClick={ onFixClick }
									>
										{ fixerState.error || fixerState.stale
											? __( 'Retry fixer', 'jetpack-components' )
											: detailedFixerAction }
									</Button>
								) }
							</>
						) }
					</>
				) : (
					<Button disabled={ disabled } onClick={ onFixClick }>
						{ __( 'Fix all threats', 'jetpack-components' ) }
					</Button>
				) }
			</div>
		</div>
	);
};

export default ThreatActions;
