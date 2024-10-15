import AdminSectionHero from '..';
import inProgressImage from '../../../../../assets/images/in-progress.png';

export default {
	title: 'Plugins/Protect/AdminSectionHero',
	component: AdminSectionHero,
};

export const Default = args => <AdminSectionHero { ...args } />;
Default.args = {
	status: 'active',
	statusLabel: 'Active',
	heading: 'Heading',
	showIcon: true,
	subheading: 'subheading',
	secondary: <img src={ inProgressImage } alt="" />,
};
