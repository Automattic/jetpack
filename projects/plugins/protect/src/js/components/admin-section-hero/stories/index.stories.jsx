import { Text } from '@automattic/jetpack-components';
import { Text as UIText } from '@wordpress/ui';
import AdminSectionHero from '..';
import InProgressAnimation from '../../in-progress-animation';

const activeColor = 'var(--jp-green-50)';

export default {
	title: 'Plugins/Protect/AdminSectionHero',
	component: AdminSectionHero,
};

export const Default = args => <AdminSectionHero { ...args } />;
Default.args = {
	main: (
		<>
			<UIText
				variant="body-sm"
				style={ {
					alignItems: 'center',
					color: activeColor,
					display: 'inline-flex',
					fontWeight: 600,
					lineHeight: 1.666,
					whiteSpace: 'nowrap',
				} }
			>
				<span
					style={ {
						backgroundColor: activeColor,
						borderRadius: '50%',
						flexShrink: 0,
						height: '0.666em',
						marginRight: '4px',
						width: '0.666em',
					} }
				/>
				<span>{ 'Active' }</span>
			</UIText>
			<AdminSectionHero.Heading showIcon>{ 'No threats found' }</AdminSectionHero.Heading>
			<AdminSectionHero.Subheading>
				<Text>{ 'Most recent results' }</Text>
			</AdminSectionHero.Subheading>
		</>
	),
	secondary: <InProgressAnimation />,
};
