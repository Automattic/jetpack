import { BlockControls, BlockIcon, MediaPlaceholder, MediaUpload } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton, ToolbarItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import EditButton from '../../shared/edit-button';

const onSelectMedia = setAttributes => media =>
	setAttributes( {
		featuredMediaId: get( media, 'id', 0 ),
		featuredMediaUrl: get( media, 'url', null ),
		featuredMediaTitle: get( media, 'title', null ),
	} );

export default ( { featuredMediaId, featuredMediaUrl, featuredMediaTitle, setAttributes } ) => {
	if ( ! featuredMediaId ) {
		return (
			<MediaPlaceholder
				icon={ <BlockIcon icon={ 'format-image' } /> }
				labels={ {
					title: __( 'Product Image', 'jetpack' ),
				} }
				accept="image/*"
				allowedTypes={ [ 'image' ] }
				onSelect={ onSelectMedia( setAttributes ) }
			/>
		);
	}

	return (
		<div>
			<Fragment>
				<BlockControls>
					<ToolbarGroup>
						<ToolbarItem>
							{ () => (
								<MediaUpload
									onSelect={ onSelectMedia( setAttributes ) }
									allowedTypes={ [ 'image' ] }
									value={ featuredMediaId }
									render={ ( { open } ) => (
										<EditButton label={ __( 'Edit Image', 'jetpack' ) } onClick={ open } />
									) }
								/>
							) }
						</ToolbarItem>
						<ToolbarButton
							icon={ 'trash' }
							title={ __( 'Remove Image', 'jetpack' ) }
							onClick={ () =>
								setAttributes( {
									featuredMediaId: null,
									featuredMediaUrl: null,
									featuredMediaTitle: null,
								} )
							}
						/>
					</ToolbarGroup>
				</BlockControls>
				<figure>
					<img src={ featuredMediaUrl } alt={ featuredMediaTitle } />
				</figure>
			</Fragment>
		</div>
	);
};
