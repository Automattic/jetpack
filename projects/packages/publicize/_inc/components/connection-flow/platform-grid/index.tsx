import { useCallback } from '@wordpress/element';
import { Text } from '@wordpress/ui';
import { SupportedService } from '../../services/types';
import { useSupportedServices } from '../../services/use-supported-services';
import styles from './style.module.scss';

interface PlatformCardProps {
	service: SupportedService;
	onSelect: ( serviceId: string ) => void;
}

/**
 * A single platform card button.
 *
 * @param {PlatformCardProps} props - Component props.
 *
 * @return The platform card button.
 */
function PlatformCard( { service, onSelect }: PlatformCardProps ) {
	const ServiceIcon = service.icon;

	const handleClick = useCallback( () => onSelect( service.id ), [ onSelect, service.id ] );

	return (
		<button type="button" className={ styles.card } onClick={ handleClick }>
			<ServiceIcon iconSize={ 48 } />
			<span className={ styles.details }>
				<Text variant="body-lg" render={ <span className={ styles.title } /> }>
					{ service.shortLabel || service.label }
				</Text>
				<Text variant="body-md" render={ <span className={ styles[ 'account-type' ] } /> }>
					{ service.accountType }
				</Text>
			</span>
		</button>
	);
}

interface PlatformGridProps {
	onSelect: ( serviceId: string ) => void;
}

/**
 * A 3-column grid of every supported platform. Shared between the connection
 * flow's `select-platform` step and the dashboard "get started" empty state;
 * each context decides what selecting a platform does via `onSelect`.
 *
 * @param {PlatformGridProps} props - Component props.
 *
 * @return The platform grid.
 */
export function PlatformGrid( { onSelect }: PlatformGridProps ) {
	const supportedServices = useSupportedServices();

	return (
		<ul className={ styles.grid }>
			{ supportedServices.map( service => (
				<li key={ service.id }>
					<PlatformCard service={ service } onSelect={ onSelect } />
				</li>
			) ) }
		</ul>
	);
}
