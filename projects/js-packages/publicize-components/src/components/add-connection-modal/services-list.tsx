import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronDown } from '@wordpress/icons';
import classNames from 'classnames';
import { KeyringResult } from '../../social-store/types';
import { ConnectForm } from './connect-form';
import styles from './style.module.scss';
import { SupportedService, useSupportedServices } from './use-supported-services';

type ServicesListProps = {
	onSelectService: ( service: SupportedService | null ) => void;
	onConfirm: ( result: KeyringResult ) => void;
};

/**
 * Services list component
 *
 * @param {ServicesListProps} props - Component props
 *
 * @returns {import('react').ReactNode} Services list component
 */
export function ServicesList( { onSelectService, onConfirm }: ServicesListProps ) {
	const supportedServices = useSupportedServices();

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const onServiceSelected = useCallback(
		( service: SupportedService ) => () => {
			onSelectService( service );
		},
		[ onSelectService ]
	);

	return (
		<table>
			<thead>
				<tr>
					<th></th>
					<th></th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{ supportedServices.map( service => (
					<tr key={ service.ID }>
						<td>
							<service.icon iconSize={ isSmall ? 36 : 48 } />
						</td>
						<td
							className={ classNames( styles[ 'column-description' ], {
								[ styles.small ]: ! isSmall,
							} ) }
						>
							<h2 className={ styles.title }>{ service.label }</h2>
							{ ! isSmall ? <p className={ styles.description }>{ service.description }</p> : null }
						</td>
						<td>
							<div className={ styles[ 'column-actions' ] }>
								<ConnectForm
									service={ service }
									isSmall={ isSmall }
									onConfirm={ onConfirm }
									onSubmit={ service.needsCustomInputs ? onServiceSelected( service ) : undefined }
								/>
								<Button
									size={ isSmall ? 'small' : 'normal' }
									className={ styles[ 'chevron-button' ] }
									variant="secondary"
									onClick={ onServiceSelected( service ) }
									aria-label={ __( 'Learn more', 'jetpack' ) }
								>
									{ <Icon className={ styles.chevron } icon={ chevronDown } /> }
								</Button>
							</div>
						</td>
					</tr>
				) ) }
			</tbody>
		</table>
	);
}
