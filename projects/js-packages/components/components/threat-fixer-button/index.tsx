import { Button, IconTooltip } from '@automattic/jetpack-components';
import { CONTACT_SUPPORT_URL, type Threat, fixerStatusIsStale } from '@automattic/jetpack-scan';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement, useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
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
	const errorMessage = useMemo( () => {
		if ( threat.fixer && fixerStatusIsStale( threat.fixer ) ) {
			return __( 'The auto-fixer is taking longer than expected.', 'jetpack' );
		}

		if ( threat.fixer && 'error' in threat.fixer && threat.fixer.error ) {
			return __( 'An error occurred auto-fixing this threat.', 'jetpack' );
		}

		return null;
	}, [ threat.fixer ] );

	const popoverText = useMemo( () => {
		if ( ! threat.fixable ) {
			return null;
		}

		if ( threat.fixer && 'status' in threat.fixer && threat.fixer.status === 'in_progress' ) {
			return __(
				'An auto-fixer is in progress. This may take a moment, please check back shortly.',
				'jetpack'
			);
		}

		if ( threat.fixable.fixer === 'delete' ) {
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
		}

		if ( threat.fixable.fixer === 'update' ) {
			return __( 'Upgrades the plugin or theme to a newer version.', 'jetpack' );
		}

		if ( [ 'replace', 'rollback' ].includes( threat.fixable.fixer ) ) {
			if ( threat.filename ) {
				if ( threat.signature === 'Core.File.Modification' ) {
					return __(
						'Replaces the modified core WordPress file with the original clean version from the WordPress source code.',
						'jetpack'
					);
				}

				return __(
					'Replaces the infected file with a previously backed up version that is clean.',
					'jetpack'
				);
			}

			if ( threat.signature === 'php_hardening_WP_Config_NoSalts_001' ) {
				return __( 'Replaces the default salt keys in wp-config.php with unique ones.', 'jetpack' );
			}
		}

		return __( 'An auto-fixer is available.', 'jetpack' );
	}, [ threat ] );

	const buttonText = useMemo( () => {
		if ( ! threat.fixable ) {
			return null;
		}

		if ( threat.fixer && 'error' in threat.fixer && threat.fixer.error ) {
			return __( 'Error', 'jetpack' );
		}

		if ( threat.fixer && 'status' in threat.fixer && threat.fixer.status === 'in_progress' ) {
			return __( 'Fixing…', 'jetpack' );
		}

		if ( threat.fixable.fixer === 'delete' ) {
			return __( 'Delete', 'jetpack' );
		}

		if ( threat.fixable.fixer === 'update' ) {
			return __( 'Update', 'jetpack' );
		}

		if ( [ 'replace', 'rollback' ].includes( threat.fixable.fixer ) ) {
			return __( 'Replace', 'jetpack' );
		}

		return __( 'Fix', 'jetpack' );
	}, [ threat.fixable, threat.fixer ] );

	const [ showTooltip, setShowTooltip ] = useState( false );

	const handleClick = useCallback(
		( event: React.MouseEvent ) => {
			event.stopPropagation();
			onClick( [ threat ] );
		},
		[ onClick, threat ]
	);

	const handleErrorClick = useCallback(
		( event: React.MouseEvent ) => {
			event.stopPropagation();
			setShowTooltip( ! showTooltip );
		},
		[ showTooltip ]
	);

	if ( ! threat.fixable ) {
		return null;
	}

	return (
		<div>
			<Button
				size="small"
				weight="regular"
				variant="secondary"
				onClick={ errorMessage ? handleErrorClick : handleClick }
				children={ buttonText }
				className={ className }
				disabled={
					threat.fixer &&
					'status' in threat.fixer &&
					threat.fixer.status === 'in_progress' &&
					! errorMessage
				}
				isLoading={
					threat.fixer && 'status' in threat.fixer && threat.fixer.status === 'in_progress'
				}
				isDestructive={
					( threat.fixable && threat.fixable.fixer === 'delete' ) ||
					( threat.fixer && 'error' in threat.fixer && threat.fixer.error ) ||
					( threat.fixer && fixerStatusIsStale( threat.fixer ) )
				}
				style={ { minWidth: '72px' } }
			/>
			<IconTooltip
				className={ styles.tooltip }
				hoverShow
				forceShow={ showTooltip }
				popoverAnchorStyle="wrapper"
				placement="bottom"
				offset={ -5 }
			>
				{ errorMessage ? (
					<>
						{ createInterpolateElement(
							sprintf(
								/* translators: placeholder is an error message.  */
								__(
									'%s Please try again or <supportLink>contact support</supportLink>.',
									'jetpack'
								),
								errorMessage
							),
							{
								supportLink: (
									<ExternalLink
										href={ CONTACT_SUPPORT_URL }
										className={ styles[ 'support-link' ] }
									/>
								),
							}
						) }
						<Button className={ styles.retry } size="small" onClick={ handleClick }>
							{ __( 'Retry fix', 'jetpack' ) }
						</Button>
					</>
				) : (
					popoverText
				) }
			</IconTooltip>
		</div>
	);
}
