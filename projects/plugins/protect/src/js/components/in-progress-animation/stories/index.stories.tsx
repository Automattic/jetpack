import InProgressAnimation from '..';

export default {
	title: 'Plugins/Protect/In Progress Animation',
	component: InProgressAnimation,
};

const Template = args => <InProgressAnimation { ...args } />;
export const Default = Template.bind( {} );
Default.args = {};
