import './editor.scss';

import apiFetch from '@wordpress/api-fetch';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, Button, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, RawHTML, useEffect } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

function formatEditorCanvasContentForCompletion( editor ) {
	const index = editor.getBlockInsertionPoint().index - 1;
	const allBlocksBefore = editor.getBlocks().slice( 0, index );
	if ( ! allBlocksBefore.length ) {
		return '';
	}
	return allBlocksBefore
		.filter( function ( block ) {
			return block && block.attributes && block.attributes.content;
		} )
		.map( function ( block ) {
			return block.attributes.content.replaceAll( '<br>', '\n\n' );
		} )
		.join( '\n\n' );
}

function getSuggestionFromOpenAI(
	setAttributes,
	formattedPrompt,
	setLoadingCompletion,
	setErrorMessage
) {
	const needsAtLeast = 36;
	if ( formattedPrompt.length < needsAtLeast ) {
		setErrorMessage(
			sprintf(
				/** translators: First placeholder is a number of more characters we need */
				__(
					'Please write a longer title or a few more words in the opening preceding the AI block. Our AI model needs %1$d more characters.',
					'jetpack'
				),
				needsAtLeast - formattedPrompt.length
			)
		);
		return;
	}
	setErrorMessage( '' );

	const data = { content: formattedPrompt };
	setLoadingCompletion( true );
	setAttributes( { requestedPrompt: true } ); // This will prevent double submitting.
	apiFetch( {
		path: '/wpcom/v2/jetpack-ai/completions',
		method: 'POST',
		data: data,
	} )
		.then( res => {
			setLoadingCompletion( false );
			const content = res.prompts[ 0 ].text;
			// This is to animate text input. I think this will give an idea of a "better" AI.
			// At this point this is an established pattern.
			const tokens = content.split( ' ' );
			for ( let i = 0; i < tokens.length; i++ ) {
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
}

function createPrompt( title = '', content = '', categoryNames = '' ) {
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

	/** translators: This will be a prompt to OpenAI to generate a post based on the post title */
	return sprintf( __( 'Write content of a post titled "%s"', 'jetpack' ), title );
}

/**
 * Gather data available in Gutenberg and prepare the best prompt we can come up with.
 *
 * @param {Function} select - function returning Gutenberg data store.
 * @returns {string} - prompt ready to pipe to OpenAI.
 */
function preparePromptBasedOnEditorState( select ) {
	const editorContent = formatEditorCanvasContentForCompletion(
		select( 'core/block-editor' )
	).slice( -240 );

	// Let's grab post data so that we can do something smart.
	const currentPost = select( 'core/editor' ).getCurrentPost();
	if ( ! currentPost ) {
		return createPrompt( '', editorContent, '' );
	}

	// If there is no title, there is not much we can do.
	if ( ! currentPost.title ) {
		return createPrompt( '', editorContent, '' );
	}

	// We are filtering out the default "Uncategorized"
	const categories = currentPost.categories.filter( catId => catId !== 1 );

	// User did not set any categories, we are going to base the suggestions off a title.
	if ( ! categories.length ) {
		return createPrompt( currentPost.title, editorContent, '' );
	}

	// We are grabbing more data from WP.
	const categoryObjects = categories.map( categoryId =>
		select( 'core' ).getEntityRecord( 'taxonomy', 'category', categoryId )
	);
	// We want to wait until all category names are loaded. This will return empty string (aka loading state) until all objects are truthy.
	if ( categoryObjects.filter( obj => ! obj || ! obj.name ).length ) {
		return '';
	}

	const categoryNames = categoryObjects.map( ( { name } ) => name ).join( ', ' );

	return createPrompt( currentPost.title, editorContent, categoryNames );
}

export default function Edit( { attributes, setAttributes } ) {
	const [ loadingCompletion, setLoadingCompletion ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( '' );

	// Here is where we craft the prompt.
	const formattedPrompt = useSelect( preparePromptBasedOnEditorState, [] );

	//useEffect hook is called only once when block is first rendered.
	useEffect( () => {
		//Theoretically useEffect would ensure we only fire this once, but I don't want to fire it when we get data to edit either.
		if ( ! attributes.content && ! attributes.requestedPrompt ) {
			getSuggestionFromOpenAI(
				setAttributes,
				formattedPrompt,
				setLoadingCompletion,
				setErrorMessage
			);
		}
	}, [ setAttributes, attributes ] ); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div { ...useBlockProps() }>
			{ errorMessage && (
				<Placeholder label={ __( 'AI Paragraph', 'jetpack' ) } instructions={ errorMessage }>
					<Button
						variant="primary"
						onClick={ () => {
							getSuggestionFromOpenAI(
								setAttributes,
								formattedPrompt,
								setLoadingCompletion,
								setErrorMessage
							);
						} }
					>
						{ __( 'Retry', 'jetpack' ) }
					</Button>
				</Placeholder>
			) }
			{ attributes.content && ! loadingCompletion && (
				<div>
					<div className="content">
						<RawHTML>{ attributes.content.trim().replaceAll( '\n', '<br/>' ) }</RawHTML>
					</div>
				</div>
			) }
			{ loadingCompletion && (
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
