import ShieldAlertIcon from '..';

export default {
	title: 'JS Packages/Components/Shield Alert',
	component: ShieldAlertIcon,
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

export const Default = () => <ShieldAlertIcon />;
