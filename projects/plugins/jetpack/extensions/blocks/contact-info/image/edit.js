import { MediaPlaceholder } from '@wordpress/block-editor';
import { withNotices } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

const ImageEdit = props => {
	const { attributes, noticeOperations, noticeUI, setAttributes } = props;
	const { image } = attributes;

	const onChange = ( { id, url, alt } ) => {
		setAttributes( { image: { id, url, alt } } );
	};

	if ( image && image.url ) {
		return <img id={ image.id } src={ image.url } alt={ image.alt } />;
	}

	return (
		<MediaPlaceholder
			labels={ {
				title: __( 'Logo', 'jetpack' ),
				instructions: __( 'Upload an image to represent your organization.', 'jetpack' ),
			} }
			accept="image/*"
			allowedTypes={ [ 'image' ] }
			onSelect={ onChange }
			onError={ msg => noticeOperations.createErrorNotice( msg ) }
			notices={ noticeUI }
		/>
	);
};

export default compose( [ withNotices ] )( ImageEdit );
