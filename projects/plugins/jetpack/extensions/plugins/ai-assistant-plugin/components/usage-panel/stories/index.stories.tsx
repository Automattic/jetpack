import { UsagePanel } from '..';

export default {
	title: 'Plugins/Jetpack/Extensions/UsagePanel',
	component: UsagePanel,
	tags: [ '!autodocs' ],
};

const DefaultTemplate = args => {
	return <UsagePanel { ...args } />;
};

export const DefaultView = DefaultTemplate.bind( {} );
DefaultView.args = {
	nextStart: '2024-05-10 00:00:00',
	nextLimit: 200,
	requestsCount: 10,
	requestsLimit: 100,
	planType: 'tiered',
	loading: false,
	canUpgrade: true,
	showContactUsCallToAction: false,
	isRedirecting: false,
};
