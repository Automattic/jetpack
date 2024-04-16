import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	GOODREADS_SHELF_OPTIONS,
	GOODREADS_ORDER_OPTIONS,
	GOODREADS_SORT_OPTIONS,
	GOODREADS_DEFAULT_TITLE,
} from './utils';

const renderGoodreadsDisplaySettings = ( { attributes, setAttributes } ) => {
	const { showCover, showAuthor, showTitle, showRating, showReview, showTags } = attributes;

	return (
		<PanelBody PanelBody title={ __( 'Display Settings', 'jetpack' ) } initialOpen>
			<ToggleControl
				label={ __( 'Show cover', 'jetpack' ) }
				checked={ showCover }
				onChange={ () => setAttributes( { showCover: ! showCover } ) }
			/>

			<ToggleControl
				label={ __( 'Show author', 'jetpack' ) }
				checked={ showAuthor }
				onChange={ () => setAttributes( { showAuthor: ! showAuthor } ) }
			/>

			<ToggleControl
				label={ __( 'Show title', 'jetpack' ) }
				checked={ showTitle }
				onChange={ () => setAttributes( { showTitle: ! showTitle } ) }
			/>

			<ToggleControl
				label={ __( 'Show rating', 'jetpack' ) }
				checked={ showRating }
				onChange={ () => setAttributes( { showRating: ! showRating } ) }
			/>

			<ToggleControl
				label={ __( 'Show review', 'jetpack' ) }
				checked={ showReview }
				onChange={ () => setAttributes( { showReview: ! showReview } ) }
			/>

			<ToggleControl
				label={ __( 'Show tags', 'jetpack' ) }
				checked={ showTags }
				onChange={ () => setAttributes( { showTags: ! showTags } ) }
			/>
		</PanelBody>
	);
};

export function GoodreadsInspectorControls( { attributes, setAttributes } ) {
	const { style, shelfOption, bookNumber, orderOption, customTitle, sortOption } = attributes;

	return (
		<>
			<PanelBody PanelBody title={ __( 'Block Settings', 'jetpack' ) } initialOpen>
				<SelectControl
					label={ __( 'Shelf', 'jetpack' ) }
					value={ shelfOption }
					onChange={ value => setAttributes( { shelfOption: value } ) }
					options={ GOODREADS_SHELF_OPTIONS }
				/>

				<TextControl
					label={ __( 'Title', 'jetpack' ) }
					value={ customTitle || GOODREADS_DEFAULT_TITLE }
					onChange={ value => setAttributes( { customTitle: value } ) }
				/>

				<SelectControl
					label={ __( 'Sort by', 'jetpack' ) }
					value={ sortOption }
					onChange={ value => setAttributes( { sortOption: value } ) }
					options={ GOODREADS_SORT_OPTIONS }
				/>

				<SelectControl
					label={ __( 'Order', 'jetpack' ) }
					value={ orderOption }
					onChange={ value => setAttributes( { orderOption: value } ) }
					options={ GOODREADS_ORDER_OPTIONS }
				/>

				<TextControl
					label={ __( 'Number of books', 'jetpack' ) }
					type="number"
					inputMode="numeric"
					min="1"
					max={ style === 'grid' ? 200 : 100 }
					value={ bookNumber || 5 }
					onChange={ value => setAttributes( { bookNumber: value } ) }
				/>
			</PanelBody>
			{ style === 'default' && renderGoodreadsDisplaySettings( { attributes, setAttributes } ) }
		</>
	);
}

export function GoodreadsBlockControls( { attributes, setAttributes } ) {
	const { style } = attributes;
	const layoutControls = [
		{
			icon: 'list-view',
			title: __( 'Default view', 'jetpack' ),
			onClick: () => setAttributes( { style: 'default' } ),
			isActive: style === 'default',
		},
		{
			icon: 'grid-view',
			title: __( 'Grid view', 'jetpack' ),
			onClick: () => setAttributes( { style: 'grid' } ),
			isActive: style === 'grid',
		},
	];

	return (
		<>
			<ToolbarButton
				label={ __( 'Edit URL', 'jetpack' ) }
				icon="edit"
				onClick={ () => setAttributes( { goodreadsId: '' } ) }
			/>
			<ToolbarGroup controls={ layoutControls } />
		</>
	);
}
