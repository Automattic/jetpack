/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { BlockControls, MediaPlaceholder, MediaUpload } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { get } from 'lodash';
import { IconButton, Toolbar, ToolbarButton } from '@wordpress/components';

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
				icon="format-image"
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
					<Toolbar>
						<MediaUpload
							onSelect={ onSelectMedia( setAttributes ) }
							allowedTypes={ [ 'image' ] }
							value={ featuredMediaId }
							render={ ( { open } ) => (
								<IconButton
									className="components-toolbar__control"
									label={ __( 'Edit Image', 'jetpack' ) }
									icon="edit"
									onClick={ open }
								/>
							) }
						/>
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
					</Toolbar>
				</BlockControls>
				<figure>
					<img src={ featuredMediaUrl } alt={ featuredMediaTitle } />
				</figure>
			</Fragment>
		</div>
	);
};
