import { ThemeProvider } from '@automattic/jetpack-components';
import { dispatch } from '@wordpress/data';

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
		Story => {
			// Ensure WordPress stores are properly initialized and clean
			try {
				const stores = [ 'core/block-editor', 'core/editor', 'core' ];
				stores.forEach( storeName => {
					try {
						const store = dispatch( storeName );
						// Clear any locks or listeners that might cause issues
						if ( store && store.__unstableMarkListeningStores ) {
							store.__unstableMarkListeningStores( [] );
						}
					} catch ( e ) {
						// Store may not exist in this context, continue silently
					}
				} );
			} catch ( error ) {
				// Silently handle initialization errors
			}
			return <Story />;
		},
		Story => (
			<ThemeProvider id="storybook-stories" targetDom={ document.body }>
				<Story />
			</ThemeProvider>
		),
	],
	tags: [ 'autodocs' ],
};
export default preview;
