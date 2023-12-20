import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import BrokenDataRow from '../row-types/broken-data-row/broken-data-row';
import ImageMissingRow from '../row-types/image-missing-row/image-missing-row';
import ImageSizeRow from '../row-types/image-size-row/image-size-row';
import LoadingRow from '../row-types/loading-row/loading-row';
import Spinner from '$features/ui/spinner/spinner';
import {
	useImageFixer,
	type IsaImage,
	type IsaReport,
	ISAStatus,
} from '$features/image-size-analysis';
import classnames from 'classnames';

interface TableProps {
	isaDataLoading: boolean;
	activeGroup?: string;
	images: IsaImage[];
	isaReport?: IsaReport;
}

const Table = ( { isaDataLoading, activeGroup, images, isaReport }: TableProps ) => {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ activeImages, setActiveImages ] = useState< IsaImage[] >( [] );
	const [ jobFinished, setJobFinished ] = useState( false );
	const imageFixer = useImageFixer();

	function toggleImageFix( imageId: IsaImage[ 'id' ] ) {
		const imageDetails = images.find( image => image.id === imageId );

		if ( ! imageDetails ) {
			return;
		}

		const edit_url = imageDetails?.page.edit_url;
		let postId = '0';
		if ( edit_url ) {
			const url = new URL( edit_url );
			postId = new URLSearchParams( url.search ).get( 'post' ) || '0';
		}

		imageFixer.mutate( {
			image_id: imageId,
			image_url: imageDetails.image.url,
			image_width: imageDetails.image.dimensions.expected.width.toString(),
			image_height: imageDetails.image.dimensions.expected.height.toString(),
			post_id: postId,
			nonce: Jetpack_Boost.fixImageNonce as string, // @TODO: Use a real nonce....
			fix: ! imageDetails.image.fixed,
		} );
	}

	useEffect( () => {
		setIsLoading( isaDataLoading );
		setJobFinished( isaReport?.status === ISAStatus.Completed );
		setActiveImages( images );
	}, [ isaDataLoading, activeGroup, images, isaReport ] );

	return (
		<>
			<div className={ classnames( 'jb-loading-spinner', { 'jb-active': isLoading } ) }>
				<Spinner size="3rem" lineWidth="4px" />
			</div>

			{ ! isLoading && activeImages.length === 0 ? (
				<h1>
					{ jobFinished
						? __( '🥳 No image size issues found!', 'jetpack-boost' )
						: __( 'No image size issues found yet…', 'jetpack-boost' ) }
				</h1>
			) : (
				<div className={ classnames( 'jb-table', { 'jb-loading': isLoading } ) }>
					<div className="jb-table-header jb-recommendation-page-grid">
						<div className="jb-table-header__image">Image</div>
						<div className="jb-table-header__potential-size">Potential Size</div>
						<div className="jb-table-header__device">Device</div>
						<div className="jb-table-header__page">Page/Post</div>
					</div>

					{ isLoading
						? [ ...Array( 10 ) ].map( ( _, i ) => <LoadingRow key={ i } /> )
						: activeImages.map( image =>
								image.type === 'image_size' ? (
									<ImageSizeRow
										key={ image.id }
										enableTransition={ images.length > 0 }
										details={ image }
										toggleImageFix={ toggleImageFix }
									/>
								) : image.type === 'image_missing' ? (
									<ImageMissingRow
										key={ image.id }
										enableTransition={ images.length > 0 }
										details={ image }
									/>
								) : (
									<BrokenDataRow key={ image.id } />
								)
						  ) }
				</div>
			) }
		</>
	);
};

export default Table;
