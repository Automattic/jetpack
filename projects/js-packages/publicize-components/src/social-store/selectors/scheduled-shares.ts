import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { ScheduledShare } from '../types';

/**
 * Get the list of scheduled shares for a post.
 *
 * @param state - State object.
 *
 * @return The list of services.
 */
export const getScheduledSharesForPost = createRegistrySelector( select => {
	return ( state: unknown, post_id: number ) => {
		const data = select( coreStore ).getEntityRecords< ScheduledShare >(
			'wpcom/v2',
			'publicize/scheduled-actions',
			{ post_id }
		);

		return data ?? [];
	};
} );

export const isSavingScheduledShare = createRegistrySelector( select => {
	return () =>
		select( coreStore ).isSavingEntityRecord(
			'wpcom/v2',
			'publicize/scheduled-actions',
			undefined
		);
} );

/**
 * Returns whether the scheduled shares for a post are being fetched.
 */
export const isFetchingScheduledSharesForPost = createRegistrySelector( select => {
	return ( state: unknown, post_id: number ): boolean => {
		const {
			// @ts-expect-error isResolving does exist but is not typed
			isResolving,
		} = select( coreStore );

		return isResolving( 'getEntityRecords', [
			'wpcom/v2',
			'publicize/scheduled-actions',
			{ post_id },
		] );
	};
} );

/**
 * Returns whether a scheduled share is being deleted.
 */
export const isDeletingScheduledShare = createRegistrySelector( select => {
	return ( state: unknown, id: number ): boolean => {
		return select( coreStore ).isDeletingEntityRecord(
			'wpcom/v2',
			'publicize/scheduled-actions',
			id
		);
	};
} );
