/**
 * External dependencies
 */
import { compose } from '@wordpress/compose';
import { MediaPlaceholder } from '@wordpress/block-editor';
import { withNotices } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

const ImgUpload = props => {
	const { image, noticeOperations, noticeUI, onChange, placeHolderTitle, placeHolderLabel } = props;

	const renderImage = <img id={ image.id } src={ image.url } alt={ image.alt } />;

	const renderPlaceholder = (
		<Fragment>
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

	if ( image && image.url ) {
		return renderImage;
	}

	return renderPlaceholder;
};

export default compose( [ withNotices ] )( ImgUpload );
