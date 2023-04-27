import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import './editor.scss';

export default function Edit( props ) {
	const { attributes, setAttributes, className } = props;
	const { title, title_markup, hide_invisible, limit, orderby, order, list_style } = attributes;

	const blockProps = useBlockProps();

	return (
		<div className={ className } { ...blockProps }>
			<ServerSideRender block="jetpack/blogroll" attributes={ attributes } />

			<InspectorControls>
				<PanelBody title={ 'Blogroll Title' }>
					<TextControl
						type="text"
						label={ __( 'Title', 'jetpack' ) }
						value={ title }
						onChange={ value => setAttributes( { title: value } ) }
					/>
					<SelectControl
						label={ __( 'Title Markup', 'jetpack' ) }
						value={ title_markup }
						options={ [
							{ label: 'h1', value: 'h1' },
							{ label: 'h2', value: 'h2' },
							{ label: 'h3', value: 'h3' },
							{ label: 'h4', value: 'h4' },
							{ label: 'h5', value: 'h5' },
							{ label: 'p', value: 'p' },
						] }
						onChange={ value => setAttributes( { title_markup: value } ) }
					/>

					<ToggleControl
						label={ __( 'Hide invisible links', 'jetpack' ) }
						checked={ !! hide_invisible }
						onChange={ () => setAttributes( { hide_invisible: ! hide_invisible } ) }
					/>

					<TextControl
						label={ __( 'Number of visible links', 'jetpack' ) }
						type={ 'number' }
						value={ limit }
						onChange={ value => setAttributes( { limit: value } ) }
					/>
					<SelectControl
						label={ __( 'Select an order preference', 'jetpack' ) }
						value={ orderby }
						options={ [
							{
								label: __( 'Name', 'jetpack' ),
								value: 'name',
							},
							{
								label: __( 'Url', 'jetpack' ),
								value: 'url',
							},
							{
								label: __( 'Category', 'jetpack' ),
								value: 'categories',
							},
							{
								label: __( 'Rating', 'jetpack' ),
								value: 'Rating',
							},
						] }
						onChange={ value => setAttributes( { orderby: value } ) }
					/>
					<SelectControl
						label={ __( 'Order direction', 'jetpack' ) }
						value={ order }
						options={ [
							{ label: __( 'Ascending', 'jetpack' ), value: 'ASC' },
							{ label: __( 'Descending', 'jetpack' ), value: 'DESC' },
						] }
						onChange={ value => setAttributes( { order: value } ) }
					/>
					<SelectControl
						label={ __( 'List style', 'jetpack' ) }
						value={ list_style }
						options={ [
							{ label: __( 'None', 'jetpack' ), value: 'none' },
							{ label: __( 'Ordered', 'jetpack' ), value: 'ordered' },
							{ label: __( 'Unordered', 'jetpack' ), value: 'unordered' },
						] }
						onChange={ value => setAttributes( { list_style: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</div>
	);
}
