import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';

const GUIDELINES_REST = '/wp/v2/guidelines';
const SETTINGS_REST = '/wp/v2/settings';
const SETTINGS_KEY = 'jetpack_search_ai_behavior_instructions';
const BEHAVIOR_META_KEY = '_guideline_block_jetpack_search-ai-summary';

export const DEFAULT_PERSONALITY = __(
	'You are a search results summarizer for Jetpack Search. Your job is to summarize the best available successful search results in a succinct manner.',
	'jetpack-search-pkg'
);

/**
 * Manages loading and saving the AI Answers personality instructions.
 *
 * Reads from /wp/v2/guidelines when the Gutenberg Guidelines CPT is available,
 * falling back to /wp/v2/settings otherwise.
 *
 * @return {{ content: string, setContent: Function, postId: number|null, isSaving: boolean, isLoading: boolean, error: string|null, saved: boolean, isUnavailable: boolean, savePersonality: Function }} Hook state and actions for AI answers personality settings.
 */
export default function useAiAnswersSettings() {
	const [ content, setContent ] = useState( '' );
	const [ postId, setPostId ] = useState( null );
	const [ useSettings, setUseSettings ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState( null );
	const [ saved, setSaved ] = useState( false );
	const [ isUnavailable, setIsUnavailable ] = useState( false );

	useEffect( () => {
		apiFetch( { path: GUIDELINES_REST } )
			.then( posts => {
				const post = Array.isArray( posts ) ? posts[ 0 ] : posts;
				if ( post && post.id ) {
					setPostId( post.id );
					setContent( post.meta?.[ BEHAVIOR_META_KEY ] ?? '' );
				}
			} )
			.catch( err => {
				if ( err.code === 'rest_no_route' || err.data?.status === 404 ) {
					setUseSettings( true );
					return apiFetch( { path: SETTINGS_REST } )
						.then( settings => {
							setContent( settings[ SETTINGS_KEY ] ?? '' );
						} )
						.catch( () => {
							setIsUnavailable( true );
						} );
				}
				setError( err.message );
			} )
			.finally( () => setIsLoading( false ) );
	}, [] );

	const savePersonality = () => {
		setIsSaving( true );
		setSaved( false );
		setError( null );

		let promise;
		if ( useSettings ) {
			promise = apiFetch( {
				path: SETTINGS_REST,
				method: 'POST',
				data: { [ SETTINGS_KEY ]: content || DEFAULT_PERSONALITY },
			} );
		} else {
			const path = postId ? `${ GUIDELINES_REST }/${ postId }` : GUIDELINES_REST;
			const method = postId ? 'PATCH' : 'POST';
			const data = {
				status: 'publish',
				meta: { [ BEHAVIOR_META_KEY ]: content || DEFAULT_PERSONALITY },
			};
			// WordPress requires at least a title when creating a post.
			if ( ! postId ) {
				data.title = __( 'Jetpack Search AI Answers', 'jetpack-search-pkg' );
			}
			promise = apiFetch( {
				path,
				method,
				data,
			} ).then( post => {
				setPostId( post.id );
			} );
		}

		promise
			.then( () => setSaved( true ) )
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
