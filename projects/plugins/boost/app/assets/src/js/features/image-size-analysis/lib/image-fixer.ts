// const [ imageDetails, setImageDetails ] = useState( details );

import { IsaImage } from './stores/types';

// 	const fixImageSize = useCallback( async () => {
// 		let postId = '0';
// 		if ( edit_url ) {
// 			const url = new URL( edit_url );
// 			postId = new URLSearchParams( url.search ).get( 'post' ) || '0';
// 		}

// 		if ( ! Jetpack_Boost.fixImageNonce ) {
// 			throw new Error( 'Missing Nonce: Jetpack Boost Image Autofix' );
// 		}

// 		const data: FixImageData = {
// 			imageUrl: imageDetails.image.url,
// 			imageWidth: imageDetails.image.dimensions.expected.width.toString(),
// 			imageHeight: imageDetails.image.dimensions.expected.height.toString(),
// 			postId,
// 			nonce: Jetpack_Boost.fixImageNonce,
// 			fix: ! imageDetails.image.fixed,
// 		};

// 		const response = await api.post( '/image-size-analysis/fix', data );
// 		if ( response.status === 'success' ) {
// 			const updatedDetails = { ...imageDetails };
// 			if ( response.changed === 'fix' ) {
// 				recordBoostEvent( 'isa_fix_image_success', {} );
// 				updatedDetails.image.fixed = true;
// 			} else {
// 				recordBoostEvent( 'isa_undo_fix_image_success', {} );
// 				updatedDetails.image.fixed = false;
// 			}
// 			setImageDetails( updatedDetails );
// 		} else {
// 			recordBoostEvent( 'isa_fix_image_failure', {} );
// 		}
// 	}, [ imageDetails ] );

// 	const handleFixClick = useCallback( () => {
// 		recordBoostEvent( 'isa_fix_image', {} );
// 		fixImageSize();
// 	}, [ fixImageSize ] );

export function fixImage( imageId: IsaImage[ 'id' ] ) {}
