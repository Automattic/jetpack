import { Button, Text, ActionPopover } from '@automattic/jetpack-components';
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
	const [ isPopoverVisible, setIsPopoverVisible ] = useState( false );

	const [ anchor, setAnchor ] = useState( null );

	const children = useMemo( () => {
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
		return __( 'Fix', 'jetpack' );
	}, [ threat.fixable, threat.fixer ] );

	const errorMessage = useMemo( () => {
		if ( threat.fixer && fixerStatusIsStale( threat.fixer ) ) {
			return __( 'The fixer is taking longer than expected.', 'jetpack' );
		}

		if ( threat.fixer && 'error' in threat.fixer && threat.fixer.error ) {
			return __( 'An error occurred auto-fixing this threat.', 'jetpack' );
		}

		return null;
	}, [ threat.fixer ] );

	const handleClick = useCallback(
		( event: React.MouseEvent ) => {
			event.stopPropagation();
			if ( errorMessage && ! isPopoverVisible ) {
				setIsPopoverVisible( true );
				return;
			}
			onClick( [ threat ] );
		},
		[ onClick, errorMessage, isPopoverVisible, threat ]
	);

	const closePopover = useCallback( () => {
		setIsPopoverVisible( false );
	}, [] );

	if ( ! threat.fixable ) {
		return null;
	}

	return (
		<div>
			<Button
				size="small"
				weight="regular"
				variant="secondary"
				onClick={ handleClick }
				children={ children }
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
				ref={ setAnchor }
			/>
			{ isPopoverVisible && (
				<ActionPopover
					anchor={ anchor }
					buttonContent={ __( 'Retry Fix', 'jetpack' ) }
					hideCloseButton={ true }
					noArrow={ false }
					onClick={ handleClick }
					onClose={ closePopover }
					title={ __( 'Auto-fix error', 'jetpack' ) }
				>
					<Text>
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
					</Text>
				</ActionPopover>
			) }
		</div>
	);
}
