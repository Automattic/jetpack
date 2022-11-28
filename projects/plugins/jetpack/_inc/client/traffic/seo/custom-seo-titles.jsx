import { sprintf, __ } from '@wordpress/i18n';
import Button from 'components/button';
import { FormLabel } from 'components/forms';
import TextInput from 'components/text-input';
import React, { useState, useCallback } from 'react';

// For context on the seo-tools module's custom SEO title formats, refer to:
// projects/plugins/jetpack/modules/seo-tools/jetpack-seo-titles.php
export const customSeoTitleFormats = {
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
		archive_title: __( 'Archive Title', 'jetpack' ),
	},
	tokensAvailablePerPageType: {
		front_page: [ 'site_name', 'tagline' ],
		posts: [ 'site_name', 'tagline', 'post_title' ],
		pages: [ 'site_name', 'tagline', 'page_title' ],
		groups: [ 'site_name', 'tagline', 'group_title' ],
		archives: [ 'site_name', 'tagline', 'date', 'archive_title' ],
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
		/(\[(?:site_name|tagline|post_title|page_title|group_title|date|archive_title)\])/
	);

	return inputArray
		.filter( value => {
			if ( value ) {
				return value;
			}
		} )
		.map( value => {
			let matchedToken = null;
			Object.keys( customSeoTitleFormats.insertableTokens ).map( token => {
				if ( value === `[${ token }]` ) {
					matchedToken = token;
				}
			} );

			if (
				matchedToken &&
				customSeoTitleFormats.tokensAvailablePerPageType[ pageType ].includes( matchedToken )
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

const getCustomSeoTitleInputPreview = ( pageType, value, siteData ) => {
	customSeoTitleFormats.tokensAvailablePerPageType[ pageType.name ].forEach( token => {
		switch ( token ) {
			case 'site_name':
				value = value.replace( /\[site_name\]/g, siteData.title );
				break;
			case 'tagline':
				value = value.replace( /\[tagline\]/g, siteData.tagline );
				break;
			case 'post_title':
				value = value.replace( /\[post_title\]/g, __( 'Example Title', 'jetpack' ) );
				break;
			case 'page_title':
				value = value.replace( /\[page_title\]/g, __( 'Example Title', 'jetpack' ) );
				break;
			case 'group_title':
				value = value.replace( /\[group_title\]/g, __( 'Tag', 'jetpack' ) );
				break;
			case 'date':
			case 'archive_title':
				value = value.replace(
					/\[archive_title\]|\[date\]/g,
					__( 'Example Archive Title/Date', 'jetpack' )
				);
				break;
			default:
				break;
		}
	} );

	return sprintf(
		/* translators: %s is the preview text for a custom SEO input */
		__( 'Preview: %s', 'jetpack' ),
		value
	);
};

const SEOTokenButton = ( {
	pageType,
	customSeoTitleInputRef,
	handleCustomSeoTitleInput,
	token,
} ) => {
	const handleTokenButtonClick = useCallback( () => {
		const inputRef = customSeoTitleInputRef.current;
		inputRef.focus();

		const textToInsert = `[${ token }]`;
		const cursorPos = inputRef.refs.textField.selectionStart;
		const strBeforeCursor = inputRef.props.value.substring( 0, cursorPos );
		const strAfterCursor = inputRef.props.value.substring( cursorPos, inputRef.props.value.length );
		const newString = strBeforeCursor + textToInsert + strAfterCursor;

		handleCustomSeoTitleInput( pageType, newString );
	}, [ pageType, customSeoTitleInputRef, handleCustomSeoTitleInput, token ] );

	return (
		<Button
			className="jp-seo-custom-titles-input-button"
			compact
			onClick={ handleTokenButtonClick }
		>
			{ customSeoTitleFormats.insertableTokens[ token ] }
		</Button>
	);
};

const SEOTokenButtonList = ( pageType, customSeoTitleInputRef, handleCustomSeoTitleInput ) => {
	return customSeoTitleFormats.tokensAvailablePerPageType[ pageType.name ].map( token => {
		if ( 'archives' === pageType.name && 'date' === token ) {
			// [date] is tokenized, but we no longer show the button to insert a [date].
			// [archive_title] is a more generic option that supports non date-based archives.
			return null;
		}

		return (
			<SEOTokenButton
				pageType={ pageType }
				customSeoTitleInputRef={ customSeoTitleInputRef }
				handleCustomSeoTitleInput={ handleCustomSeoTitleInput }
				token={ token }
				key={ token }
			/>
		);
	} );
};

const CustomSeoTitleInput = ( {
	pageType,
	customSeoTitleInputRef,
	handleCustomSeoTitleInput,
	value,
	siteData,
} ) => {
	return (
		<div className={ `jp-seo-custom-titles-input-container-${ pageType.name }` }>
			<div className={ `jp-seo-custom-titles-input-controls` }>
				<FormLabel
					className={ `jp-seo-custom-titles-input-label` }
					htmlFor={ `jp-seo-custom-titles-input-${ pageType.name }` }
				>
					<span className="jp-form-label">{ pageType.label }</span>
				</FormLabel>
				<div>
					{ SEOTokenButtonList( pageType, customSeoTitleInputRef, handleCustomSeoTitleInput ) }
				</div>
			</div>
			<TextInput
				id={ `jp-seo-custom-titles-input-${ pageType.name }` }
				className="jp-seo-custom-titles-input"
				value={ value }
				onChange={ useCallback(
					event => handleCustomSeoTitleInput( pageType, event.target.value ),
					[ handleCustomSeoTitleInput, pageType ]
				) }
				ref={ customSeoTitleInputRef }
			/>
			<div className={ 'jp-seo-custom-titles-input-preview' }>
				{ getCustomSeoTitleInputPreview( pageType, value, siteData ) }
			</div>
		</div>
	);
};

/**
 * Renders the `advanced_seo_title_formats` inputs.
 *
 * @param {object} props - Parent props.
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

	const customSeoTitlesAsStrings = customSeoTitleFormats.pageTypes.reduce( ( acc, pageType ) => {
		acc[ pageType.name ] = tokenizedArrayToString( props.customSeoTitles[ pageType.name ] );
		return acc;
	}, {} );

	const updateCustomSeoTitleInputState = props.updateCustomSeoTitleInputState;
	const handleCustomSeoTitleInput = useCallback(
		( updatedPageType, updatedValue ) => {
			customSeoTitlesAsStrings[ updatedPageType.name ] = updatedValue;

			const customSeoTitlesAsTokenizedArrays = Object.keys( customSeoTitlesAsStrings ).reduce(
				( acc, pageType ) => {
					acc[ pageType ] = stringToTokenizedArray(
						customSeoTitlesAsStrings[ pageType ],
						pageType
					);
					return acc;
				},
				{}
			);

			updateCustomSeoTitleInputState( customSeoTitlesAsTokenizedArrays );
		},
		[ customSeoTitlesAsStrings, updateCustomSeoTitleInputState ]
	);

	return (
		<div className="jp-seo-custom-titles">
			{ customSeoTitleFormats.pageTypes.map( pageType => {
				return (
					<CustomSeoTitleInput
						pageType={ pageType }
						value={ customSeoTitlesAsStrings[ pageType.name ] }
						handleCustomSeoTitleInput={ handleCustomSeoTitleInput }
						customSeoTitleInputRef={ customSeoTitleInputRefs[ pageType.name ] }
						siteData={ props.siteData }
						key={ pageType.name }
					/>
				);
			} ) }
		</div>
	);
};

export default CustomSeoTitles;
