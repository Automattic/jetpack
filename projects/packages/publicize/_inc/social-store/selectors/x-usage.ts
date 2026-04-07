import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { EMPTY_ARRAY } from '../constants';

export type XUsageItem = {
	period: string;
	used: number;
	pending: number;
	total: number;
};

/**
 * Get the list of X usage items.
 *
 * @return The list of X usage items.
 */
export const getXUsage = createRegistrySelector( select => (): Array< XUsageItem > => {
	const data = select( coreStore ).getEntityRecords< XUsageItem >(
		'wpcom/v2',
		'publicize/x-usage'
	);

	return data ?? EMPTY_ARRAY;
} );

/**
 * Get a specific X usage item by period.
 *
 * @param _state - State object.
 * @param period - The period identifier (e.g. 'yyyy-mm' or 'free').
 *
 * @return The X usage item.
 */
export function getXUsageFor( _state: unknown, period: string ) {
	return getXUsage().find( item => item.period === period );
}

/**
 * Returns whether the X usage list is being fetched.
 */
export const isFetchingXUsage = createRegistrySelector( select => (): boolean => {
	const { isResolving } = select( coreStore );

	return isResolving( 'getEntityRecords', [ 'wpcom/v2', 'publicize/x-usage' ] );
} );
