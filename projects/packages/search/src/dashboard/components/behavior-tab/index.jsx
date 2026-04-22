import apiFetch from '@wordpress/api-fetch';
import { Button, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';

const REST_BASE = '/wp/v2/jetpack-search-behavior';

/**
 * Behavior tab component for configuring AI Answers behavior instructions.
 *
 * @return {import('react').ReactElement} BehaviorTab component.
 */
export default function BehaviorTab() {
	const [ content, setContent ] = useState( '' );
	const [ postId, setPostId ] = useState( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ saved, setSaved ] = useState( false );

	useEffect( () => {
		apiFetch( { path: REST_BASE + '?per_page=1&status=any' } )
			.then( posts => {
				if ( posts.length > 0 ) {
					setPostId( posts[ 0 ].id );
					setContent( posts[ 0 ].content?.raw ?? '' );
				}
			} )
			.catch( err => setError( err.message ) )
			.finally( () => setIsLoading( false ) );
	}, [] );

	const save = () => {
		setIsSaving( true );
		setSaved( false );
		const path = postId ? `${ REST_BASE }/${ postId }` : REST_BASE;
		apiFetch( {
			path,
			method: 'POST',
			data: { content, status: 'publish', title: 'Search Behavior' },
		} )
			.then( post => {
				setPostId( post.id );
				setSaved( true );
			} )
			.catch( err => setError( err.message ) )
			.finally( () => setIsSaving( false ) );
	};

	if ( isLoading ) {
		return <p>{ __( 'Loading…', 'jetpack-search-pkg' ) }</p>;
	}

	return (
		<div className="jp-search-behavior-tab">
			<p className="jp-search-behavior-tab__description">
				{ __(
					'Describe how the AI should respond to visitor questions. List the topics your site covers so the AI can classify queries.',
					'jetpack-search-pkg'
				) }
			</p>
			<p className="jp-search-behavior-tab__example">
				<em>
					{ __(
						'Example: "Focus on product-related questions. Topics: Shipping, Returns, Account Access, Billing."',
						'jetpack-search-pkg'
					) }
				</em>
			</p>
			{ error && <p className="jp-search-behavior-tab__error">{ error }</p> }
			<TextareaControl
				label={ __( 'Behavior instructions', 'jetpack-search-pkg' ) }
				value={ content }
				onChange={ setContent }
				rows={ 10 }
				disabled={ isSaving }
			/>
			<Button variant="primary" onClick={ save } isBusy={ isSaving } disabled={ isSaving }>
				{ __( 'Save', 'jetpack-search-pkg' ) }
			</Button>
			{ saved && (
				<span className="jp-search-behavior-tab__saved">
					{ __( 'Saved.', 'jetpack-search-pkg' ) }
				</span>
			) }
		</div>
	);
}
