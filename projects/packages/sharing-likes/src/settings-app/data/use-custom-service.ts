import { useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store } from './store';
import type { CustomServiceFields, ServiceRow } from '../types';

/**
 * Create, edit and delete custom services.
 *
 * @return Operations, each resolving to whether it went through.
 */
export function useCustomService() {
	const { createCustomService, updateCustomService, deleteCustomService } = useDispatch( store );

	return useMemo(
		() => ( {
			create: createCustomService as (
				fields: CustomServiceFields,
				row: ServiceRow
			) => Promise< boolean >,
			update: updateCustomService as (
				id: string,
				fields: CustomServiceFields
			) => Promise< boolean >,
			remove: deleteCustomService as ( id: string ) => Promise< boolean >,
		} ),
		[ createCustomService, updateCustomService, deleteCustomService ]
	);
}
