/**
 * Button that copies a link to one tool on an MCP view.
 */

import { __ } from '@wordpress/i18n';
import { link } from '@wordpress/icons';
import ClipboardIconButton from 'components/clipboard-icon-button';

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
 * Copy-link button.
 *
 * @param {object} props        - Component props.
 * @param {string} props.view   - View path, e.g. `mcp/read`.
 * @param {string} props.anchor - Tool anchor to link to.
 * @return {object} Component markup.
 */
export default function AnchorCopyButton( { view, anchor } ) {
	return (
		<ClipboardIconButton
			text={ buildAnchorUrl( view, anchor ) }
			icon={ link }
			label={ __( 'Copy link to this tool', 'jetpack' ) }
			size="small"
		/>
	);
}
