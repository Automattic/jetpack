/**
 * Button that copies a link to one tool on an MCP view.
 */

import { Button } from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, link } from '@wordpress/icons';

const COPIED_RESET_MS = 2000;

/**
 * Build the shareable URL. The hash is the router, so the anchor goes in the path.
 *
 * @param {string} view   - View path, e.g. `mcp/read`.
 * @param {string} anchor - Tool anchor.
 * @return {string} Absolute URL.
 */
function buildAnchorUrl( view, anchor ) {
	const { origin, pathname, search } = window.location;
	return `${ origin }${ pathname }${ search }#/${ view }/${ anchor }`;
}

/**
 * Copy-link button with a transient "Copied" state.
 *
 * @param {object} props        - Component props.
 * @param {string} props.view   - View path, e.g. `mcp/read`.
 * @param {string} props.anchor - Tool anchor to link to.
 * @return {object} Component markup.
 */
export default function AnchorCopyButton( { view, anchor } ) {
	const [ copied, setCopied ] = useState( false );
	const timeout = useRef();

	useEffect( () => () => clearTimeout( timeout.current ), [] );

	const handleClick = useCallback( () => {
		window.navigator.clipboard
			?.writeText( buildAnchorUrl( view, anchor ) )
			.then( () => {
				setCopied( true );
				clearTimeout( timeout.current );
				timeout.current = setTimeout( () => setCopied( false ), COPIED_RESET_MS );
			} )
			.catch( () => {} );
	}, [ view, anchor ] );

	return (
		<Button
			size="small"
			icon={ copied ? check : link }
			label={ copied ? __( 'Copied', 'jetpack' ) : __( 'Copy link to this tool', 'jetpack' ) }
			showTooltip
			onClick={ handleClick }
		/>
	);
}
