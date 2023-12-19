import React, { useState, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import Button from '$features/image-size-analysis/button/button';
import { recordBoostEvent, recordBoostEventAndRedirect } from '$lib/utils/analytics';
import { type ImageDataType } from '$features/image-size-analysis';
import api from '$lib/api/api';

// @TODO: Move this to a DataSync Store.
const __DEV_ENABLE_FIX_BUTTON = false;

interface TableRowHoverProps {
	edit_url?: string;
	instructions: string;
	device_type: string | null;
	details: ImageDataType;
}

const TableRowHover: React.FC< TableRowHoverProps > = ( {
	edit_url,
	instructions,
	device_type,
	details,
} ) => {
	const [ imageDetails, setImageDetails ] = useState( details );

	const fixImageSize = useCallback( async () => {
		let postId = '0';
		if ( edit_url ) {
			const url = new URL( edit_url );
			postId = new URLSearchParams( url.search ).get( 'post' ) || '0';
		}

		if ( ! Jetpack_Boost.fixImageNonce ) {
			throw new Error( 'Missing Nonce: Jetpack Boost Image Autofix' );
		}

		const data = {
			imageUrl: imageDetails.image.url,
			imageWidth: imageDetails.image.dimensions.expected.width.toString(),
			imageHeight: imageDetails.image.dimensions.expected.height.toString(),
			postId,
			nonce: Jetpack_Boost.fixImageNonce,
			fix: ! imageDetails.image.fixed,
		};

		const response = await api.post( '/image-size-analysis/fix', data );
		if ( response.status === 'success' ) {
			const updatedDetails = { ...imageDetails };
			if ( response.changed === 'fix' ) {
				recordBoostEvent( 'isa_fix_image_success', {} );
				updatedDetails.image.fixed = true;
			} else {
				recordBoostEvent( 'isa_undo_fix_image_success', {} );
				updatedDetails.image.fixed = false;
			}
			setImageDetails( updatedDetails );
		} else {
			recordBoostEvent( 'isa_fix_image_failure', {} );
		}
	}, [ imageDetails ] );

	const handleFixClick = useCallback( () => {
		recordBoostEvent( 'isa_fix_image', {} );
		fixImageSize();
	}, [ fixImageSize ] );

	return (
		<div className="jb-row-hover">
			<p className="jb-row-hover__instruction">{ instructions }</p>

			{ edit_url && (
				<div className="jb-row-hover__button-container">
					{ __DEV_ENABLE_FIX_BUTTON && device_type === 'desktop' ? (
						<Button width="auto" fill onClick={ handleFixClick }>
							{ imageDetails.image.fixed
								? __( 'Undo Fix', 'jetpack-boost' )
								: __( 'Fix', 'jetpack-boost' ) }
						</Button>
					) : (
						<Button
							small
							fill
							onClick={ () =>
								recordBoostEventAndRedirect( edit_url, 'clicked_edit_page_on_isa_report', {
									device_type: device_type || 'unknown',
								} )
							}
						>
							{ __( 'Edit Page', 'jetpack-boost' ) }
						</Button>
					) }
				</div>
			) }
		</div>
	);
};

export default TableRowHover;
