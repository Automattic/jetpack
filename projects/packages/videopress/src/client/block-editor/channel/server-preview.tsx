/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Placeholder, Spinner } from '@wordpress/components';
import { RawHTML, useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { VideoPressIcon } from '../blocks/video/components/icons';

type ServerPreviewProps = {
	// Block name, e.g. `videopress/channel-details`.
	block: string;
	attributes: Record< string, unknown >;
	label: string;
	// Shown when the server renders nothing, e.g. outside a video page.
	emptyInstructions: string;
};

/**
 * Show a channel block as the server renders it, through core's block renderer endpoint.
 *
 * @param props                   - Component props.
 * @param props.block             - Block name.
 * @param props.attributes        - Attributes to render with.
 * @param props.label             - Placeholder label.
 * @param props.emptyInstructions - Placeholder text when there is nothing to show.
 * @return The preview.
 */
export default function ServerPreview( {
	block,
	attributes,
	label,
	emptyInstructions,
}: ServerPreviewProps ) {
	const [ html, setHtml ] = useState< string | null >( null );
	const serialized = JSON.stringify( attributes );

	useEffect( () => {
		let cancelled = false;
		setHtml( null );
		apiFetch< { rendered?: string } >( {
			path: addQueryArgs( `/wp/v2/block-renderer/${ block }`, {
				context: 'edit',
				attributes: JSON.parse( serialized ),
			} ),
		} )
			.then( response => ! cancelled && setHtml( response?.rendered ?? '' ) )
			.catch( () => ! cancelled && setHtml( '' ) );
		return () => {
			cancelled = true;
		};
	}, [ block, serialized ] );

	if ( null === html ) {
		return <Spinner />;
	}
	if ( '' === html.trim() ) {
		return (
			<Placeholder icon={ VideoPressIcon } label={ label } instructions={ emptyInstructions } />
		);
	}
	return <RawHTML>{ html }</RawHTML>;
}
