import './editor.scss';

import apiFetch from '@wordpress/api-fetch';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, Button, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, RawHTML, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

function formatPromptToOpenAI( editor ) {
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
	if ( formattedPrompt.length < 120 ) {
		setErrorMessage(
			__(
				'Please write a little bit more. Jetpack AI needs at least 120 characters to make the gears spin.',
				'jetpack'
			)
		);
		return;
	}
	setErrorMessage( '' );
	// We only take the last 240 chars into account, otherwise the prompt gets too long and because we have a 110 tokens limit, there is no place for response.
	formattedPrompt = formattedPrompt.slice( -240 );
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

export default function Edit( { attributes, setAttributes } ) {
	const [ loadingCompletion, setLoadingCompletion ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( '' );

	const formattedPrompt = useSelect( select => {
		return formatPromptToOpenAI( select( 'core/block-editor' ) );
	}, [] );

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
				<Placeholder
					label={ __( 'Jetpack AI Paragraph', 'jetpack' ) }
					instructions={ errorMessage }
				>
					<Button
						isPrimary
						onClick={ () => {
							getSuggestionFromOpenAI(
								setAttributes,
								formattedPrompt,
								setLoadingCompletion,
								setErrorMessage
							);
						} }
					>
						{ 'Retry' }
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
