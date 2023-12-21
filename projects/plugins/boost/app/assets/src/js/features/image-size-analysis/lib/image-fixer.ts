import { useDataSyncAction } from '@automattic/jetpack-react-data-sync-client';
import { IsaGlobal, IsaImage } from './stores/types';
import { recordBoostEvent } from '$lib/utils/analytics';
import { z } from 'zod';

type FixImageData = {
	image_id: IsaImage[ 'id' ];
	image_url: string;
	image_width: string;
	image_height: string;
	post_id: string;
	fix: boolean;
};

const ImageSizeActionResult = z.object( {
	image_id: z.string(),
	status: z.enum( [ 'success', 'error' ] ),
	code: z.string(),
	changed: z.enum( [ 'fix', 'removed' ] ).optional(),
} );

export function useImageFixer() {
	return useDataSyncAction< FixImageData >()(
		'jetpack_boost_ds',
		'image_size_analysis',
		'fix',
		IsaGlobal,
		ImageSizeActionResult,
		( result, state ) => {
			if ( result.status !== 'success' ) {
				recordBoostEvent( 'isa_fix_image_failure', {} );
				throw new Error( 'Failed to save fixes' );
			}
			const image_id = result.image_id as IsaImage[ 'id' ];
			const updatedState = { ...state };
			const imageIndex = updatedState.images.findIndex( image => image.id === image_id );
			updatedState.images[ imageIndex ].image.fixed = result.changed === 'fix';

			const event =
				result.changed === 'fix' ? 'isa_fix_image_success' : 'isa_undo_fix_image_success';
			recordBoostEvent( event, {} );
			return updatedState;
		},
		{},
		{
			group: 'all',
			page: 1,
		}
	);
}
