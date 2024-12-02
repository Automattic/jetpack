import ScanReport from '..';

export default {
	title: 'JS Packages/Components/Scan Report',
	component: ScanReport,
	parameters: {
		backgrounds: {
			default: 'light',
			values: [ { name: 'light', value: 'white' } ],
		},
	},
	decorators: [
		Story => (
			<div style={ { maxWidth: '100%', backgroundColor: 'white' } }>
				<Story />
			</div>
		),
	],
};

export const Default = args => <ScanReport { ...args } />;
Default.args = {
	// TODO: Need to pass all core, plugins, themes, files, and database as a flat array
	data: [
		{
			id: 1,
			name: 'WordPress',
			slug: null,
			version: '6.7.1',
			threats: [],
			checked: true,
			type: 'core',
		},
		{
			id: 2,
			name: 'Jetpack',
			slug: 'jetpack/jetpack.php',
			version: '14.1-a.7',
			threats: [],
			checked: false,
			type: 'plugins',
		},
		{
			id: 3,
			name: 'Twenty Fifteen',
			slug: 'twentyfifteen',
			version: '14.1-a.7',
			threats: [],
			checked: true,
			type: 'themes',
		},
	],
	filters: [],
};

// data: {
// 	core: {
// 		name: 'WordPress',
// 		slug: null,
// 		version: '6.7.1',
// 		threats: [],
// 		checked: true,
// 		type: 'core',
// 	},
// 	plugins: [
// 		{
// 			name: 'Jetpack',
// 			slug: 'jetpack/jetpack.php',
// 			version: '14.1-a.7',
// 			threats: [],
// 			checked: false,
// 			type: 'plugins',
// 		},
// 	],
// 	themes: [
// 		{
// 			name: 'Twenty Fifteen',
// 			slug: 'twentyfifteen',
// 			version: '14.1-a.7',
// 			threats: [],
// 			checked: true,
// 			type: 'themes',
// 		},
// 	],
// 	files: [],
// 	database: [],
// }
