/* global wp, _, */
/* eslint react/react-in-jsx-scope: 0 */

/**
 * External dependencies
 */
import 'whatwg-fetch';
import isEmpty from 'lodash/isEmpty';
import forEach from 'lodash/forEach';

const { __ } = wp.i18n;
const {
	registerBlockType,
} = wp.blocks;
const {
	Placeholder,
	Button,
	Dashicon
} = wp.components;

registerBlockType( 'gutenpack/giphy', {
	title: __( 'Giphy' ),
	icon: 'format-video',
	category: 'layout',
	attributes: {
		hasRun: {
			type: 'bool',
			default: false
		},
		searchTerm: {
			type: 'string',
			default: ''
		},
		searchResults: {
			type: 'object',
			default: {}
		},
		chosenImage: {
			type: 'object',
			default: {}
		},
		resultGallery: {
			type: 'object',
			default: {}
		},
		className: {
			type: 'string',
			default: ''
		}
	},

	edit: props => {
		const attributes = props.attributes;

		const focusInputHandleEnter = () => {
			setTimeout( () => {
				const inputSearch = document.getElementById( 'giphy-input-search' );

				inputSearch.focus();
				inputSearch.addEventListener( 'keypress', ( e ) => {
					if ( e.keyCode === 13 ) {
						console.log('going to handle');
						handleSearch();

						return false;
					}
				} );
				props.setAttributes( { 'hasRun': true } );
			}, 400 );
		};

		if ( ! attributes.hasRun ) {
			focusInputHandleEnter();
		}

		const handleSearch = () => {
			const getParams = {
				api_key: 'OpUiweD5zr2xC7BhSIuqGFfCvnz5jzHj',
				q: attributes.searchTerm,
				limit: 50,
				offset: 0,
				rating: 'G'
			};

			const esc = encodeURIComponent;
			const query = Object.keys( getParams )
				.map( k => esc( k ) + '=' + esc( getParams[ k ] ) )
				.join( '&' );

			props.setAttributes( { className: 'giphy__oh-heck-yeah' } );

			fetch( 'https://api.giphy.com/v1/gifs/search?' + query,
				{
					method: 'GET',
					mode: 'cors',
					cache: 'default'
				} )
				.then( response => response.json() )
				.then( setGallery )
				.then(
					response => {
						props.setAttributes( { searchResults: response.data } );
					}
				);
		};

		const setGallery = ( response ) => {
			const numImages = response.data.length >= 9 ? 9 : response.data.length;

			if ( numImages > 0 ) {
				const gallery = {};
				let i;
				for ( i = 0; i < numImages; i++ ) {
					gallery[ i ] = response.data[ i ].images.preview_gif;
				}

				// Store the result gallery
				props.setAttributes( { resultGallery: gallery } );
			} else {
				// Store the result gallery
				props.setAttributes( { resultGallery: { noResults: true } } );
			}

			return response;
		};

		const setSearchTerm = event => {
			const value = event.target.value;

			// Clear the chosen image
			props.setAttributes( { chosenImage: {} } );

			// Set the value
			props.setAttributes( { searchTerm: value } );
		};

		const shuffleImages = () => {
			const imageStore = attributes.searchResults;

			// Generate random randomKeys
			const randomKeys = [];
			while ( randomKeys.length < 6 ) {
				const randomNumber = Math.ceil( Math.random() * imageStore.length - 1 );
				if ( randomKeys.indexOf( randomNumber ) > -1 ) {
					continue;
				}
				randomKeys[ randomKeys.length ] = randomNumber;
			}

			// Set the images based on randomKeys
			const newGalleryImages = {};
			let i = 0;
			forEach( randomKeys, ( k ) => {
				newGalleryImages[ i ] = imageStore[ k ].images.preview_gif;
				i++;
			} );

			props.setAttributes( { resultGallery: newGalleryImages } );
		};

		const chooseImage = key => {
			props.setAttributes( { chosenImage: attributes.resultGallery[ key ] } );
		};

		const resultGallery = () => {
			const images = attributes.resultGallery,
				chosenImage = attributes.chosenImage;
			const gallery = [];

			if ( 'undefined' !== images.noResults && images.noResults ) {
				return __( 'No results!' );
			}

			if ( isEmpty( images ) || ! isEmpty( chosenImage ) ) {
				return false;
			}

			forEach( images, ( imageData, key ) => {
				imageData.url &&
                    gallery.push(
                        <img
                            key={ key }
                            src={ imageData.url }
                            width={ imageData.width }
                            height={ imageData.height }
                            onClick={ () => chooseImage( key ) }
                            className="giphy__a-gif-has-no-name"
                        />
                    );
			} );

			return gallery;
		};

		const renderEdit = () => {
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
								className={ props.className }
							>
								<input
									id="giphy-input-search"
									type="search"
									value={ attributes.searchTerm || '' }
									onChange={ setSearchTerm }
								/>
								<Button onClick={ handleSearch } >
									<Dashicon icon="search"/>
								</Button>
								<Button onClick={ shuffleImages } >
									<Dashicon icon="randomize" />
								</Button>
							</Placeholder>
							<div className="giphy__gallery">
								{ resultGallery() }
							</div>
						</div>
					}
					{
						! isEmpty( chosenImage ) &&
						<img
							src={ chosenImage.url }
							width={ chosenImage.width }
							height={ chosenImage.height }
							className="giphy__chosen-one"
						/>
					}
				</div>
			);
		};

		return renderEdit();
	},
	save: ( props ) => {
		const { chosenImage } = props.attributes;

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
	}
} );
