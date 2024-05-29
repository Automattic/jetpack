import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { Panel, PanelBody } from '@wordpress/components';
import { useReducer } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chevronDown, chevronUp } from '@wordpress/icons';
import { ConnectForm } from './connect-form';
import { ServiceItemDetails, ServicesItemDetailsProps } from './service-item-details';
import styles from './style.module.scss';

export type ServicesItemProps = ServicesItemDetailsProps;

/**
 * Service item component
 *
 * @param {ServicesItemProps} props - Component props
 *
 * @returns {import('react').ReactNode} Service item component
 */
export function ServiceItem( { service, serviceConnections }: ServicesItemProps ) {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const [ isPanelOpen, togglePanel ] = useReducer( state => ! state, false );

	const isMastodonPanelOpen = isPanelOpen && service.ID === 'mastodon';

	return (
		<div className={ styles[ 'service-item' ] }>
			<div className={ styles[ 'service-item-info' ] }>
				<div>
					<service.icon iconSize={ isSmall ? 36 : 48 } />
				</div>
				<div className={ styles[ 'service-basics' ] }>
					<span className={ styles.title }>{ service.label }</span>
					{ ! isSmall && ! serviceConnections.length ? (
						<span className={ styles.description }>{ service.description }</span>
					) : null }
					{ serviceConnections?.length > 0 ? (
						<span className={ styles[ 'active-connection' ] }>
							{ serviceConnections.length > 1
								? sprintf(
										// translators: %d: Number of connections
										__( '%d connections', 'jetpack' ),
										serviceConnections.length
								  )
								: __( 'Connected', 'jetpack' ) }
						</span>
					) : null }
				</div>
				<div className={ styles.actions }>
					{ ! isMastodonPanelOpen ? (
						<ConnectForm
							service={ service }
							isSmall={ isSmall }
							onSubmit={ service.needsCustomInputs ? togglePanel : undefined }
							hasConnections={ serviceConnections.length > 0 }
						/>
					) : null }
					<Button
						size={ 'small' }
						className={ styles[ 'learn-more' ] }
						variant="tertiary"
						onClick={ togglePanel }
						aria-label={ __( 'Learn more', 'jetpack' ) }
					>
						{ <Icon className={ styles.chevron } icon={ isPanelOpen ? chevronUp : chevronDown } /> }
					</Button>
				</div>
			</div>

			<Panel className={ styles[ 'service-panel' ] }>
				<PanelBody opened={ isPanelOpen } onToggle={ togglePanel }>
					<ServiceItemDetails service={ service } serviceConnections={ serviceConnections } />

					{ service.ID === 'mastodon' ? (
						<div className={ styles[ 'connect-form-wrapper' ] }>
							<ConnectForm
								service={ service }
								displayInputs
								isSmall={ false }
								buttonLabel={ __( 'Connect', 'jetpack' ) }
							/>
						</div>
					) : null }
				</PanelBody>
			</Panel>
		</div>
	);
}
