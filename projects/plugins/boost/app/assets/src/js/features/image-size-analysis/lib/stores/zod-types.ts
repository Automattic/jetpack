import { z } from 'zod';
/**
 * Zod Types
 */
const Dimensions = z.object( {
	width: z.number(),
	height: z.number(),
} );

export const ImageData = z
	.object( {
		id: z.string(),
		status: z.enum( [ 'active', 'ignored' ] ).default( 'active' ),
		type: z.enum( [ 'image_size', 'image_missing', 'bad_entry' ] ),
		thumbnail: z.string(),
		image: z.object( {
			url: z.string(),
			dimensions: z.object( {
				file: Dimensions,
				expected: Dimensions,
				size_on_screen: Dimensions,
			} ),
			weight: z.object( {
				current: z.number(),
				potential: z.number(),
			} ),
		} ),
		page: z.object( {
			id: z.number(),
			url: z.string().url(),
			title: z.string(),
			edit_url: z.string().url().nullable().default( null ),
		} ),
		device_type: z.enum( [ 'phone', 'desktop' ] ),
		instructions: z.string(),
	} )
	.catch( {
		id: '',
		type: 'bad_entry',
		status: 'active', // We still want to show the UI for this.
	} );

export type ImageDataType = z.infer< typeof ImageData >;

export const emptyImageSizeAnalysisData = {
	query: {
		page: 0,
		group: '',
		search: '',
	},
	data: {
		last_updated: 0,
		total_pages: 0,
		images: [],
	},
};

export const ImageSizeAnalysis = z
	.object( {
		query: z.object( {
			page: z.number(),
			group: z.string(),
			search: z.string(),
		} ),
		data: z.object( {
			last_updated: z.number(),
			total_pages: z.number(),
			images: z.array( ImageData ),
		} ),
	} )
	// Prevent fatal error when this module isn't available.
	.catch( emptyImageSizeAnalysisData );
