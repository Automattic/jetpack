import { Status, Text } from '@automattic/jetpack-components';
import AdminSectionHero from '..';
import InProgressAnimation from '../../in-progress-animation';

export default {
	title: 'Plugins/Protect/AdminSectionHero',
	component: AdminSectionHero,
};

export const Default = args => <AdminSectionHero { ...args } />;
Default.args = {
	main: (
		<>
			<Status status={ 'active' } label={ 'Active' } />
			<AdminSectionHero.Heading showIcon>{ 'No threats found' }</AdminSectionHero.Heading>
			<AdminSectionHero.Subheading>
				<Text>{ 'Most recent results' }</Text>
			</AdminSectionHero.Subheading>
		</>
	),
	secondary: <InProgressAnimation />,
};
