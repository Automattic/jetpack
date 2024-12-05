import ShieldIcon from '../index';

export default {
	title: 'JS Packages/Components/Sheild Icon',
	component: ShieldIcon,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		variant: {
			control: {
				type: 'select',
			},
			options: [ 'default', 'info', 'success', 'warning', 'error' ],
		},
		icon: {
			control: {
				type: 'select',
			},
			options: [ 'success', 'error', 'info' ],
		},
		fill: {
			control: 'color',
		},
		outline: {
			control: 'boolean',
		},
	},
};

export const Default = args => <ShieldIcon { ...args } />;
Default.args = {
	variant: 'success',
	outline: false,
};

export const Variants = () => {
	return (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '8px' } }>
			<div style={ { display: 'flex', gap: '8px' } }>
				<ShieldIcon variant="default" />
				<ShieldIcon variant="info" />
				<ShieldIcon variant="success" />
				<ShieldIcon variant="warning" />
				<ShieldIcon variant="error" />
			</div>
			<div style={ { display: 'flex', gap: '8px' } }>
				<ShieldIcon variant="default" outline />
				<ShieldIcon variant="info" outline />
				<ShieldIcon variant="success" outline />
				<ShieldIcon variant="warning" outline />
				<ShieldIcon variant="error" outline />
			</div>
		</div>
	);
};
