import { Connection } from '../../social-store/types';
import { SupportedService } from './types';
import { XNotice } from './x-notice';

export type ServicesItemNoticeProps = {
	service: SupportedService;
	serviceConnections: Array< Connection >;
};

/**
 * Service item notice component
 *
 * @param {ServicesItemNoticeProps} props - Component props
 *
 * @return Service item notice component
 */
export function ServiceItemNotice( { service, serviceConnections }: ServicesItemNoticeProps ) {
	switch ( service.id ) {
		case 'x':
			return serviceConnections.length > 0 ? <XNotice /> : null;

		default:
			return null;
	}
}
