/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { PluginPostStatusInfo } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { CopyCodeRow } from './copy-code-row';

export const EMBED_CODE_PANEL_PLUGIN = 'jetpack-forms-embedcode-panel';

/**
 * Embed Code Panel component.
 *
 * Adds post status info rows with the embed code and shortcode, each with a copy button.
 * Only renders when editing a jetpack_form post type.
 *
 * @return {JSX.Element|null} The embed code panel or null.
 */
export const EmbedCodePanel = () => {
	const { postId, postStatus } = useSelect( select => {
		const editor = select( 'core/editor' ) as {
			getCurrentPostId: () => number;
			getEditedPostAttribute: ( attr: string ) => string;
		};
		return {
			postId: editor.getCurrentPostId(),
			postStatus: editor.getEditedPostAttribute( 'status' ),
		};
	} );

	// Don't show for drafts or auto-drafts since they don't have a stable ID yet.
	if ( postStatus === 'auto-draft' ) {
		return null;
	}

	// PluginPostStatusInfo may not be available in older WordPress versions.
	if ( ! PluginPostStatusInfo ) {
		return null;
	}

	const embedCode = `<!-- wp:jetpack/contact-form {"ref":${ postId }} /-->`;
	const shortcode = `[contact-form ref="${ postId }"]`;

	return (
		<PluginPostStatusInfo className="jetpack-form-embed-code">
			<div className="jetpack-form-embed-code__rows">
				<CopyCodeRow text={ embedCode } tooltipLabel={ __( 'Copy embed code', 'jetpack-forms' ) } />
				<CopyCodeRow text={ shortcode } tooltipLabel={ __( 'Copy shortcode', 'jetpack-forms' ) } />
			</div>
		</PluginPostStatusInfo>
	);
};
