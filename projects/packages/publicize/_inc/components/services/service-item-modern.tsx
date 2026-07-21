import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';
import { Collapsible, Icon, Text } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import { ConnectForm } from './connect-form';
import { ServiceItemDetails, ServicesItemDetailsProps } from './service-item-details';
import { ServiceStatus } from './service-status';
import styles from './style-modern.module.scss';
import type { SyntheticEvent } from 'react';

export type ServicesItemProps = ServicesItemDetailsProps & {
	isPanelDefaultOpen?: boolean;
};

// Stops a child click from bubbling up to the surrounding
// `Collapsible.Trigger`, which would otherwise toggle the disclosure
// when the user is trying to interact with an inline control (e.g.
// the "Connect" button or the broken-connection reauth flow).
const stopPropagation = ( event: SyntheticEvent ) => event.stopPropagation();

/**
 * Service item component
 *
 * @param {ServicesItemProps} props - Component props
 *
 * @return {import('react').ReactNode} Service item component
 */
export function ModernServiceItem( {
	service,
	serviceConnections,
	isPanelDefaultOpen,
}: ServicesItemProps ) {
	const isSmall = useViewportMatch( 'small', '<' );

	const [ isPanelOpen, setIsPanelOpen ] = useState( Boolean( isPanelDefaultOpen ) );
	const togglePanel = useCallback( () => setIsPanelOpen( open => ! open ), [] );
	// `Collapsible.Trigger` types its ref as `HTMLButtonElement` even when
	// rendered as a `<div>` (via `render`), so match that to satisfy the ref type.
	const rowRef = useRef< HTMLButtonElement >( null );

	useEffect( () => {
		if ( isPanelDefaultOpen ) {
			rowRef.current?.scrollIntoView( { block: 'center', behavior: 'smooth' } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const areCustomInputsVisible = isPanelOpen && service.needsCustomInputs;

	const brokenConnections = serviceConnections.filter( ( { status } ) => status === 'broken' );
	const reauthConnections = serviceConnections.filter( ( { status } ) => status === 'must_reauth' );

	const hasOwnBrokenConnections = useSelect(
		select => {
			const { canUserManageConnection } = select( socialStore );

			return brokenConnections.some( canUserManageConnection );
		},
		[ brokenConnections ]
	);

	// While reconnecting a credential-based service (e.g. Bluesky), show its input form even
	// though it has a broken connection, so the user can re-enter credentials in place.
	const isReconnectingThisService = useSelect(
		select => select( socialStore ).getReconnectingAccount()?.service_name === service.id,
		[ service.id ]
	);

	const hideInitialConnectForm =
		// For services with custom inputs, the initial Connect button opens the panel,
		// so we don't want to show it if the panel is already open
		areCustomInputsVisible ||
		// For services with broken connections, we want to show the "Fix connections" button
		// which opens the panel, so we don't want to show the initial connect form when the panel is already open
		( hasOwnBrokenConnections && isPanelOpen );

	const buttonLabel =
		brokenConnections.length > 1
			? _x( 'Fix connections', 'Fix the social media connections', 'jetpack-publicize-pkg' )
			: _x( 'Fix connection', 'Fix social media connection', 'jetpack-publicize-pkg' );

	return (
		<Collapsible.Root open={ isPanelOpen } onOpenChange={ setIsPanelOpen }>
			<Collapsible.Trigger
				ref={ rowRef }
				className={ styles[ 'service-row' ] }
				nativeButton={ false }
				render={ <div /> }
			>
				<div className={ styles[ 'service-row-icon' ] }>
					<service.icon iconSize={ isSmall ? 36 : 48 } />
				</div>
				<div className={ styles[ 'service-basics' ] }>
					<div className={ styles.heading }>
						<Text variant="body-lg" className={ styles.title }>
							{ service.label }
						</Text>
					</div>
					{ ! isSmall && ! serviceConnections.length ? (
						<span className={ styles.description }>{ service.description }</span>
					) : null }
					<ServiceStatus
						serviceConnections={ serviceConnections }
						brokenConnections={ brokenConnections }
						reauthConnections={ reauthConnections }
					/>
				</div>
				{ ! hideInitialConnectForm ? (
					<div
						className={ styles.actions }
						onClick={ stopPropagation }
						onKeyDown={ stopPropagation }
						role="presentation"
					>
						<ConnectForm
							service={ service }
							isSmall={ isSmall }
							compact
							onSubmit={
								hasOwnBrokenConnections || service.needsCustomInputs ? togglePanel : undefined
							}
							hasConnections={ serviceConnections.length > 0 }
							buttonLabel={ hasOwnBrokenConnections ? buttonLabel : undefined }
						/>
					</div>
				) : null }
				<Icon className={ styles.chevron } icon={ chevronDown } />
			</Collapsible.Trigger>
			<Collapsible.Panel className={ styles[ 'service-panel' ] }>
				<div className={ styles[ 'service-panel-inner' ] }>
					<ServiceItemDetails service={ service } serviceConnections={ serviceConnections } />
					{
						// Connect form for services that need custom inputs. Normally hidden when a
						// connection is broken (the "Fix connection" flow handles those), but shown
						// while reconnecting this service so its credentials can be re-entered.
						service.needsCustomInputs &&
						( ! hasOwnBrokenConnections || isReconnectingThisService ) ? (
							<div className={ styles[ 'connect-form-wrapper' ] }>
								<ConnectForm
									service={ service }
									displayInputs
									compact
									isSmall={ false }
									buttonLabel={ __( 'Submit', 'jetpack-publicize-pkg' ) }
								/>
							</div>
						) : null
					}
				</div>
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}
