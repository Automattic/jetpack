import { Status, Text } from '@automattic/jetpack-components';
import AdminSectionHero from '..';
import InProgressAnimation from '../../in-progress-animation';

export default {
	title: 'Plugins/Protect/AdminSectionHero',
	component: AdminSectionHero,
};

export const Default = args => <AdminSectionHero { ...args } />;
Default.args = {
	children: (
		<>
			<AdminSectionHero.Main>
				<Status status={ 'active' } label={ 'Active' } />
				<AdminSectionHero.Heading icon="success">{ 'No threats found' }</AdminSectionHero.Heading>
				<Text>{ 'Most recent results' }</Text>
			</AdminSectionHero.Main>
			<AdminSectionHero.Aside>
				<InProgressAnimation />
			</AdminSectionHero.Aside>
		</>
	),
};
