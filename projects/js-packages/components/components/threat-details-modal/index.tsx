import { Button, ThreatSeverityBadge } from '@automattic/jetpack-components';
import {
	type Threat,
	fixerIsInError,
	fixerIsInProgress,
	fixerStatusIsStale,
	getFixerAction,
	getFixerMessage,
} from '@automattic/jetpack-scan';
import { Modal, Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useCallback } from 'react';
import ContextualUpgradeTrigger from '../contextual-upgrade-trigger';
import DiffViewer from '../diff-viewer';
import MarkedLines from '../marked-lines';
import Text from '../text';
import styles from './styles.module.scss';

const ThreatTechnicalDetails = ( { threat }: { threat: Threat } ) => {
	if ( ! threat.filename && ! threat.context && ! threat.diff ) {
		return null;
	}

	return (
		<div className={ styles.section }>
			<Text variant="title-small">{ __( 'The technical details', 'jetpack' ) }</Text>
			{ threat.filename && (
				<>
					<Text>{ __( 'Threat found in file:', 'jetpack' ) }</Text>
					<pre className={ styles.filename }>{ threat.filename }</pre>
				</>
			) }
			{ threat.context && <MarkedLines context={ threat.context } /> }
			{ threat.diff && <DiffViewer diff={ threat.diff } /> }
		</div>
	);
};

const ThreatFixDetails = ( {
	threat,
	handleUpgradeClick,
}: {
	threat: Threat;
	handleUpgradeClick: () => void;
} ) => {
	const title = useMemo( () => {
		if ( threat.status === 'fixed' ) {
			return __( 'How did Jetpack fix it?', 'jetpack' );
		}
		if ( threat.status === 'current' && threat.fixable ) {
			return __( 'How can Jetpack auto-fix this threat?', 'jetpack' );
		}
		return __( 'How to fix it?', 'jetpack' );
	}, [ threat ] );

	const fix = useMemo( () => {
		// The threat has a fixed version available, but no auto-fix is available.
		// The user needs to update the extension to the fixed version.
		if ( ! threat.fixable && threat.fixedIn ) {
			return sprintf(
				/* translators: Translates to Updates to version. %1$s: Name. %2$s: Fixed version */
				__( 'Update %1$s to version %2$s.', 'jetpack' ),
				threat.extension.name,
				threat.fixedIn
			);
		}

		// The threat has an auto-fix available.
		return getFixerMessage( threat );
	}, [ threat ] );

	if ( ! threat.fixable && ! threat.fixedIn ) {
		return null;
	}

	return (
		<div className={ styles.section }>
			<Text variant="title-small">{ title }</Text>
			<Text>{ fix }</Text>

			{ !! handleUpgradeClick && (
				<ContextualUpgradeTrigger
					description={ __( 'Looking for advanced scan results and one-click fixes?', 'jetpack' ) }
					cta={ __( 'Upgrade Jetpack now', 'jetpack' ) }
					onClick={ handleUpgradeClick }
				/>
			) }
		</div>
	);
};

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
} ) => {
	const fixerAction = useMemo( () => {
		return getFixerAction( threat );
	}, [ threat ] );

	const onFixClick = useCallback( () => {
		handleFixThreatClick( [ threat ] );
		closeModal();
	}, [ threat, handleFixThreatClick, closeModal ] );

	const onIgnoreClick = useCallback( () => {
		handleIgnoreThreatClick( [ threat ] );
		closeModal();
	}, [ threat, handleIgnoreThreatClick, closeModal ] );

	const onUnignoreClick = useCallback( () => {
		handleUnignoreThreatClick( [ threat ] );
		closeModal();
	}, [ threat, handleUnignoreThreatClick, closeModal ] );

	if ( ! handleFixThreatClick && ! handleIgnoreThreatClick && ! handleUnignoreThreatClick ) {
		return null;
	}

	return (
		<div className={ styles[ 'modal-actions' ] }>
			<div>
				<Button variant="secondary" onClick={ closeModal }>
					{ __( 'Close', 'jetpack' ) }
				</Button>
			</div>
			<div className={ styles[ 'threat-actions' ] }>
				{ 'ignored' === threat.status && !! handleUnignoreThreatClick && (
					<Button isDestructive={ true } variant="secondary" onClick={ onUnignoreClick }>
						{ __( 'Un-ignore', 'jetpack' ) }
					</Button>
				) }
				{ 'current' === threat.status && (
					<>
						{ !! handleIgnoreThreatClick && (
							<Button
								isDestructive={ true }
								variant="secondary"
								onClick={ onIgnoreClick }
								disabled={ fixerState.inProgress && ! fixerState.stale }
							>
								{ __( 'Ignore', 'jetpack' ) }
							</Button>
						) }
						{ threat.fixable && !! handleFixThreatClick && (
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

/**
 * ThreatDetailsModal component
 *
 * @param {object}   props                           - The props.
 * @param {object}   props.threat                    - The threat.
 * @param {Function} props.handleUpgradeClick        - The handleUpgradeClick function.
 * @param {Function} props.handleFixThreatClick      - The handleFixThreatClick function.
 * @param {Function} props.handleIgnoreThreatClick   - The handleIgnoreThreatClick function.
 * @param {Function} props.handleUnignoreThreatClick - The handleUnignoreThreatClick function.
 *
 * @return {JSX.Element} The threat details modal.
 */
export default function ThreatDetailsModal( {
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
	[ key: string ]: unknown;
} ): JSX.Element {
	const fixerState = useMemo( () => {
		const inProgress = threat.fixer && fixerIsInProgress( threat.fixer );
		const error = threat.fixer && fixerIsInError( threat.fixer );
		const stale = threat.fixer && fixerStatusIsStale( threat.fixer );
		return { inProgress, error, stale };
	}, [ threat.fixer ] );

	const title = useMemo( () => {
		if ( threat.title ) {
			return threat.title;
		}

		if ( threat.status === 'fixed' ) {
			return __( 'What was the problem?', 'jetpack' );
		}

		return __( 'What is the problem?', 'jetpack' );
	}, [ threat ] );

	return (
		<Modal size="large" __experimentalHideHeader { ...modalProps }>
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
					<div className={ styles.title }>
						<Text variant="title-small">{ title }</Text>
						{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
					</div>

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
					closeModal={ modalProps.onRequestClose as () => void }
					handleFixThreatClick={ handleFixThreatClick }
					handleIgnoreThreatClick={ handleIgnoreThreatClick }
					handleUnignoreThreatClick={ handleUnignoreThreatClick }
					fixerState={ fixerState }
				/>
			</div>
		</Modal>
	);
}
