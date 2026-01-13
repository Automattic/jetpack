import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { EMPTY_ARRAY } from '../constants';
import { ScheduledShare, SocialStoreState } from '../types';

/**
 * Get the list of scheduled shares for a post.
 *
 * @param state - State object.
 *
 * @return The list of services.
 */
export const getScheduledSharesForPost = createRegistrySelector( select => {
	return ( state: unknown, post_id: number ): Array< ScheduledShare > => {
		const data = select( coreStore ).getEntityRecords< ScheduledShare >(
			'wpcom/v2',
			'publicize/scheduled-actions',
			{ post_id }
		);

		return data ?? EMPTY_ARRAY;
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
 * Whether the current post is being scheduled for sharing.
 *
 * @param state - State object.
 *
 * @return Whether the current post is being scheduled for sharing.
 */
export function isSchedulingShares( state: SocialStoreState ) {
	return state.scheduledShares?.isScheduling ?? false;
}

/**
 * Returns whether the scheduled shares for a post are being fetched.
 */
export const isFetchingScheduledSharesForPost = createRegistrySelector( select => {
	return ( state: unknown, post_id: number ): boolean => {
		// @ts-expect-error TS2339 -- isResolving is there but not declared; AFAICT, it's a base method from @wordpress/data and @wordpress/core-data only declares its custom methods.
		const { isResolving } = select( coreStore );

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
