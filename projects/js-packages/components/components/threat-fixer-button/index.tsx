import { Button } from '@automattic/jetpack-components';
import {
	type Threat,
	fixerIsInError,
	fixerIsInProgress,
	fixerStatusIsStale,
} from '@automattic/jetpack-scan';
import { Tooltip } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

/**
 * Threat Fixer Button component.
 *
 * @param {object}   props           - Component props.
 * @param {object}   props.threat    - The threat.
 * @param {Function} props.onClick   - The onClick function.
 * @param {string}   props.className - The className.
 *
 * @return {JSX.Element} The component.
 */
export default function ThreatFixerButton( {
	threat,
	className,
	onClick,
}: {
	threat: Threat;
	onClick: ( items: Threat[] ) => void;
	className?: string;
} ): JSX.Element {
	const fixerState = useMemo( () => {
		const inProgress = threat.fixer && fixerIsInProgress( threat.fixer );
		const error = threat.fixer && fixerIsInError( threat.fixer );
		const stale = threat.fixer && fixerStatusIsStale( threat.fixer );
		return { inProgress, error, stale };
	}, [ threat.fixer ] );

	const tooltipText = useMemo( () => {
		if ( ! threat.fixable ) {
			return null;
		}

		if ( fixerState.error ) {
			return __( 'An error occurred auto-fixing this threat.', 'jetpack' );
		}

		if ( fixerState.stale ) {
			return __( 'The auto-fixer is taking longer than expected.', 'jetpack' );
		}

		if ( fixerState.inProgress ) {
			return __( 'An auto-fixer is in progress.', 'jetpack' );
		}

		switch ( threat.fixable.fixer ) {
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
				return __( 'An auto-fixer is available.', 'jetpack' );
		}
	}, [ threat, fixerState ] );

	const buttonText = useMemo( () => {
		if ( ! threat.fixable ) {
			return null;
		}

		if ( fixerState.error ) {
			return __( 'Error', 'jetpack' );
		}

		switch ( threat.fixable.fixer ) {
			case 'delete':
				return __( 'Delete', 'jetpack' );
			case 'update':
				return __( 'Update', 'jetpack' );
			case 'replace':
			case 'rollback':
				return __( 'Replace', 'jetpack' );
			default:
				return __( 'Fix', 'jetpack' );
		}
	}, [ threat.fixable, fixerState.error ] );

	const handleClick = useCallback(
		( event: React.MouseEvent ) => {
			event.stopPropagation();
			onClick( [ threat ] );
		},
		[ onClick, threat ]
	);

	if ( ! threat.fixable ) {
		return null;
	}

	return (
		<div>
			<Tooltip className={ styles.tooltip } text={ tooltipText }>
				<Button
					size="small"
					weight="regular"
					variant="secondary"
					onClick={ handleClick }
					children={ buttonText }
					className={ className }
					isLoading={ fixerState.inProgress }
					isDestructive={
						( threat.fixable && threat.fixable.fixer === 'delete' ) ||
						fixerState.error ||
						fixerState.stale
					}
					style={ { minWidth: '72px' } }
				/>
			</Tooltip>
		</div>
	);
}
