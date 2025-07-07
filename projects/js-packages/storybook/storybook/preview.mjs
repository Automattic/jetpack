import { ThemeProvider } from '@automattic/jetpack-components';

// import '@wordpress/components/build-style/style.css';

import './style.scss';

window.wp = {
	i18n: {},
};

const preview = {
	parameters: {
		backgrounds: {
			default: 'Jetpack Dashboard',
			options: {
				'jetpack-dashboard': {
					name: 'Jetpack Dashboard',
					value: 'var(--jp-white-off)',
				},
				dark: {
					name: 'Dark',
					value: 'rgb(51, 51, 51)',
				},
				light: {
					name: 'Light',
					value: '#FFF',
				},
			},
		},
		docs: {
			codePanel: true,
		},
	},
	initialGlobals: {
		backgrounds: { value: 'jetpack-dashboard' },
	},
	decorators: [
		Story => (
			<ThemeProvider id="storybook-stories" targetDom={ document.body }>
				<Story />
			</ThemeProvider>
		),
	],
};
export default preview;
