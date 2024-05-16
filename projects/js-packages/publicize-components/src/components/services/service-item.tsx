import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { Panel, PanelBody } from '@wordpress/components';
import { useCallback, useReducer } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chevronDown } from '@wordpress/icons';
import { KeyringResult } from '../../social-store/types';
import { ConnectForm } from './connect-form';
import { ServiceItemDetails, ServicesItemDetailsProps } from './service-item-details';
import styles from './style.module.scss';
import { SupportedService } from './use-supported-services';

export type ServicesItemProps = ServicesItemDetailsProps & {
	onSelectService: ( service: SupportedService | null ) => void;
	onConfirm: ( result: KeyringResult ) => void;
};

/**
 * Service item component
 *
 * @param {ServicesItemProps} props - Component props
 *
 * @returns {import('react').ReactNode} Service item component
 */
export function ServiceItem( {
	service,
	onConfirm,
	onSelectService,
	serviceConnections,
}: ServicesItemProps ) {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const onServiceSelected = useCallback(
		( selectedService: SupportedService ) => () => {
			onSelectService( selectedService );
		},
		[ onSelectService ]
	);

	const [ isPanelOpen, togglePanel ] = useReducer( state => ! state, false );

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
					<ConnectForm
						service={ service }
						isSmall={ isSmall }
						onConfirm={ onConfirm }
						onSubmit={ service.needsCustomInputs ? onServiceSelected( service ) : undefined }
						hasConnections={ serviceConnections.length > 0 }
					/>
					<Button
						size={ 'small' }
						className={ styles[ 'learn-more' ] }
						variant="tertiary"
						onClick={ togglePanel }
						aria-label={ __( 'Learn more', 'jetpack' ) }
					>
						{ <Icon className={ styles.chevron } icon={ chevronDown } /> }
					</Button>
				</div>
			</div>

			<Panel className={ styles[ 'service-panel' ] }>
				<PanelBody opened={ isPanelOpen } onToggle={ togglePanel }>
					<ServiceItemDetails service={ service } serviceConnections={ serviceConnections } />
				</PanelBody>
			</Panel>
		</div>
	);
}
