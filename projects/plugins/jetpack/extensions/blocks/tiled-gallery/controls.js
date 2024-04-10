import { BlockControls, InspectorControls, MediaUpload } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import EditButton from '../../shared/edit-button';
import { ALLOWED_MEDIA_TYPES, LAYOUT_CIRCLE, MAX_COLUMNS, MAX_ROUNDED_CORNERS } from './constants';
import FilterToolbar from './filter-toolbar';
import { layoutSupportsColumns } from './layout/utils';

const linkOptions = [
	{ value: 'attachment', label: __( 'Attachment Page', 'jetpack' ) },
	{ value: 'media', label: __( 'Media File', 'jetpack' ) },
	{ value: 'none', label: __( 'None', 'jetpack' ) },
];

export const TiledGalleryBlockControls = ( {
	images,
	onSelectImages,
	imageFilter,
	onFilterChange,
} ) => (
	<BlockControls>
		{ !! images.length && (
			<Fragment>
				<ToolbarGroup>
					<ToolbarItem>
						{ () => (
							<MediaUpload
								onSelect={ onSelectImages }
								allowedTypes={ ALLOWED_MEDIA_TYPES }
								multiple
								gallery
								value={ images.map( img => img.id ) }
								render={ ( { open } ) => (
									<EditButton label={ __( 'Edit Gallery', 'jetpack' ) } onClick={ open } />
								) }
							/>
						) }
					</ToolbarItem>
				</ToolbarGroup>
				<FilterToolbar value={ imageFilter } onChange={ onFilterChange } />
			</Fragment>
		) }
	</BlockControls>
);

export const TiledGalleryInspectorControls = ( {
	layoutStyle,
	images,
	columns,
	onColumnsChange,
	roundedCorners,
	onRoundedCornersChange,
	linkTo,
	onLinkToChange,
} ) => {
	return (
		<InspectorControls>
			<PanelBody title={ __( 'Tiled Gallery settings', 'jetpack' ) }>
				{ layoutSupportsColumns( layoutStyle ) && images.length > 1 && (
					<RangeControl
						label={ __( 'Columns', 'jetpack' ) }
						value={ columns }
						onChange={ onColumnsChange }
						min={ 1 }
						max={ Math.min( MAX_COLUMNS, images.length ) }
					/>
				) }
				{ layoutStyle !== LAYOUT_CIRCLE && (
					<RangeControl
						label={ __( 'Rounded corners', 'jetpack' ) }
						value={ roundedCorners }
						onChange={ onRoundedCornersChange }
						min={ 0 }
						max={ MAX_ROUNDED_CORNERS }
					/>
				) }
				<SelectControl
					label={ __( 'Link To', 'jetpack' ) }
					value={ linkTo }
					onChange={ onLinkToChange }
					options={ linkOptions }
				/>
			</PanelBody>
		</InspectorControls>
	);
};
