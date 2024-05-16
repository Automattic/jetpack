import { useBreakpointMatch } from '@automattic/jetpack-components';
import { Disabled } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import classNames from 'classnames';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import { ServiceConnectionInfo } from './service-connection-info';
import styles from './style.module.scss';
import { SupportedService } from './use-supported-services';

export type ServicesItemDetailsProps = {
	service: SupportedService;
	serviceConnections?: Array< Connection >;
};

/**
 * Service item details component
 *
 * @param {ServicesItemDetailsProps} props - Component props
 *
 * @returns {import('react').ReactNode} Service item details component
 */
export function ServiceItemDetails( { service, serviceConnections }: ServicesItemDetailsProps ) {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const deletingConnections = useSelect( select => {
		const { getDeletingConnections } = select( socialStore );

		return getDeletingConnections();
	}, [] );

	if ( serviceConnections.length ) {
		return (
			<ul className={ styles[ 'service-connection-list' ] }>
				{ serviceConnections.map( connection => {
					return (
						<li key={ connection.connection_id }>
							<Disabled isDisabled={ deletingConnections.includes( connection.connection_id ) }>
								<ServiceConnectionInfo connection={ connection } service={ service } />
							</Disabled>
						</li>
					);
				} ) }
			</ul>
		);
	}

	return (
		<div
			className={ classNames( styles[ 'example-wrapper' ], {
				[ styles.small ]: isSmall,
			} ) }
		>
			{ service.examples.map( ( Example, idx ) => (
				<div key={ service.ID + idx } className={ styles.example }>
					<Example />
				</div>
			) ) }
		</div>
	);
}
