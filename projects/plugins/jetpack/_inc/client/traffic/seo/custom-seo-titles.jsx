/**
 * External dependencies
 */
import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TextInput from 'components/text-input';
import { FormLabel } from 'components/forms';
import Button from 'components/button';

// For context on the seo-tools module's custom SEO title formats, refer to:
// projects/plugins/jetpack/modules/seo-tools/jetpack-seo-titles.php
export const customSeoTitles = {
	pageTypes: [
		{ name: 'front_page', label: __( 'Front Page', 'jetpack' ) },
		{ name: 'posts', label: __( 'Posts', 'jetpack' ) },
		{ name: 'pages', label: __( 'Pages', 'jetpack' ) },
		{ name: 'groups', label: __( 'Tags', 'jetpack' ) },
		{ name: 'archives', label: __( 'Archives', 'jetpack' ) },
	],
	insertableTokens: {
		site_name: __( 'Site Title', 'jetpack' ),
		tagline: __( 'Tagline', 'jetpack' ),
		post_title: __( 'Post Title', 'jetpack' ),
		page_title: __( 'Page Title', 'jetpack' ),
		group_title: __( 'Tag or Category Name', 'jetpack' ),
		date: __( 'Date', 'jetpack' ),
	},
	tokensAvailablePerPageType: {
		front_page: [ 'site_name', 'tagline' ],
		posts: [ 'site_name', 'tagline', 'post_title' ],
		pages: [ 'site_name', 'tagline', 'page_title' ],
		groups: [ 'site_name', 'tagline', 'group_title' ],
		archives: [ 'site_name', 'tagline', 'date' ],
	},
};

/**
 * Converts an input value to an array of token/string objects,
 * for storage into the `advanced_seo_title_formats` option.
 *
 * @param {string} inputValue - The value of an input for one of the custom SEO title inputs/pageTypes.
 * @param {string} pageType - Type of page the title is being customized for (e.g front_page, archives)
 * @returns {Array} An array of token/string objects and their values.
 */
export const stringToTokenizedArray = ( inputValue, pageType ) => {
	const inputArray = inputValue.split(
		/(\[(?:site_name|tagline|post_title|page_title|group_title|date)\])/
	);

	return inputArray
		.filter( value => {
			if ( value ) {
				return value;
			}
		} )
		.map( value => {
			let matchedToken = null;
			Object.keys( customSeoTitles.insertableTokens ).map( token => {
				if ( value === `[${ token }]` ) {
					matchedToken = token;
				}
			} );

			if (
				matchedToken &&
				customSeoTitles.tokensAvailablePerPageType[ pageType ].includes( matchedToken )
			) {
				return {
					type: 'token',
					value: matchedToken,
				};
			}

			return {
				type: 'string',
				value,
			};
		} );
};

/**
 * Converts an array of token/string objects into a single string.
 * Objects with type of 'token' have their values enclosed by '[]'
 *
 * @param {Array} arr - An array of token/string objects and their values.
 * @returns {string} A concatenated string of values from the token/string objects supplied.
 */
export const tokenizedArrayToString = arr => {
	if ( Array.isArray( arr ) ) {
		return arr.reduce( ( acc, obj ) => {
			return acc + ( obj.type === 'token' ? `[${ obj.value }]` : obj.value );
		}, '' );
	}

	return '';
};

const handleTokenButtonClick = (
	customSeoTitleInputRef,
	pageType,
	token,
	handleCustomSeoTitleInput
) => {
	const inputRef = customSeoTitleInputRef.current;
	inputRef.focus();

	const textToInsert = `[${ token }]`;
	const cursorPos = inputRef.refs.textField.selectionStart;
	const strBeforeCursor = inputRef.props.value.substring( 0, cursorPos );
	const strAfterCursor = inputRef.props.value.substring( cursorPos, inputRef.props.value.length );
	const newString = strBeforeCursor + textToInsert + strAfterCursor;

	handleCustomSeoTitleInput( pageType, newString );
};

const getTokenButtonsForCustomSeoTitleInput = (
	pageType,
	customSeoTitleInputRef,
	handleCustomSeoTitleInput
) => {
	return customSeoTitles.tokensAvailablePerPageType[ pageType.name ].map( token => {
		return (
			<Button
				className="jp-seo-custom-titles-input-button"
				compact
				onClick={ () =>
					handleTokenButtonClick(
						customSeoTitleInputRef,
						pageType,
						token,
						handleCustomSeoTitleInput
					)
				}
			>
				{ customSeoTitles.insertableTokens[ token ] }
			</Button>
		);
	} );
};

const CustomSeoTitleInput = props => {
	return (
		<div
			className={ `jp-seo-custom-titles-input-container-${ props.pageType.name }` }
			key={ props.pageType.name }
		>
			<div className={ `jp-seo-custom-titles-input-controls` }>
				<FormLabel
					className={ `jp-seo-custom-titles-input-label` }
					htmlFor={ `jp-seo-custom-titles-input-${ props.pageType.name }` }
				>
					<span className="jp-form-label">{ props.pageType.label }</span>
				</FormLabel>
				<div>
					{ getTokenButtonsForCustomSeoTitleInput(
						props.pageType,
						props.customSeoTitleInputRef,
						props.handleCustomSeoTitleInput
					) }
				</div>
			</div>
			<TextInput
				id={ `jp-seo-custom-titles-input-${ props.pageType.name }` }
				className="jp-seo-custom-titles-input"
				value={ props.value }
				onChange={ e => props.handleCustomSeoTitleInput( props.pageType, e.target.value ) }
				ref={ props.customSeoTitleInputRef }
			/>
			<span style={ { 'margin-bottom': '1rem', display: 'block' } }>Preview: (todo)</span>
		</div>
	);
};

/**
 * Renders the `advanced_seo_title_formats` inputs.
 *
 * @param {object} props - Parent props.
 *
 * @returns {object} React component.
 */
const CustomSeoTitles = props => {
	const [ customSeoTitleInputRefs ] = useState( {
		front_page: React.createRef(),
		posts: React.createRef(),
		pages: React.createRef(),
		groups: React.createRef(),
		archives: React.createRef(),
	} );

	const customSeoTitlesAsStrings = customSeoTitles.pageTypes.reduce( ( acc, pageType ) => {
		acc[ pageType.name ] = tokenizedArrayToString( props.customSeoTitles[ pageType.name ] );
		return acc;
	}, {} );

	const handleCustomSeoTitleInput = ( updatedPageType, updatedValue ) => {
		customSeoTitlesAsStrings[ updatedPageType.name ] = updatedValue;

		const customSeoTitlesAsTokenizedArrays = Object.keys( customSeoTitlesAsStrings ).reduce(
			( acc, pageType ) => {
				acc[ pageType ] = stringToTokenizedArray( customSeoTitlesAsStrings[ pageType ], pageType );
				return acc;
			},
			{}
		);

		props.handleCustomSeoTitleInput( customSeoTitlesAsTokenizedArrays );
	};

	return (
		<div className="jp-seo-custom-titles">
			{ customSeoTitles.pageTypes.map( pageType => {
				return (
					<CustomSeoTitleInput
						pageType={ pageType }
						value={ customSeoTitlesAsStrings[ pageType.name ] }
						handleCustomSeoTitleInput={ handleCustomSeoTitleInput }
						customSeoTitleInputRef={ customSeoTitleInputRefs[ pageType.name ] }
					/>
				);
			} ) }
		</div>
	);
};

export default CustomSeoTitles;
