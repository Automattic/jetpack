import { GoogleSearchPreview } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import React from 'react';

/**
 * The Google Search tab component.
 *
 * @param {object} props - The props.
 * @param {object[]} props.tweets - The tweets.
 * @param {object} props.media - The media.
 * @returns {React.ReactNode} The Google Search tab component.
 */
export function GoogleSearch( props ) {
	const siteTitle = useSelect( select => {
		const { getEntityRecord } = select( 'core' );

		return decodeEntities( getEntityRecord( 'root', 'site' ).title );
	} );

	return <GoogleSearchPreview { ...props } siteTitle={ siteTitle } />;
}

export default GoogleSearch;
