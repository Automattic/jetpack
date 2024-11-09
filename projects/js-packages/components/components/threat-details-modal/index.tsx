import { Button, ThreatSeverityBadge } from '@automattic/jetpack-components';
import { type Threat } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
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
		switch ( threat.fixable && threat.fixable.fixer ) {
			case 'delete':
				if ( threat.filename ) {
					if ( threat.filename.endsWith( '/' ) ) {
						return __( 'Deletes the directory that the infected file is in.', 'jetpack' );
					}

					if ( threat.signature === 'Core.File.Modification' ) {
						return __( 'Deletes the unexpected file in a core WordPress directory.', 'jetpack' );
					}

					return __( 'Deletes the infected file.', 'jetpack' );
				}

				if ( threat.extension?.type === 'plugin' ) {
					return __( 'Deletes the plugin directory to fix the threat.', 'jetpack' );
				}

				if ( threat.extension?.type === 'theme' ) {
					return __( 'Deletes the theme directory to fix the threat.', 'jetpack' );
				}
				break;
			case 'update':
				if ( threat.fixedIn && threat.extension.name ) {
					return sprintf(
						/* translators: Translates to Updates to version. %1$s: Name. %2$s: Fixed version */
						__( 'Updates %1$s to version %2$s', 'jetpack' ),
						threat.extension.name,
						threat.fixedIn
					);
				}
				return __( 'Upgrades the plugin or theme to a newer version.', 'jetpack' );
			case 'replace':
			case 'rollback':
				if ( threat.filename ) {
					return threat.signature === 'Core.File.Modification'
						? __(
								'Replaces the modified core WordPress file with the original clean version from the WordPress source code.',
								'jetpack'
						  )
						: __(
								'Replaces the infected file with a previously backed up version that is clean.',
								'jetpack'
						  );
				}

				if ( threat.signature === 'php_hardening_WP_Config_NoSalts_001' ) {
					return __(
						'Replaces the default salt keys in wp-config.php with unique ones.',
						'jetpack'
					);
				}
				break;
			default:
				return __( 'Jetpack will auto-fix the threat.', 'jetpack' );
		}
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
					cta={ __( 'Upgrade Jetpack Protect now', 'jetpack' ) }
					onClick={ handleUpgradeClick }
				/>
			) }
		</div>
	);
};

const ThreatActions = ( {
	threat,
	handleFixThreatClick,
	handleIgnoreThreatClick,
	handleUnignoreThreatClick,
	isActiveFixInProgress,
	isStaleFixInProgress,
}: {
	threat: Threat;
	handleFixThreatClick?: () => void;
	handleIgnoreThreatClick?: () => void;
	handleUnignoreThreatClick?: () => void;
	isActiveFixInProgress?: boolean;
	isStaleFixInProgress?: boolean;
} ) => {
	if ( ! handleFixThreatClick && ! handleIgnoreThreatClick && ! handleUnignoreThreatClick ) {
		return null;
	}

	return (
		<div className={ styles.actions }>
			{ 'ignored' === threat.status && !! handleUnignoreThreatClick && (
				<Button isDestructive={ true } variant="secondary" onClick={ handleUnignoreThreatClick() }>
					{ __( 'Un-ignore', 'jetpack' ) }
				</Button>
			) }
			{ 'current' === threat.status && (
				<>
					{ !! handleIgnoreThreatClick && (
						<Button
							isDestructive={ true }
							variant="secondary"
							onClick={ handleIgnoreThreatClick() }
							disabled={ isActiveFixInProgress || isStaleFixInProgress }
						>
							{ __( 'Ignore', 'jetpack' ) }
						</Button>
					) }
					{ threat.fixable && !! handleFixThreatClick && (
						<Button
							isPrimary
							disabled={ isActiveFixInProgress || isStaleFixInProgress }
							onClick={ handleFixThreatClick() }
						>
							{ __( 'Auto-Fix', 'jetpack' ) }
						</Button>
					) }
				</>
			) }
		</div>
	);
};

/**
 * ThreatDetailsModal component
 *
 * @param {object}   props                           - The props.
 * @param {object}   props.threat                    - The threat.
 * @param {Function} props.handleUpgradeClick        - The handleUpgradeClick function.
 * @param {boolean}  props.isActiveFixInProgress     - The isActiveFixInProgress flag.
 * @param {boolean}  props.isStaleFixInProgress      - The isStaleFixInProgress flag.
 * @param {Function} props.handleFixThreatClick      - The handleFixThreatClick function.
 * @param {Function} props.handleIgnoreThreatClick   - The handleIgnoreThreatClick function.
 * @param {Function} props.handleUnignoreThreatClick - The handleUnignoreThreatClick function.
 *
 * @return {JSX.Element} The threat details modal.
 */
export default function ThreatDetailsModal( {
	threat,
	handleUpgradeClick,
	isActiveFixInProgress,
	isStaleFixInProgress,
	handleFixThreatClick,
	handleIgnoreThreatClick,
	handleUnignoreThreatClick,
	...modalProps
}: {
	threat: Threat;
	handleUpgradeClick?: () => void;
	isActiveFixInProgress?: boolean;
	isStaleFixInProgress?: boolean;
	handleFixThreatClick?: () => void;
	handleIgnoreThreatClick?: () => void;
	handleUnignoreThreatClick?: () => void;
	[ key: string ]: unknown;
} ): JSX.Element {
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
		<Modal size="large" title={ __( 'Threat Details', 'jetpack' ) } { ...modalProps }>
			<div className={ styles[ 'threat-details' ] }>
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
					handleFixThreatClick={ handleFixThreatClick }
					handleIgnoreThreatClick={ handleIgnoreThreatClick }
					handleUnignoreThreatClick={ handleUnignoreThreatClick }
					isActiveFixInProgress={ isActiveFixInProgress }
					isStaleFixInProgress={ isStaleFixInProgress }
				/>
			</div>
		</Modal>
	);
}
