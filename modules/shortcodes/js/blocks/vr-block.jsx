/* global wp, _, */
/* eslint react/react-in-jsx-scope: 0 */
const { __ } = wp.i18n;
const {
	registerBlockType,
	UrlInput,
	source: {
		children
	}
} = wp.blocks;
const {
	Placeholder
} = wp.components;

registerBlockType( 'gutenpack/vr', {
	title: __( 'VR' ),
	icon: 'sort',
	category: 'layout',
	attributes: {
		url: children( 'url' )
	},

	edit: props => {
		const attributes = props.attributes;
		const onSetUrl = ( value ) => {
			props.setAttributes( { url: value } );
		};

		const renderEdit = () => {
			if ( attributes.url ) {
				return (
					<iframe
						allowFullScreen="true"
						frameBorder="0"
						width="525"
						height="300"
						src={ "https://vr.me.sh/view/?url=" + attributes.url }
					/>
				);
			}
			return (
				<div>
					<Placeholder
						key="placeholder"
						instructions={ __( 'Enter URL to VR image' ) }
						icon="format-image"
						label={ __( 'VR Image' ) }
						className={ props.className }
					>
						<UrlInput
							value={ attributes.url }
							onChange={ onSetUrl }
						/>
					</Placeholder>
				</div>
			);
		};

		return renderEdit();
	},
	save: () => {
		return null;
	}
} );
