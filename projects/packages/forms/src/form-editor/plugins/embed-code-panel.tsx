/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { PluginPostStatusInfo } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getEmbedCode, getShortcode } from '../../blocks/shared/util/embed-codes';
import { CopyCodeRow } from './copy-code-row';

export const EMBED_CODE_PANEL_PLUGIN = 'jetpack-form-embed-code-panel';

/**
 * Embed Code Panel component.
 *
 * Adds post status info rows with the embed code and shortcode, each with a copy button.
 * Rendered only in the jetpack_form post editor; post-type scoping is handled by
 * registration logic in form-editor/index.tsx.
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

	// Don't show for auto-drafts since they don't have a stable ID yet.
	if ( postStatus === 'auto-draft' ) {
		return null;
	}

	// PluginPostStatusInfo may not be available in older WordPress versions.
	if ( ! PluginPostStatusInfo ) {
		return null;
	}

	const embedCode = getEmbedCode( postId );
	const shortcode = getShortcode( postId );

	return (
		<PluginPostStatusInfo className="jetpack-form-embed-code">
			<div className="jetpack-form-embed-code__rows">
				<CopyCodeRow text={ embedCode } label={ __( 'Embed code', 'jetpack-forms' ) } />
				<CopyCodeRow text={ shortcode } label={ __( 'Shortcode', 'jetpack-forms' ) } />
			</div>
		</PluginPostStatusInfo>
	);
};
