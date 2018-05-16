/* global wp */
/* eslint react/react-in-jsx-scope: 0 */

( function( blocks, components, i18n ) {
	const {
		registerBlockType,
		UrlInput
	} = blocks;
	const {
		Placeholder,
		SelectControl
	} = components;
	const { __ } = i18n;

	registerBlockType( 'gutenpack/vr', {
		title: __( 'VR Image' ),
		icon: 'embed-photo',
		category: 'embed',
		supportHTML: false,
		attributes: {
			url: {
				type: 'string',
			},
			view: {
				type: 'string',
			}
		},

		edit: props => {
			const attributes = props.attributes;

			const onSetUrl = value => props.setAttributes( { url: value } );
			const onSetView = value => props.setAttributes( { view: value } );

			const renderEdit = () => {
				if ( attributes.url && attributes.view ) {
					return (
						<div className={ props.className }>
							<iframe
								title={ __( 'VR Image' ) }
								allowFullScreen="true"
								frameBorder="0"
								width="100%"
								height="300"
								src={ 'https://vr.me.sh/view/?view=' + encodeURIComponent( attributes.view ) + '&url=' + encodeURIComponent( attributes.url ) }
							/>
						</div>
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
							<SelectControl
								label={ __( 'View Type' ) }
								value={ attributes.view }
								onChange={ onSetView }
								options={ [
									{ label: __( '360' ), value: '360' },
									{ label: __( 'Cinema' ), value: 'cinema' },
								] }
							/>
						</Placeholder>
					</div>
				);
			};

			return renderEdit();
		},
		save: ( props ) => {
			return (
				<div className={ props.className }>
					<iframe
						title={ __( 'VR Image' ) }
						allowFullScreen="true"
						frameBorder="0"
						width="100%"
						height="300"
						src={ 'https://vr.me.sh/view/?view=' + encodeURIComponent( props.attributes.view ) + '&url=' + encodeURIComponent( props.attributes.url ) }
					/>
				</div>
			);
		}
	} );
} )( wp.blocks, wp.components, wp.i18n );
