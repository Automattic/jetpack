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
	if ( formattedPrompt.length < 10 ) {
		setErrorMessage(
			__(
				'Please write a little bit more. Jetpack AI needs at least 120 characters to make the gears spin.',
				'jetpack'
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

/**
 * Gather data available in Gutenberg and prepare the best prompt we can come up with.
 *
 * @param {Function} select - function returning Gutenberg data store.
 * @returns {string} - prompt ready to pipe to OpenAI.
 */
function preparePromptBasedOnEditorState( select ) {
	const prompt = formatEditorCanvasContentForCompletion( select( 'core/block-editor' ) );

	// If a user started typing something, we will just create a completion.
	if ( prompt.length > 0 ) {
		// We only take the last 240 chars into account, otherwise the prompt gets too long and because we have a 110 tokens limit, there is no place for response.
		return prompt.slice( -240 );
	}

	// Let's grab post data so that we can do something smart.
	const currentPost = select( 'core/editor' ).getCurrentPost();
	if ( ! currentPost ) {
		return '';
	}

	// If there is no title, there is not much we can do.
	if ( ! currentPost.title ) {
		return '';
	}

	// We are filtering out the default "Uncategorized"
	const categories = currentPost.categories.filter( catId => catId !== 1 );

	// User did not set any categories, we are going to base the suggestions off a title.
	if ( ! categories.length ) {
		/** translators: This will be a prompt to OpenAI to generate a post based on the post title */
		return sprintf( __( 'Write content of a post titled "%s"', 'jetpack' ), currentPost.title );
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

	return sprintf(
		/** translators: This will be a prompt to OpenAI to generate a post based on the comma-seperated category names and the post title */
		__( 'Write content of a post with categories "%1$s" titled "%2$s"', 'jetpack' ),
		categoryNames,
		currentPost.title
	);
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
	}, [ attributes, formattedPrompt, setAttributes ] );

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
