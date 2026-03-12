import type { ProviderCreator, ProviderCreatorResult } from '@wordpress/sync';

/**
 * Wraps a provider creator to enforce a per-room user limit.
 *
 * On every awareness change the wrapper counts unique WordPress user IDs
 * (from `collaboratorInfo.id`) excluding the local user. When the count
 * reaches the given limit the inner provider is destroyed.
 * When `roomUserLimit` is undefined or ≤ 0 the limit is not enforced.
 *
 * @param creator       - The provider creator to wrap.
 * @param roomUserLimit - Max other unique users before disabling.
 * @return Wrapped provider creator.
 */
export function withRoomLimit( creator: ProviderCreator, roomUserLimit?: number ): ProviderCreator {
	if ( ! roomUserLimit || roomUserLimit <= 0 ) {
		return creator;
	}

	const limit = roomUserLimit;

	return async ( options ): Promise< ProviderCreatorResult > => {
		const { awareness } = options;
		const innerProvider = await creator( options );
		let isDestroyed = false;

		/** Check awareness states and destroy the provider when the limit is reached. */
		function checkRoomLimit(): void {
			if ( isDestroyed || ! awareness ) {
				return;
			}

			const localState = awareness.getLocalState();
			const localUserId = localState?.collaboratorInfo?.id;
			if ( typeof localUserId !== 'number' ) {
				return;
			}

			const states = awareness.getStates();
			const otherUserIds = new Set< number >();

			for ( const [ , state ] of states ) {
				const userId = state?.collaboratorInfo?.id;
				if ( typeof userId === 'number' && userId !== localUserId ) {
					otherUserIds.add( userId );
				}
			}

			if ( otherUserIds.size >= limit ) {
				isDestroyed = true;
				awareness.off( 'change', checkRoomLimit );
				innerProvider.destroy();
			}
		}

		if ( awareness ) {
			awareness.on( 'change', checkRoomLimit );
			checkRoomLimit();
		}

		return {
			destroy: () => {
				if ( ! isDestroyed ) {
					isDestroyed = true;
					awareness?.off( 'change', checkRoomLimit );
					innerProvider.destroy();
				}
			},
			on: innerProvider.on.bind( innerProvider ),
		};
	};
}
