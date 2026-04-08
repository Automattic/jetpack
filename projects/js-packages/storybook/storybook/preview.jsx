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
			wpcomUser: { Id: 99999, login: 'bobsacramento', display_name: 'Bob Sacrmaneto' },
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
		( Story, context ) => {
			// Charts stories render inside a WPDS-themed wrapper so they
			// inherit the design system body font through normal CSS cascade.
			// Chart components intentionally do not declare font-family at
			// their root — they rely on the host application to provide it.
			const isChartsStory = context.title?.startsWith( 'JS Packages/Charts Library' );
			const content = <Story />;
			return (
				<ThemeProvider id="storybook-stories" targetDom={ document.body }>
					{ isChartsStory ? <div className="charts-storybook-host">{ content }</div> : content }
				</ThemeProvider>
			);
		},
	],
	tags: [ 'autodocs' ],
};
export default preview;
