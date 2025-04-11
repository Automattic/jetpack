import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { ExternalLink } from '@wordpress/components';
import { createElement, useEffect } from '@wordpress/element';
import { TRACKS_EVENT_NAME_PREFIX } from '../constants';
import { createTracksEventHandler } from '../helpers';
/**
 * Generates a Link component, that will be displayed differently
 * whether the link is external or stays within the platform.
 *
 * @param {boolean} internal - Whether the link points to an internal resource
 * @param {string}  href     - Link target URL
 * @param {string}  text     - The link text
 * @returns {React.ReactElement} The link component
 */
export const DashboardLink = (
	internal: boolean,
	href: string,
	eventName: string,
	text?: string
): React.ReactElement => {
	const { tracks } = useAnalytics();

	useEffect( () => {
		tracks.recordEvent( `${ TRACKS_EVENT_NAME_PREFIX }_view` );
	}, [ tracks ] );

	let elementType = ExternalLink;
	if ( internal ) {
		elementType = 'a';
	}

	return createElement(
		elementType,
		{ href, onClick: createTracksEventHandler( tracks, eventName ) },
		text ? text : undefined
	);
};
