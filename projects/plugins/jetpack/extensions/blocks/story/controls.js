import { BlockControls, MediaUpload } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import EditButton from '../../shared/edit-button';

export default ( { allowedMediaTypes, attributes: { mediaFiles }, onSelectMedia } ) => (
	<Fragment>
		<BlockControls>
			{ !! mediaFiles.length && (
				<ToolbarGroup>
					<ToolbarItem>
						{ () => (
							<MediaUpload
								title={ __( 'Edit Story', 'jetpack' ) }
								onSelect={ onSelectMedia }
								allowedTypes={ allowedMediaTypes }
								addToGallery
								multiple="add"
								value={ mediaFiles.map( file => file.id ) }
								render={ ( { open } ) => (
									<EditButton label={ __( 'Edit Story', 'jetpack' ) } onClick={ open } />
								) }
							/>
						) }
					</ToolbarItem>
				</ToolbarGroup>
			) }
		</BlockControls>
	</Fragment>
);
