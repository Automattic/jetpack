import apiFetch from '@wordpress/api-fetch';
import { Button, ExternalLink, Notice, TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';

const REST_BASE = '/wp/v2/guidelines';
const adminUrl = window?.JETPACK_SEARCH_DASHBOARD_INITIAL_STATE?.siteData?.adminUrl ?? '/wp-admin/';
const DEFAULT_PERSONALITY = __(
	'You are a search results summarizer for Jetpack Search. Your job is to summarize the best available successful search results in a succinct manner.',
	'jetpack-search-pkg'
);

/**
 * Personality tab component for configuring AI Answers personality instructions.
 *
 * @return {import('react').ReactElement} PersonalityTab component.
 */
export default function BehaviorTab() {
	const [ content, setContent ] = useState( '' );
	const [ postId, setPostId ] = useState( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ saved, setSaved ] = useState( false );
	const [ isUnavailable, setIsUnavailable ] = useState( false );

	useEffect( () => {
		apiFetch( { path: REST_BASE } )
			.then( posts => {
				const post = Array.isArray( posts ) ? posts[ 0 ] : posts;
				// id === 0 means no guidelines exist yet (singleton empty response).
				if ( post && post.id ) {
					setPostId( post.id );
					setContent(
						post.guideline_categories?.blocks?.[ 'jetpack/search-ai-summary' ]?.guidelines ?? ''
					);
				}
			} )
			.catch( err => {
				if ( err.code === 'rest_no_route' || err.data?.status === 404 ) {
					setIsUnavailable( true );
				} else {
					setError( err.message );
				}
			} )
			.finally( () => setIsLoading( false ) );
	}, [] );

	const save = () => {
		setIsSaving( true );
		setSaved( false );
		setError( null );
		const path = postId ? `${ REST_BASE }/${ postId }` : REST_BASE;
		const method = postId ? 'PATCH' : 'POST';
		apiFetch( {
			path,
			method,
			data: {
				status: 'publish',
				guideline_categories: {
					blocks: { 'jetpack/search-ai-summary': { guidelines: content || DEFAULT_PERSONALITY } },
				},
			},
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

	if ( isUnavailable ) {
		return (
			<Notice status="warning" isDismissible={ false }>
				<p>
					{ __(
						'Personality instructions require the Gutenberg Guidelines feature. To enable it:',
						'jetpack-search-pkg'
					) }
				</p>
				<ol>
					<li>{ __( 'Install or update to Gutenberg 22.7 or later.', 'jetpack-search-pkg' ) }</li>
					<li>
						{ __(
							'Go to Settings → Gutenberg → Experiments and enable "Guidelines".',
							'jetpack-search-pkg'
						) }{ ' ' }
						<ExternalLink href={ `${ adminUrl }admin.php?page=gutenberg-experiments` }>
							{ __( 'Open Experiments page', 'jetpack-search-pkg' ) }
						</ExternalLink>
					</li>
				</ol>
			</Notice>
		);
	}

	return (
		<div className="jp-search-behavior-tab">
			<p className="jp-search-behavior-tab__description">
				{ __(
					'Describe the personality of the AI summarizer. This text is sent as a system prompt to the AI.',
					'jetpack-search-pkg'
				) }
			</p>
			{ error && <p className="jp-search-behavior-tab__error">{ error }</p> }
			<TextareaControl
				label={ __( 'Personality', 'jetpack-search-pkg' ) }
				value={ content }
				onChange={ setContent }
				placeholder={ DEFAULT_PERSONALITY }
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
