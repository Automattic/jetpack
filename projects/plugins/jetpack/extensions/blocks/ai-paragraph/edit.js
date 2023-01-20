import './editor.scss';

import apiFetch from '@wordpress/api-fetch';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, Button, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, RawHTML, useEffect } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

const numberOfCharactersNeeded = 36;

export default function Edit( { attributes, setAttributes, clientId } ) {
	const [ loadingCompletion, setLoadingCompletion ] = useState( false );
	const [ loadingCategories, setLoadingCategories ] = useState( false );

	const [ errorMessage, setErrorMessage ] = useState( false );

	// Let's grab post data so that we can do something smart.
	const currentPostTitle = useSelect(
		select => select( 'core/editor' ).getEditedPostAttribute( 'title' ),
		[]
	);

	// We are grabbing more data from WP.
	let categoryObjects = useSelect( select => {
		const _catObjects = [];
		const _cats = select( 'core/editor' )
			.getEditedPostAttribute( 'categories' )
			.filter( categoryId => categoryId !== 1 )
		for( const categoryId in _cats ) {
			const cat = select( 'core' ).getEntityRecord( 'taxonomy', 'category', categoryId );
			if ( ! cat ) {
				continue;
			}
			_catObjects.push( cat );
		}
		return _catObjects;
	}, [] );

	const tagObjects = useSelect( select => {
		const _tagObjects = [];
		const _tags = select( 'core/editor' )
			.getEditedPostAttribute( 'tags' )
		for( const tagId in _tags) {
			const tag = select( 'core' ).getEntityRecord( 'taxonomy', 'post_tag', tagId );
			if ( ! tag ) {
				continue;
			}
			_tagObjects.push( tag );
		}
		return _tagObjects;
	}, [] );

	const getSuggestionFromOpenAI = formattedPrompt => {
		const data = { content: formattedPrompt };
		apiFetch( {
			path: '/wpcom/v2/jetpack-ai/completions',
			method: 'POST',
			data: data,
		} )
			.then( res => {
				const content = res.prompts[ 0 ].text;
				// This is to animate text input. I think this will give an idea of a "better" AI.
				// At this point this is an established pattern.
				const tokens = content.split( ' ' );

				// We set it up so it doesn't start with nothing
				setAttributes( { content: tokens[ 0 ] } );
				setLoadingCompletion( false );

				for ( let i = 1; i < tokens.length; i++ ) {
					const output = tokens.slice( 0, i ).join( ' ' );
					setTimeout( () => setAttributes( { content: output } ), 50 * i );
				}
				setTimeout( () => setAttributes( { content: content } ), 50 * tokens.length );
			} )
			.catch( () => {
				setErrorMessage(
					__(
						'Whoops, we have encountered an error. AI is like really, really hard and this is an experimental feature. Please try again later.',
						'jetpack'
					)
				);
				setLoadingCompletion( false );
			} );
	};

	function allBlocksBefore( select, clientId ) {
		const editor = select( 'core/block-editor' );
		const index = editor.getBlockIndex( clientId );
		const allBlocksBefore = editor.getBlocks().slice( 0, index );
		if ( ! allBlocksBefore.length ) {
			return [];
		}
		return allBlocksBefore;
	}

	function createPrompt( title = '', content = '', categoryNames = [] ) {
		content = content.slice( -240 );

		// If title is not added, we will only complete.
		if ( ! title ) {
			return content;
		}

		// Title, content and categories
		if ( content && categoryNames.length ) {
			return sprintf(
				/** translators: This will be a prompt to OpenAI to generate a post based on the post title, comma-seperated category names and the last 240 characters of content. */
				__( "This is a post titled '%1$s', published in categories '%2$s':\n\n … %3$s", 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
				title,
				categoryNames,
				content
			);
		}

		// No content, only title and categories
		if ( categoryNames.length ) {
			return sprintf(
				/** translators: This will be a prompt to OpenAI to generate a post based on the post title, and comma-seperated category names. */
				__( "This is a post titled '%1$s', published in categories '%2$s':\n", 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
				title,
				categoryNames
			);
		}

		// Title and content
		if ( content ) {
			return sprintf(
				/** translators: This will be a prompt to OpenAI to generate a post based on the post title, and the last 240 characters of content. */
				__( "This is a post titled '%1$s':\n\n…%2$s", 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
				title,
				content
			);
		}

		return sprintf(
			/** translators: This will be a prompt to OpenAI to generate a post based on the post title */
			__( 'Write content of a post titled "%s"', 'jetpack' ),
			title
		);
	}

	/**
	 * Gather data available in Gutenberg and prepare the best prompt we can come up with.
	 *
	 * @param {Function} select - function returning Gutenberg data store.
	 * @param allBlocksBefore
	 * @param previousContent
	 * @returns {string} - prompt ready to pipe to OpenAI.
	 */
	function getPromptBasedOnContent( previousContent ) {
		// For now categories are combined with tags into the same object. I am not sure they should
		const taxonomies = categoryObjects.concat( tagObjects );
		const categoryNames = taxonomies.map( ( { name } ) => name ).join( ', ' );
		return createPrompt( currentPostTitle, previousContent, categoryNames );
	}

	const containsAiUntriggeredParapgraph = content => content.filter(
			block => {
				console.info(block);
				return block.name && block.name === 'jetpack/ai-paragraph' && ! block.attributes.content
			}
		).length > 0;

	const contentBefore = useSelect( select => allBlocksBefore( select, clientId ) );

	const content = contentBefore
		.filter( function ( block ) {
			return block && block.attributes && block.attributes.content;
		} )
		.map( function ( block ) {
			return block.attributes.content.replaceAll( '<br>', '\n' );
		} )
		.join( '\n' );
	const contentToUseForPrompt = getPromptBasedOnContent( content );

	if ( ! attributes.content ) {

		useEffect(()=>{
			setLoadingCategories( categoryObjects.length === 0 )
		}, [categoryObjects.length]);

		if ( containsAiUntriggeredParapgraph( contentBefore ) ) {
			if ( ! errorMessage ) {
				setErrorMessage(
					sprintf(
						/** translators: This will be an error message when multiple Open AI paragraph blocks are triggered on the same page. */
						__( 'Waiting for the previous AI paragraph block to finish', 'jetpack' )
					)
				);
			}
		} else if ( ! loadingCompletion || ! loadingCategories ) {
			if ( contentToUseForPrompt === false || contentToUseForPrompt === '' ) {
				setLoadingCategories( true );
			} else if ( content.length < numberOfCharactersNeeded ) {
				useEffect( () => {
					setErrorMessage(
						sprintf(
							/** translators: First placeholder is a number of more characters we need */
							__(
								'Please write a longer title or a few more words in the opening preceding the AI block. Our AI model needs %1$d more characters.',
								'jetpack'
							),
							numberOfCharactersNeeded - contentToUseForPrompt.length
						)
					);
				}, [ contentToUseForPrompt ] );
			} else if ( ! loadingCompletion ) {
				setErrorMessage( '' );
				setLoadingCompletion( true );
				getSuggestionFromOpenAI( contentToUseForPrompt );
			}
		}
	}

	return (
		<div { ...useBlockProps() }>
			{ ! loadingCompletion && ! loadingCategories && errorMessage && (
				<Placeholder label={ __( 'AI Paragraph', 'jetpack' ) } instructions={ errorMessage }>
					{ false && (
						<Button
							variant="primary"
							onClick={ () => {
								getSuggestionFromOpenAI(
									setAttributes,
									contentToUseForPrompt,
									setLoadingCompletion,
									setErrorMessage
								);
							} }
						>
							{ __( 'Retry', 'jetpack' ) }
						</Button>
					) }
				</Placeholder>
			) }
			{ ! loadingCompletion && ! loadingCategories && attributes.content && (
				<div>
					<div className="content">
						<RawHTML>{ attributes.content.trim().replaceAll( '\n', '<br/>' ) }</RawHTML>
					</div>
				</div>
			) }
			{ ( loadingCompletion || loadingCategories ) && (
				<div style={ { padding: '10px', textAlign: 'center' } }>
					<Spinner
						style={ {
							height: 'calc(4px * 20)',
							width: 'calc(4px * 20)',
						} }
					/>
				</div>
			) }
		</div>
	);
}
