import './editor.scss';

import apiFetch from '@wordpress/api-fetch';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, Button, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useCallback, RawHTML, useEffect } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

const numberOfCharactersNeeded = 36;

export default function Edit( { attributes, setAttributes, clientId } ) {
	const [ loadingCompletion, setLoadingCompletion ] = useState( false );
	const [ loadingCategories, setLoadingCategories ] = useState( false );
	const [ needsMoreCharacters, setNeedsMoreCharacters ] = useState( false );
	const [ showRetry, setShowRetry ] = useState( false );
	const [ completionFinished, setCompletionFinished ] = useState( attributes.content );
	const [ errorMessage, setErrorMessage ] = useState( false );

	// Let's grab post data so that we can do something smart.
	const currentPostTitle = useSelect(
		select => select( 'core/editor' ).getEditedPostAttribute( 'title' ),
		[]
	);

	let loading = false;
	const categories = useSelect(
		select => select( 'core/editor' ).getEditedPostAttribute( 'categories' ),
		[]
	);

	const categoryObjects = useSelect( select => {
		return categories
			.map( categoryId => {
				const category = select( 'core' ).getEntityRecord( 'taxonomy', 'category', categoryId );

				if ( ! category ) {
					// Data is not yet loaded
					loading = true;
					return;
				}

				return category;
			} )
			.filter( Boolean ); // Remove undefined values
	} );

	const tags = useSelect( select => select( 'core/editor' ).getEditedPostAttribute( 'tags' ), [] );

	const tagObjects = useSelect( select => {
		return tags
			.map( tagId => {
				const tag = select( 'core' ).getEntityRecord( 'taxonomy', 'post_tag', tagId );

				if ( ! tag ) {
					// Data is not yet loaded
					loading = true;
					return;
				}

				return tag;
			} )
			.filter( Boolean ); // Remove undefined values
	} );

	if ( loadingCategories !== loading ) {
		setLoadingCategories( loading );
	}

	const createPrompt = ( title = '', content = '', categoryNames = '' ) => {
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
	};

	const containsAiUntriggeredParapgraph = _content =>
		_content.filter(
			block => block.name && block.name === 'jetpack/ai-paragraph' && ! block.attributes.content
		).length > 0;

	const taxonomies = categoryObjects.filter( cat => cat.id !== 1 ).concat( tagObjects );
	const categoryNames = taxonomies.map( ( { name } ) => name ).join( ', ' );
	const contentBefore = useSelect( select => {
		const editor = select( 'core/block-editor' );
		const index = editor.getBlockIndex( clientId );
		return editor.getBlocks().slice( 0, index ) ?? [];
	} );

	const content = contentBefore
		.filter( function ( block ) {
			return block && block.attributes && block.attributes.content;
		} )
		.map( function ( block ) {
			return block.attributes.content.replaceAll( '<br>', '\n' );
		} )
		.join( '\n' );
	const contentToUseForPrompt = createPrompt( currentPostTitle, content, categoryNames );

	const getSuggestionFromOpenAI = useCallback( () => {
		if ( completionFinished || loadingCompletion ) {
			return;
		}

		setShowRetry( false );
		setErrorMessage( false );
		setNeedsMoreCharacters( false );
		setLoadingCompletion( true );

		const data = { content: contentToUseForPrompt };
		apiFetch( {
			path: '/wpcom/v2/jetpack-ai/completions',
			method: 'POST',
			data: data,
		} )
			.then( res => {
				const result = res.prompts[ 0 ].text;
				// This is to animate text input. I think this will give an idea of a "better" AI.
				// At this point this is an established pattern.
				const tokens = result.split( ' ' );

				// We set it up so it doesn't start with nothing
				setLoadingCompletion( false );
				setCompletionFinished( true );

				for ( let i = 1; i < tokens.length; i++ ) {
					const output = tokens.slice( 0, i ).join( ' ' );
					setTimeout( () => setAttributes( { content: output } ), 50 * i );
				}
				setTimeout( () => setAttributes( { content: result } ), 50 * tokens.length );
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
	}, [ completionFinished, contentToUseForPrompt, setAttributes, loadingCompletion ] );

	useEffect( () => {
		if (
			! attributes.content &&
			( ! loadingCompletion || ! loadingCategories ) &&
			content.length < numberOfCharactersNeeded
		) {
			setErrorMessage(
				sprintf(
					/** translators: First placeholder is a number of more characters we need */
					__(
						'Please write a longer title or a few more words in the opening preceding the AI block. Our AI model needs %1$d more characters.',
						'jetpack'
					),
					numberOfCharactersNeeded - content.length
				)
			);
			setNeedsMoreCharacters( true );
		} else if ( needsMoreCharacters && content.length >= numberOfCharactersNeeded ) {
			setErrorMessage(
				/** translators: This is to retry to complete the text */
				__( 'Ready to retry', 'jetpack' )
			);
			setShowRetry( true );
			setNeedsMoreCharacters( false );
		}
	}, [
		attributes.content,
		loadingCompletion,
		loadingCategories,
		content.length,
		needsMoreCharacters,
	] );

	useEffect( () => {
		if ( ! completionFinished ) {
			if ( containsAiUntriggeredParapgraph( contentBefore ) ) {
				if ( ! errorMessage ) {
					setErrorMessage(
						/** translators: This will be an error message when multiple Open AI paragraph blocks are triggered on the same page. */
						__( 'Waiting for the previous AI paragraph block to finish', 'jetpack' )
					);
				}
			} else if (
				! loadingCompletion &&
				! loadingCategories &&
				! errorMessage &&
				! needsMoreCharacters
			) {
				getSuggestionFromOpenAI();
			}
		}
	}, [
		completionFinished,
		contentBefore,
		loadingCompletion,
		loadingCategories,
		errorMessage,
		needsMoreCharacters,
		getSuggestionFromOpenAI,
	] );

	return (
		<div { ...useBlockProps() }>
			{ ! loadingCompletion && ! loadingCategories && errorMessage && (
				<Placeholder label={ __( 'AI Paragraph', 'jetpack' ) } instructions={ errorMessage }>
					{ showRetry && (
						<Button variant="primary" onClick={ getSuggestionFromOpenAI }>
							{ __( 'Retry', 'jetpack' ) }
						</Button>
					) }
				</Placeholder>
			) }
			{ attributes.content && (
				<div>
					<div className="content">
						<RawHTML>{ attributes.content.trim().replaceAll( '\n', '<br/>' ) }</RawHTML>
					</div>
				</div>
			) }
			{ ! attributes.content && ( loadingCompletion || loadingCategories ) && (
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
