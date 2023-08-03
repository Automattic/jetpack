import { JetpackLogo } from '@automattic/jetpack-components';
import type React from 'react';

/**
 * The Jetpack logo used for block editor panels
 *
 * @returns {React.ReactElement} - JSX Element
 */
const JetpackEditorPanelLogo = () => (
	<JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" />
);

export default JetpackEditorPanelLogo;
