/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import JetpackFooter from '../index.jsx';

export default {
	title: 'Playground/Jetpack Footer',
};

export const _default = () => {
	const moduleName = text( 'Module Name', 'The Module Name' );
	const a8cLogoHref = text( 'A8C Logo Href', 'https://www.jetpack.com' );

	return (
		<JetpackFooter
			moduleName={ moduleName }
			a8cLogoHref={ a8cLogoHref }
			className="jp-dashboard-footer"
		/>
	);
};
