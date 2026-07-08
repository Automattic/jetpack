import { ThemeProvider } from '@automattic/jetpack-components';
import '@wordpress/theme/design-tokens.css';

// import '@wordpress/components/build-style/style.css';

import './style.scss';

window.wp = {
	i18n: {},
};

// Make `@automattic/jetpack-connection` happy.
window.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: {
			wpcomUser: { Id: 99999, login: 'bobsacramento', display_name: 'Bob Sacramento' },
		},
	},
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
		a11y: {
			test: 'todo', // Show in UI, not in CI. Set "error" to fail in CI too.
		},
		options: {
			storySort: {
				order: [
					'*',
					[ 'AI Client', 'Charts', [ 'Introduction', 'Types', 'Composites', 'Themes', '*' ] ],
				],
			},
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
	tags: [ 'autodocs' ],
};
export default preview;
