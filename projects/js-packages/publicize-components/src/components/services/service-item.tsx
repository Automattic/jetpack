import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { Panel, PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useReducer, useRef } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Icon, chevronDown, chevronUp } from '@wordpress/icons';
import { store as socialStore } from '../../social-store';
import { ConnectForm } from './connect-form';
import { ServiceItemDetails, ServicesItemDetailsProps } from './service-item-details';
import { ServiceStatus } from './service-status';
import styles from './style.module.scss';

export type ServicesItemProps = ServicesItemDetailsProps & {
	isPanelDefaultOpen?: boolean;
};

/**
 * Service item component
 *
 * @param {ServicesItemProps} props - Component props
 *
 * @return {import('react').ReactNode} Service item component
 */
export function ServiceItem( {
	service,
	serviceConnections,
	isPanelDefaultOpen,
}: ServicesItemProps ) {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const [ isPanelOpen, togglePanel ] = useReducer( state => ! state, isPanelDefaultOpen );
	const panelRef = useRef< HTMLDivElement >( null );

	useEffect( () => {
		if ( isPanelDefaultOpen ) {
			panelRef.current?.scrollIntoView( { block: 'center', behavior: 'smooth' } );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const areCustomInputsVisible = isPanelOpen && service.needsCustomInputs;

	const brokenConnections = serviceConnections.filter( ( { status } ) => status === 'broken' );

	const hasOwnBrokenConnections = useSelect(
		select => {
			const { canUserManageConnection } = select( socialStore );

			return brokenConnections.some( canUserManageConnection );
		},
		[ brokenConnections ]
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
			? _x( 'Fix connections', 'Fix the social media connections', 'jetpack-publicize-components' )
			: _x( 'Fix connection', 'Fix social media connection', 'jetpack-publicize-components' );

	return (
		<div className={ styles[ 'service-item' ] }>
			<div className={ styles[ 'service-item-info' ] }>
				<div>
					<service.icon iconSize={ isSmall ? 36 : 48 } />
				</div>
				<div className={ styles[ 'service-basics' ] }>
					<div className={ styles.heading }>
						<span className={ styles.title }>{ service.label }</span>
						{ service.badges?.length ? (
							<div className={ styles.badges }>
								{ service.badges.map( ( { text, style }, index ) => (
									<span key={ index } className={ styles.badge } style={ style }>
										{ text }
									</span>
								) ) }
							</div>
						) : null }
					</div>
					{ ! isSmall && ! serviceConnections.length ? (
						<span className={ styles.description }>{ service.description }</span>
					) : null }
					<ServiceStatus
						serviceConnections={ serviceConnections }
						brokenConnections={ brokenConnections }
					/>
				</div>
				<div className={ styles.actions }>
					{ ! hideInitialConnectForm ? (
						<ConnectForm
							service={ service }
							isSmall={ isSmall }
							onSubmit={
								hasOwnBrokenConnections || service.needsCustomInputs ? togglePanel : undefined
							}
							hasConnections={ serviceConnections.length > 0 }
							buttonLabel={ hasOwnBrokenConnections ? buttonLabel : undefined }
						/>
					) : null }
					<Button
						size={ 'small' }
						className={ styles[ 'learn-more' ] }
						variant="tertiary"
						onClick={ togglePanel }
						aria-label={ __( 'Learn more', 'jetpack-publicize-components' ) }
					>
						{ <Icon className={ styles.chevron } icon={ isPanelOpen ? chevronUp : chevronDown } /> }
					</Button>
				</div>
			</div>

			<Panel className={ styles[ 'service-panel' ] } ref={ panelRef }>
				<PanelBody opened={ isPanelOpen } onToggle={ togglePanel }>
					<ServiceItemDetails service={ service } serviceConnections={ serviceConnections } />
					{
						// Connect form for services that need custom inputs
						// should be shown only if there are no broken connections
						service.needsCustomInputs && ! hasOwnBrokenConnections ? (
							<div className={ styles[ 'connect-form-wrapper' ] }>
								<ConnectForm
									service={ service }
									displayInputs
									isSmall={ false }
									buttonLabel={ __( 'Connect', 'jetpack-publicize-components' ) }
								/>
							</div>
						) : null
					}
				</PanelBody>
			</Panel>
		</div>
	);
}
