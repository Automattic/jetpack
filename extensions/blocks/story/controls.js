/**
 * External dependencies
 */
import { BlockControls, MediaUpload } from '@wordpress/block-editor';
import { Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import EditButton from '../../shared/edit-button';

export default ( { allowedMediaTypes, attributes: { mediaFiles }, onSelectMedia } ) => (
	<Fragment>
		<BlockControls>
			{ !! mediaFiles.length && (
				<Toolbar>
					<MediaUpload
						onSelect={ onSelectMedia }
						allowedTypes={ allowedMediaTypes }
						multiple
						gallery
						value={ mediaFiles.map( file => file.id ) }
						render={ ( { open } ) => (
							<EditButton label={ __( 'Edit Story', 'jetpack' ) } onClick={ open } />
						) }
					/>
				</Toolbar>
			) }
		</BlockControls>
	</Fragment>
);
