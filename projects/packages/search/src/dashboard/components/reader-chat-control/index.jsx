import apiFetch from '@wordpress/api-fetch';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
import Card from 'components/card';

const READER_CHAT_DESCRIPTION = __(
	'Let readers ask your blog questions and get answers from your content.',
	'jetpack-search-pkg'
);

/**
 * Reader Chat opt-in control. Reads and writes the blog_talks_back option
 * via the /wp/v2/settings REST endpoint.
 *
 * @return {import('react').Component} Reader Chat settings component.
 */
export default function ReaderChatControl() {
	const [ isEnabled, setIsEnabled ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );

	useEffect( () => {
		apiFetch( { path: '/wp/v2/settings' } )
			.then( settings => {
				setIsEnabled( Boolean( settings?.blog_talks_back ) );
			} )
			.catch( () => {
				// Silently fall back to unchecked if the fetch fails.
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	}, [] );

	const toggle = useCallback( next => {
		setIsSaving( true );
		apiFetch( {
			path: '/wp/v2/settings',
			method: 'POST',
			data: { blog_talks_back: next },
		} )
			.then( settings => {
				setIsEnabled( Boolean( settings?.blog_talks_back ) );
			} )
			.catch( () => {
				// Revert on failure.
				setIsEnabled( previous => previous );
			} )
			.finally( () => {
				setIsSaving( false );
			} );
	}, [] );

	return (
		<Card>
			<h2>{ __( 'Reader Chat', 'jetpack-search-pkg' ) }</h2>
			<p>{ READER_CHAT_DESCRIPTION }</p>
			<ToggleControl
				__nextHasNoMarginBottom
				checked={ isEnabled }
				disabled={ isLoading || isSaving }
				label={ __( 'Enable Reader Chat on your blog', 'jetpack-search-pkg' ) }
				onChange={ toggle }
			/>
		</Card>
	);
}
