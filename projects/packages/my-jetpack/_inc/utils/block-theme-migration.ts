import { getAdminUrl, getScriptData } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
import { MyJetpackModule } from '../types';

export type BlockThemeMigration = {
	editorUrl: string;
	notice: string;
	switchLabel: string;
	switchingAnnouncement: string;
};

/**
 * Site Editor URL for the active theme's Single template, in edit mode.
 *
 * @param {string} stylesheet - The active theme's stylesheet.
 *
 * @return {string} The Site Editor URL.
 */
function getSingleTemplateUrl( stylesheet: string ): string {
	return getAdminUrl(
		`site-editor.php?p=%2Fwp_template%2F${ encodeURIComponent(
			stylesheet
		) }%2F%2Fsingle&canvas=edit`
	);
}

/**
 * On block themes the legacy sharing buttons and Like buttons can't be customized in the
 * Site Editor, so we steer users to the blocks that replace them ( see DOTTHEM-338, CM-884 ).
 *
 * @param {MyJetpackModule} module - The module.
 *
 * @return {BlockThemeMigration|null} The block action to show in place of the toggle, or null when the block path doesn't apply.
 */
export function getBlockThemeMigration( module: MyJetpackModule ): BlockThemeMigration | null {
	const siteEditor = getScriptData()?.myJetpack?.siteEditor;

	if (
		module.override === 'active' ||
		! siteEditor?.isBlockTheme ||
		! siteEditor.activeThemeStylesheet
	) {
		return null;
	}

	if ( module.module === 'sharedaddy' && siteEditor.isSharingBlockAvailable ) {
		return {
			editorUrl: getSingleTemplateUrl( siteEditor.activeThemeStylesheet ),
			notice: module.activated
				? __( 'Legacy sharing buttons cannot be customized on block themes.', 'jetpack-my-jetpack' )
				: _x(
						'Add the Sharing Buttons block to your theme’s template.',
						'Sharing block migration instruction',
						'jetpack-my-jetpack'
				  ),
			switchLabel: __( 'Switch to Sharing Buttons block', 'jetpack-my-jetpack' ),
			switchingAnnouncement: __( 'Deactivating legacy sharing…', 'jetpack-my-jetpack' ),
		};
	}

	if ( module.module === 'likes' && siteEditor.isLikeBlockAvailable ) {
		return {
			editorUrl: getSingleTemplateUrl( siteEditor.activeThemeStylesheet ),
			notice: module.activated
				? __( 'Legacy Like buttons cannot be customized on block themes.', 'jetpack-my-jetpack' )
				: _x(
						'Add the Like block to your theme’s template.',
						'Like block migration instruction',
						'jetpack-my-jetpack'
				  ),
			switchLabel: __( 'Switch to the Like block', 'jetpack-my-jetpack' ),
			switchingAnnouncement: __( 'Deactivating legacy Like buttons…', 'jetpack-my-jetpack' ),
		};
	}

	return null;
}
