/* global wp, _, */
/* eslint react/react-in-jsx-scope: 0 */

/**
 * External dependencies
 */
import 'whatwg-fetch';

const { __ } = wp.i18n;
const {
	registerBlockType,
	source: {
		children
	}
} = wp.blocks;
const {
	Placeholder
} = wp.components;

registerBlockType( 'gutenpack/giphy', {
	title: __( 'Giphy' ),
	icon: 'sort',
	category: 'layout',
	attributes: {
		s: children( 's' )
	},

	edit: props => {
		const attributes = props.attributes,
			searchResults = '';

		const getParams = {
			api_key: 'c7daeb0f028c4bc294f04131e6f2d777',
			q: 'jetpack',
			limit: 25,
			offset: 0,
			rating: 'G'
		};

		// eslint-disable-next-line
		// console.log( attributes );

		const handleSearch = ( value ) => fetch( 'https://api.giphy.com/v1/gifs/search?api_key=c7daeb0f028c4bc294f04131e6f2d777&q=jetpack&limit=1&offset=0&rating=G&lang=en',
			{
				method: 'GET',
				mode: 'cors'
			} )
			.then(
				// eslint-disable-next-line
				// console.log( value )
			)
			.then( props.setAttributes( { s: value } ) );

		const renderEdit = () => {
			// eslint-disable-next-line
			console.log( attributes.s );
			return (
				<div>
					<Placeholder
						key="giphy/placeholder"
						instructions={ __( 'Search for something!' ) }
						icon="format-image"
						label={ __( 'Search for GIF' ) }
						className={ props.className }
					>
						<input
							type="search"
							value={ attributes.s }
							onChange={ handleSearch }
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
