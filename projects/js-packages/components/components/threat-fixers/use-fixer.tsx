import {
	CONTACT_SUPPORT_URL,
	getFixerDescription,
	Threat,
	THREAT_ACTION_FIX,
	ThreatsContext,
	fixerIsInProgress,
	fixerStatusIsStale,
	fixerIsInError,
	getFixerState,
} from '@automattic/jetpack-scan';
import { dateI18n } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useContext, useCallback, useState } from 'react';
import { Button, getRedirectUrl, ShieldIcon, Spinner, Text } from '@automattic/jetpack-components';

type UseFixerArgs = {
	threat: Threat;
};

type UseFixerReturn = {
	title: string;
	description: JSX.Element | string;
	actions: JSX.Element[];
	level: 'info' | 'success' | 'warning' | 'error';
	icon: JSX.Element;
};

/**
 * Use Fixer Hook
 *
 * @param {object} args        - Arguments.
 * @param {object} args.threat - The threat to fix.
 *
 * @return {object} The fixer object.
 */
export default function useFixer( { threat }: UseFixerArgs ): UseFixerReturn {
	const { actionCallbacks, connection, credentials, setActionToConfirm, fixersStatus } =
		useContext( ThreatsContext );

	const fixerStatus = fixersStatus.ok && fixersStatus.threats?.[ threat.id ];
	const inProgress = fixerStatus ? fixerIsInProgress( fixerStatus ) : false;
	const isStale = fixerStatus ? fixerStatusIsStale( fixerStatus ) : false;
	const isError = fixerStatus ? fixerIsInError( fixerStatus ) : false;

	const disabled = ! connection.connected || ! credentials.available || ( inProgress && ! isStale );

	const [ isLoading, setIsLoading ] = useState( false );
	const onFixClick = useCallback( () => {
		setIsLoading( true );
		actionCallbacks?.[ THREAT_ACTION_FIX ]?.( [ threat ], {
			onActionPerformed: () => {
				setIsLoading( false );
				setActionToConfirm( undefined );
			},
		} );
	}, [ actionCallbacks, setActionToConfirm, threat ] );

	const { actions, level, title, description, icon } = useMemo( () => {
		const fixerState = getFixerState( fixerStatus );
		const ConnectButton = (
			<Button
				isExternalLink={ true }
				weight="regular"
				isLoading={ connection.connecting }
				onClick={ connection.connect }
				key="connect"
			>
				{ __( 'Connect your account', 'jetpack-components' ) }
			</Button>
		);

		const CredentialsButton = (
			<Button
				isExternalLink={ true }
				weight="regular"
				href={ credentials.redirectUrl }
				isLoading={ credentials.fetching }
			>
				{ __( 'Enter server credentials', 'jetpack-components' ) }
			</Button>
		);

		const FixerButton = ( () => {
			let buttonText = __( 'Fix Now', 'jetpack-components' );
			if ( inProgress ) {
				buttonText = __( 'Fixing…', 'jetpack-components' );
			}
			if ( isError || isStale ) {
				buttonText = __( 'Retry Auto-Fix', 'jetpack-components' );
			}
			return (
				<Button
					isPrimary
					disabled={ disabled }
					onClick={ onFixClick }
					isLoading={ isLoading }
					key="fix"
				>
					{ buttonText }
				</Button>
			);
		} )();

		const fixerDescription = ( () => {
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
		} )();

		const supportMessage = createInterpolateElement(
			__( 'Please try again or <supportLink>contact support</supportLink>.', 'jetpack-components' ),
			{
				supportLink: <Button variant="link" isExternalLink={ true } href={ CONTACT_SUPPORT_URL } />,
			}
		);

		if ( threat.status === 'fixed' ) {
			return {
				level: 'success' as const,
				title: __( 'This threat has been fixed', 'jetpack-components' ),
				description: sprintf(
					/* translators: placeholders are the date and time the threat was fixed. */
					__( 'Jetpack marked this threat as resolved on %1$s at %2$s.', 'jetpack-components' ),
					dateI18n( 'F j, Y', threat.fixedOn ),
					dateI18n( 'g:i A', threat.fixedOn )
				),
				icon: <ShieldIcon variant="success" height={ 24 } />,
			};
		}

		if ( fixerState.error ) {
			return {
				level: 'error' as const,
				title: __( 'An error occurred auto-fixing this threat', 'jetpack-components' ),
				description: (
					<>
						{ __(
							'Jetpack encountered an error while attempting to auto-fix this threat.',
							'jetpack-components'
						) }{ ' ' }
						{ supportMessage }
					</>
				),
				actions: [ FixerButton ],
				icon: <ShieldIcon variant="error" height={ 24 } />,
			};
		}

		if ( fixerState.stale ) {
			return {
				level: 'error' as const,
				title: __( 'The auto-fixer is taking longer than expected', 'jetpack-components' ),
				description: (
					<>
						{ __(
							'Jetpack has been attempting to auto-fix this threat for too long, and something may have gone wrong.',
							'jetpack-components'
						) }{ ' ' }
						{ supportMessage }
					</>
				),
				actions: [ FixerButton ],
				icon: <ShieldIcon variant="error" height={ 24 } />,
			};
		}

		if ( fixerState.inProgress ) {
			return {
				level: 'info' as const,
				title: __( 'Auto-fixing this threat with Jetpack…', 'jetpack-components' ),
				description: fixerDescription,
				actions: [ FixerButton ],
				icon: <Spinner color="var( --jp-green )" size={ 24 } />,
			};
		}

		if ( fixerState.success ) {
			return {
				level: 'success' as const,
				title: __( 'Jetpack successfully fixed the threat', 'jetpack-components' ),
				description: '', // todo
				icon: <ShieldIcon variant="success" height={ 24 } />,
			};
		}

		if ( threat.status === 'current' && threat.fixable ) {
			if ( ! connection.connected && ! credentials.available ) {
				return {
					level: 'warning' as const,
					title: __( 'Additional connections needed to auto-fix threat', 'jetpack-components' ),
					description: __(
						'A user connection and server credentials provide Jetpack the access necessary to auto-fix threats on your site.',
						'jetpack-components'
					),
					actions: [ ConnectButton, CredentialsButton ],
					icon: <ShieldIcon variant="warning" height={ 24 } />,
				};
			} else if ( ! connection.connected ) {
				return {
					level: 'warning' as const,
					title: __( 'User connection needed to auto-fix threat', 'jetpack-components' ),
					description: (
						<>
							<Text mb={ 2 }>
								{ __(
									'A user connection provides Jetpack the access necessary to auto-fix threats on your site.',
									'jetpack-components'
								) }
							</Text>
							<Button
								href={ getRedirectUrl(
									'why-the-wordpress-com-connection-is-important-for-jetpack'
								) }
								variant="link"
								weight="regular"
								isExternalLink={ true }
								key="learn-more"
							>
								{ __( 'Learn more about connections', 'jetpack-components' ) }
							</Button>
						</>
					),
					actions: [ ConnectButton ],
					icon: <ShieldIcon variant="warning" height={ 24 } />,
				};
			} else if ( ! credentials.available ) {
				return {
					level: 'warning' as const,
					title: __( 'Site credentials needed to auto-fix threat', 'jetpack-components' ),
					description: (
						<>
							<Text mb={ 2 }>
								{ __(
									'To auto-fix this threat, Jetpack needs your website’s SSH, SFTP, or FTP server credentials.',
									'jetpack-components'
								) }
							</Text>
							<Button
								href={ getRedirectUrl( 'ssh-sftp-and-ftp-credentials' ) }
								variant="link"
								weight="regular"
								isExternalLink={ true }
								key="learn-more"
							>
								{ __( 'Learn more about credentials', 'jetpack-components' ) }
							</Button>
						</>
					),
					actions: [ CredentialsButton ],
					icon: <ShieldIcon variant="warning" height={ 24 } />,
				};
			}
			return {
				level: 'info' as const,
				title: __( 'How can Jetpack fix this threat?', 'jetpack-components' ),
				description: fixerDescription,
				actions: [ FixerButton ],
				icon: <ShieldIcon variant="success" height={ 24 } />,
			};
		}

		return {
			level: 'info' as const,
			title: __( 'How to fix it?', 'jetpack-components' ),
			description: fixerDescription,
			icon: <ShieldIcon variant="info" height={ 24 } />,
		};
	}, [
		connection.connect,
		connection.connected,
		connection.connecting,
		credentials.available,
		credentials.fetching,
		credentials.redirectUrl,
		disabled,
		fixerStatus,
		inProgress,
		isError,
		isLoading,
		isStale,
		onFixClick,
		threat,
	] );

	return {
		title,
		description,
		actions,
		level,
		icon,
	};
}
