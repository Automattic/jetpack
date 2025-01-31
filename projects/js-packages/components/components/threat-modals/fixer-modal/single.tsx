import {
	CONTACT_SUPPORT_URL,
	getFixerDescription,
	getFixerState,
	THREAT_ACTION_FIX,
	ThreatsContext,
} from '@automattic/jetpack-scan';
import { dateI18n } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useContext, useMemo, useState } from 'react';
import Button from '../../button';
import ShieldIcon from '../../shield-icon';
import Spinner from '../../spinner';
import Text from '../../text';
import CancelButton from '../cancel-button';
import styles from '../styles.module.scss';

/**
 * Threat Fixer Modal Content
 *
 * @return {JSX.Element} ThreatFixerModalContent Component.
 */
export function ThreatFixerModalContent() {
	const { actions, actionToConfirm, setActionToConfirm, fixersStatus } =
		useContext( ThreatsContext );

	const [ isLoading, setIsLoading ] = useState( false );

	const threat = actionToConfirm.items[ 0 ];
	const fixerState = fixersStatus.ok && getFixerState( fixersStatus.threats[ threat.id ] );

	const buttonProps: React.ComponentProps< typeof Button > = useMemo( () => {
		const props = {
			children: __( 'Fix Now', 'jetpack-components' ),
			isDestructive: false,
		};

		if ( threat.fixable && threat.fixable.fixer === 'delete' ) {
			props.children = __( 'Delete Now', 'jetpack-components' );
			props.isDestructive = true;
		}

		if ( fixerState.inProgress ) {
			props.children = __( 'Fixing…', 'jetpack-components' );
		}
		if ( fixerState.error || fixerState.stale ) {
			props.children = __( 'Retry Auto-Fix', 'jetpack-components' );
		}

		return props;
	}, [ fixerState.error, fixerState.inProgress, fixerState.stale, threat.fixable ] );

	const fixerDescription = useMemo( () => {
		// The threat has a fixed version available, but no auto-fix is available.
		// The user needs to update the extension to the fixed version.
		if ( ! threat.fixable && threat.fixedIn ) {
			return sprintf(
				/* translators: Translates to Updates to version. %1$s: Name. %2$s: Fixed version */
				__( 'Update %1$s to version %2$s.', 'jetpack-components' ),
				threat.extension.name,
				threat.fixedIn
			);
		}

		// The threat has an auto-fix available.
		return getFixerDescription( threat );
	}, [ threat ] );

	const supportMessage = createInterpolateElement(
		__( 'Please try again or <supportLink>contact support</supportLink>.', 'jetpack-components' ),
		{
			supportLink: <Button variant="link" isExternalLink={ true } href={ CONTACT_SUPPORT_URL } />,
		}
	);

	const { icon, title, description } = useMemo( () => {
		if ( threat.status === 'fixed' ) {
			return {
				icon: <ShieldIcon variant="success" height={ 24 } />,
				title: __( 'This threat has been fixed', 'jetpack-components' ),
				description: (
					<Text>
						{ sprintf(
							/* translators: placeholders are the date and time the threat was fixed. */
							__( 'Jetpack marked this threat as resolved on %1$s at %2$s.', 'jetpack-components' ),
							dateI18n( 'F j, Y', threat.fixedOn ),
							dateI18n( 'g:i A', threat.fixedOn )
						) }
					</Text>
				),
			};
		}

		if ( fixerState.error ) {
			return {
				icon: <ShieldIcon variant="error" height={ 24 } />,
				title: __( 'An error occurred auto-fixing this threat', 'jetpack-components' ),
				description: (
					<Text>
						{ __(
							'Jetpack encountered an error while attempting to auto-fix this threat.',
							'jetpack-components'
						) }{ ' ' }
						{ supportMessage }
					</Text>
				),
			};
		}

		if ( fixerState.stale ) {
			return {
				icon: <ShieldIcon variant="error" height={ 24 } />,
				title: __( 'The auto-fixer is taking longer than expected', 'jetpack-components' ),
				description: (
					<Text>
						{ __(
							'Jetpack has been attempting to auto-fix this threat for too long, and something may have gone wrong.',
							'jetpack-components'
						) }{ ' ' }
						{ supportMessage }
					</Text>
				),
			};
		}

		if ( fixerState.inProgress ) {
			return {
				icon: <Spinner color="var( --jp-green )" size={ 24 } />,
				title: __( 'Auto-fixing this threat with Jetpack…', 'jetpack-components' ),
				description: <Text>{ fixerDescription }</Text>,
			};
		}

		if ( fixerState.success ) {
			return {
				icon: <ShieldIcon variant="success" height={ 24 } />,
				title: __( 'Jetpack successfully fixed the threat', 'jetpack-components' ),
				description: '', // todo
			};
		}

		return {
			icon: <ShieldIcon variant="success" height={ 24 } />,
			title: __( 'How can Jetpack fix this threat?', 'jetpack-components' ),
			description: <Text>{ fixerDescription }</Text>,
		};
	}, [
		threat.status,
		threat.fixedOn,
		fixerState.error,
		fixerState.stale,
		fixerState.inProgress,
		fixerState.success,
		fixerDescription,
		supportMessage,
	] );

	// Callback function for the fixer action.
	const onFixClick = useCallback( () => {
		setIsLoading( true );
		actions?.[ THREAT_ACTION_FIX ]?.callback( [ threat ], {
			onActionPerformed: () => {
				setIsLoading( false );
				setActionToConfirm( undefined );
			},
		} );
	}, [ actions, setActionToConfirm, threat ] );

	return (
		<>
			<div className={ styles[ 'threat-modal__content' ] }>
				<div className={ styles[ 'threat-modal__section' ] }>
					<Text className={ styles[ 'threat-modal__section__title' ] }>
						{ icon }
						{ title }
					</Text>
					{ description }
				</div>
			</div>
			<div className={ styles[ 'threat-modal__footer' ] }>
				<div className={ styles[ 'threat-modal__footer__actions' ] }>
					<CancelButton />
					<Button
						key="fix"
						isPrimary
						onClick={ onFixClick }
						isLoading={ isLoading }
						disabled={ fixerState.inProgress && ! fixerState.stale }
						{ ...buttonProps }
					/>
				</div>
			</div>
		</>
	);
}
