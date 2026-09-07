import { getAdminUrl, getScriptData } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
import { MyJetpackModule } from '../types';

/**
 * On block themes the legacy sharing buttons can't be customized in the Site Editor,
 * so we steer users to the Sharing Buttons block instead ( see DOTTHEM-338 ).
 *
 * @param {MyJetpackModule} module - The module.
 *
 * @return {string} The Site Editor URL for the Sharing Buttons block, or '' when the block path doesn't apply.
 */
export function getSharingBlockEditorUrl( module: MyJetpackModule ): string {
	const siteEditor = getScriptData()?.myJetpack?.siteEditor;

	if (
		module.module !== 'sharedaddy' ||
		module.override === 'active' ||
		! siteEditor?.isBlockTheme ||
		! siteEditor?.isSharingBlockAvailable ||
		! siteEditor?.activeThemeStylesheet
	) {
		return '';
	}

	return getAdminUrl(
		`site-editor.php?p=%2Fwp_template%2F${ encodeURIComponent(
			siteEditor.activeThemeStylesheet
		) }%2F%2Fsingle&canvas=edit`
	);
}

/**
 * Explanation shown in place of the module description on block themes, describing
 * either why to switch from legacy sharing or what to do next. Null otherwise.
 *
 * @param {MyJetpackModule} module - The module.
 *
 * @return {string|null} The notice, or null to fall back to the default description.
 */
export function getSharingBlockNotice( module: MyJetpackModule ): string | null {
	if ( ! getSharingBlockEditorUrl( module ) ) {
		return null;
	}

	return module.activated
		? __( 'Legacy sharing buttons cannot be customized on block themes.', 'jetpack-my-jetpack' )
		: _x(
				'Add the Sharing Buttons block to your theme’s template.',
				'Sharing block migration instruction',
				'jetpack-my-jetpack'
		  );
}
