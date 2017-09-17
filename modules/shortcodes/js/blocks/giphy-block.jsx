/** @format */
/* global wp, _, */
/* eslint react/react-in-jsx-scope: 0 */

/**
 * External dependencies
 */
import 'whatwg-fetch';
import isEmpty from 'lodash/isEmpty';
import forEach from 'lodash/forEach';

const { __ } = wp.i18n;
const { registerBlockType } = wp.blocks;
const { Placeholder, Button, Dashicon } = wp.components;

registerBlockType( 'gutenpack/giphy', {
	title: __( 'Giphy' ),
	icon: 'format-video',
	category: 'layout',
	attributes: {
		searchTerm: {
			type: 'string',
			default: '',
		},
		lastSearchTerm: {
			type: 'string',
			default: '',
		},
		searchResults: {
			type: 'object',
			default: {},
		},
		chosenImage: {
			type: 'object',
			default: {},
		},
		resultGallery: {
			type: 'object',
			default: {},
		},
		className: {
			type: 'string',
			default: '',
		},
	},

	edit: ( { attributes, setAttributes } ) => {
		const handleKeyDown = e => {
			if ( e.key === 'Enter' ) {
				if ( attributes.searchTerm === attributes.lastSearchTerm ) {
					shuffleImages();

					return;
				}

				handleSearch();
			}
		};

		const handleInputRef = input => input && input.focus();

		const handleSearch = () => {
			setAttributes( { lastSearchTerm: attributes.searchTerm } );

			const getParams = {
				api_key: 'OpUiweD5zr2xC7BhSIuqGFfCvnz5jzHj',
				q: attributes.searchTerm,
				limit: 50,
				offset: 0,
				rating: 'G',
			};

			const esc = encodeURIComponent;
			const query = Object.keys( getParams )
				.map( k => esc( k ) + '=' + esc( getParams[ k ] ) )
				.join( '&' );

			setAttributes( { className: 'giphy__oh-heck-yeah' } );

			fetch( 'https://api.giphy.com/v1/gifs/search?' + query, {
				method: 'GET',
				mode: 'cors',
				cache: 'default',
			} )
				.then( response => response.json() )
				.then( setGallery )
				.then( response => {
					setAttributes( { searchResults: response.data } );
				} );
		};

		const setGallery = response => {
			const numImages = response.data.length >= 9 ? 9 : response.data.length;

			if ( numImages > 0 ) {
				const gallery = {};
				let i;
				for ( i = 0; i < numImages; i++ ) {
					gallery[ i ] = response.data[ i ].images.preview_gif;
				}

				// Store the result gallery
				setAttributes( { resultGallery: gallery } );
			} else {
				// Store the result gallery
				setAttributes( { resultGallery: { noResults: true } } );
			}

			return response;
		};

		const setSearchTerm = event => {
			const value = event.target.value;

			// Clear the chosen image
			setAttributes( { chosenImage: {} } );

			// Set the value
			setAttributes( { searchTerm: value } );
		};

		const shuffleImages = () => {
			const shuffledData = _.shuffle( attributes.searchResults ).slice( 0, 9 );

			const newGalleryImages = shuffledData.map( data => {
				return data.images.preview_gif;
			} );

			setAttributes( { resultGallery: newGalleryImages } );
		};

		const chooseImage = key => {
			setAttributes( {
				chosenImage: attributes.resultGallery[ key ],
				searchTerm: '',
				searchResults: {},
				resultGallery: {},
			} );
		};

		const resultGallery = () => {
			const images = attributes.resultGallery,
				chosenImage = attributes.chosenImage,
				gallery = [];

			if ( 'undefined' !== images.noResults && images.noResults ) {
				return __( 'No results!' );
			}

			if ( isEmpty( images ) || ! isEmpty( chosenImage ) ) {
				return false;
			}

			Object.keys( images ).map( key => {
				gallery.push(
					<img
						key={ images[ key ].url }
						src={ images[ key ].url }
						width={ images[ key ].width }
						height={ images[ key ].height }
						onClick={ () => chooseImage( key ) }
						className="giphy__a-gif-has-no-name"
					/>
				);
			} );

			return gallery;
		};

		const chosenImage = attributes.chosenImage;

		return (
			<div>
				{ isEmpty( chosenImage ) &&
					<div>
						<Placeholder
							key="giphy/placeholder"
							instructions={ __( 'The peak of human expression at your fingertips!' ) }
							icon="schedule"
							label={ __( 'Search gifs' ) }
							className={ attributes.className }
						>
							<input
								id="giphy-input-search"
								type="search"
								value={ attributes.searchTerm || '' }
								onChange={ setSearchTerm }
								onKeyDown={ handleKeyDown }
								ref={ handleInputRef }
							/>
							<Button onClick={ handleSearch }>
								<Dashicon icon="search" />
							</Button>
							<Button onClick={ shuffleImages }>
								<Dashicon icon="randomize" />
							</Button>
						</Placeholder>
						<div className="giphy__gallery">
							{ resultGallery() }
						</div>
					</div> }
				{ ! isEmpty( chosenImage ) &&
					<img
						src={ chosenImage.url }
						width={ chosenImage.width }
						height={ chosenImage.height }
						className="giphy__chosen-one"
					/> }
			</div>
		);
	},
	save: ( { attributes } ) => {
		const { chosenImage } = attributes;

		return (
			! isEmpty( chosenImage ) &&
			<div className="jetpack-blocks-giphy">
				<img
					src={ chosenImage.url }
					width={ chosenImage.width }
					height={ chosenImage.height }
					className="giphy__chosen-one"
				/>
			</div>
		);
	},
} );
