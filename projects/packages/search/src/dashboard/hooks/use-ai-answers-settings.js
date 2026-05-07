import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';

const REST_BASE = '/wp/v2/guidelines';
export const DEFAULT_PERSONALITY = __(
	'You are a search results summarizer for Jetpack Search. Your job is to summarize the best available successful search results in a succinct manner.',
	'jetpack-search-pkg'
);

/**
 * Manages loading and saving the AI Answers personality instructions.
 *
 * @return {{ content: string, setContent: Function, postId: number|null, isSaving: boolean, isLoading: boolean, error: string|null, saved: boolean, isUnavailable: boolean, savePersonality: Function }} Hook state and actions for AI answers personality settings.
 */
export default function useAiAnswersSettings() {
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

	const savePersonality = () => {
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

	return {
		content,
		setContent,
		postId,
		isSaving,
		isLoading,
		error,
		saved,
		isUnavailable,
		savePersonality,
	};
}
