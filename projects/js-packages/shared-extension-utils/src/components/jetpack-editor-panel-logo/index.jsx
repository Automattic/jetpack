import { JetpackLogo } from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';

import './style.scss';

/**
 * The Jetpack logo used for block editor panels.
 *
 * Returns null when panel branding is disabled via the
 * `jetpack_show_editor_panel_branding` PHP filter.
 *
 * @return {import('react').JSX.Element|null} Jetpack logo component or null
 */
const JetpackEditorPanelLogo = () => {
	const branding = getScriptData()?.jetpack?.flags?.showJetpackBranding;
	// undefined means the key isn't present (older PHP), so default to showing branding.
	if ( branding !== undefined && ! branding ) {
		return null;
	}

	return (
		<JetpackLogo
			className="jetpack-editor-panel-logo"
			height={ 16 }
			logoColor="#1E1E1E"
			showText={ false }
			title={ __( 'This feature is powered by Jetpack', 'jetpack-shared-extension-utils' ) }
		/>
	);
};

export default JetpackEditorPanelLogo;
