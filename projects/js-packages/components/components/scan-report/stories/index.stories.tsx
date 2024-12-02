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
			version: '1.1',
			threats: [
				{
					id: 198352527,
					signature: 'Vulnerable.WP.Extension',
					description: 'Vulnerable WordPress extension',
					severity: 3,
				},
			],
			checked: true,
			type: 'themes',
		},
		{
			id: 4,
			name: '/var/www/html/wp-content/uploads/jptt_eicar.php',
			version: 'EICAR_AV_Test_Suspicious',
			threats: [
				{
					id: 198352406,
					signature: 'EICAR_AV_Test_Suspicious',
					title: 'Malicious code found in file: jptt_eicar.php',
					severity: 1,
				},
			],
			checked: true,
			type: 'files',
		},
	],
};
