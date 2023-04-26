import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import './editor.scss';

export default function Edit( props ) {
	const { attributes, setAttributes, className } = props;
	const { title, hide_invisible, limit, orderby, order } = attributes;
	const select_options = [
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
	];
	const blockProps = useBlockProps();

	function onChangeHideInvisible() {
		setAttributes( { hide_invisible: ! hide_invisible } );
	}
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

					<ToggleControl
						label={ __( 'Hide invisible links', 'jetpack' ) }
						checked={ !! hide_invisible }
						onChange={ onChangeHideInvisible }
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
						options={ select_options }
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
				</PanelBody>
			</InspectorControls>
		</div>
	);
}
