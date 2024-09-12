import { useDataSyncAction } from '@automattic/jetpack-react-data-sync-client';
import { IsaGlobal } from './stores/types';
import { recordBoostEvent } from '$lib/utils/analytics';
import { z } from 'zod';

const ImageSizeActionResult = z.object( {
	image_id: z.string(),
	status: z.enum( [ 'success', 'error' ] ),
	code: z.string(),
	changed: z.enum( [ 'fix', 'removed' ] ).optional(),
} );

const ImageSizeActionRequest = z.object( {
	image_id: z.coerce.string(),
	image_url: z.string(),
	image_width: z.coerce.string(),
	image_height: z.coerce.string(),
	post_id: z.coerce.string(),
	fix: z.boolean(),
} );

export function useImageFixer( group = 'all', page = 1 ) {
	return useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'image_size_analysis',
		action_name: 'fix',
		schema: {
			state: IsaGlobal,
			action_response: ImageSizeActionResult,
			action_request: ImageSizeActionRequest,
		},
		params: {
			group,
			page,
		},
		callbacks: {
			onResult: result => {
				if ( result.status !== 'success' ) {
					recordBoostEvent( 'isa_fix_image_failure', {} );
					throw new Error( 'Failed to save fixes' );
				}
				const event =
					result.changed === 'fix' ? 'isa_fix_image_success' : 'isa_undo_fix_image_success';
				recordBoostEvent( event, {} );
			},
			optimisticUpdate: ( value, state ) => {
				const image_id = value.image_id;
				const updatedState = { ...state };
				const imageIndex = updatedState.images.findIndex( image => image.id === image_id );
				updatedState.images[ imageIndex ].image.fixed =
					! updatedState.images[ imageIndex ].image.fixed;
				return updatedState;
			},
		},
	} );
}
