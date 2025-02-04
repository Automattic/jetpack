import {
	type Threat,
	getFixerState,
	getFixerAction,
	getFixerDescription,
	ThreatsContext,
} from '@automattic/jetpack-scan';
import { Tooltip } from '@wordpress/components';
import { useCallback, useContext, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@automattic/jetpack-components';
import styles from './styles.module.scss';

/**
 * Threat Fixer Button component.
 *
 * @param {object}   props             - Component props.
 * @param {object}   props.threat      - The threat.
 * @param {Function} props.onClick     - The onClick function.
 * @param {boolean}  props.showToolTip - Whether to show a tooltip on button hover.
 * @param {string}   props.className   - The className.
 *
 * @return {JSX.Element} The component.
 */
export default function ThreatFixerButton( {
	threat,
	className,
	onClick,
	showToolTip = true,
	...buttonProps
}: {
	threat: Threat;
	onClick: ( items: Threat[] ) => void;
	className?: string;
	showToolTip?: boolean;
} & React.ComponentProps< typeof Button > ): JSX.Element {
	const { fixersStatus } = useContext( ThreatsContext );

	const fixer = fixersStatus && fixersStatus.ok && fixersStatus.threats?.[ threat.id ];
	const fixerState = getFixerState( fixer );

	const tooltipText = useMemo( () => {
		if ( ! threat.fixable ) {
			return null;
		}

		if ( fixerState.error ) {
			return __( 'An error occurred auto-fixing this threat.', 'jetpack-components' );
		}

		if ( fixerState.stale ) {
			return __( 'The auto-fixer is taking longer than expected.', 'jetpack-components' );
		}

		if ( fixerState.inProgress ) {
			return __( 'An auto-fixer is in progress.', 'jetpack-components' );
		}

		return getFixerDescription( threat );
	}, [ threat, fixerState ] );

	const buttonText = useMemo( () => {
		if ( ! threat.fixable ) {
			return null;
		}

		if ( fixerState.error ) {
			return __( 'Error', 'jetpack-components' );
		}

		return getFixerAction( threat );
	}, [ threat, fixerState.error ] );

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
			<Tooltip className={ styles.tooltip } text={ showToolTip ? tooltipText : undefined }>
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
					{ ...buttonProps }
				/>
			</Tooltip>
		</div>
	);
}
