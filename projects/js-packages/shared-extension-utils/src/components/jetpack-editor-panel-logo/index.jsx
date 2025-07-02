import { JetpackLogo } from '@automattic/jetpack-components';

import './style.scss';

/**
 * The Jetpack logo used for block editor panels
 *
 * @return {import('react').Component} Jetpack logo component
 */
const JetpackEditorPanelLogo = () => (
	<JetpackLogo
		className="jetpack-editor-panel-logo"
		height={ 16 }
		logoColor="#1E1E1E"
		showText={ false }
	/>
);

export default JetpackEditorPanelLogo;
