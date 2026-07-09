import { __ } from '@wordpress/i18n';
import { getMyJetpackWindowInitialState } from '../data/utils/get-my-jetpack-window-state';
import { MyJetpackModule } from '../types';

const buildSharingTemplateUrl = ( adminUrl: string, stylesheet: string ) =>
	`${ adminUrl }site-editor.php?p=%2Fwp_template%2F${ encodeURIComponent(
		stylesheet
	) }%2F%2Fsingle&canvas=edit`;

/**
 * On block themes the legacy sharing buttons can't be customized in the Site Editor,
 * so we steer users to the Sharing Buttons block instead ( see DOTTHEM-338 ).
 *
 * @param {MyJetpackModule} module - The module.
 *
 * @return {string} The Site Editor URL for the Sharing Buttons block, or '' when the block path doesn't apply.
 */
export function getSharingBlockEditorUrl( module: MyJetpackModule ): string {
	const { adminUrl = '', siteEditor } = getMyJetpackWindowInitialState() || {};

	return module.module === 'sharedaddy' &&
		siteEditor?.isBlockTheme &&
		siteEditor?.isSharingBlockAvailable
		? buildSharingTemplateUrl( adminUrl, siteEditor.activeThemeStylesheet )
		: '';
}

/**
 * Explanation shown in place of the module description when legacy sharing is active on
 * a block theme, telling the user why to switch to the block. Null otherwise.
 *
 * @param {MyJetpackModule} module - The module.
 *
 * @return {string|null} The notice, or null to fall back to the default description.
 */
export function getSharingBlockNotice( module: MyJetpackModule ): string | null {
	return module.activated && getSharingBlockEditorUrl( module )
		? __( 'Legacy sharing buttons cannot be customized on block themes.', 'jetpack-my-jetpack' )
		: null;
}
