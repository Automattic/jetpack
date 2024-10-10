import Header from '..';
import inProgressImage from '../../../../../assets/images/in-progress.png';

export default {
	title: 'Plugins/Protect/Header',
	component: Header,
};

export const Default = args => <Header { ...args } />;
Default.args = {
	status: 'active',
	statusLabel: 'Active',
	heading: 'Heading',
	showIcon: true,
	subheading: 'subheading',
	secondary: <img src={ inProgressImage } alt="" />,
};
