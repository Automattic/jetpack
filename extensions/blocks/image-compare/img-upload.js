/**
 * External dependencies
 */
import { compose } from '@wordpress/compose';
import { MediaPlaceholder } from '@wordpress/block-editor';
import { withNotices } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

const ImgUpload = ( {
	noticeOperations,
	noticeUI,
	onChange,
	placeHolderTitle,
	placeHolderLabel,
} ) => {
	return (
		<Fragment>
			<div className="components-placeholder__label">{ placeHolderTitle }</div>
			<MediaPlaceholder
				labels={ { title: placeHolderLabel } }
				accept="image/*"
				allowedTypes={ [ 'image' ] }
				onSelect={ onChange }
				onError={ msg => noticeOperations.createErrorNotice( msg ) }
				notices={ noticeUI }
			/>
		</Fragment>
	);
};

export default compose( [ withNotices ] )( ImgUpload );
