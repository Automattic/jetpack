import ScheduleButton from '../index.tsx';

export default {
	title: 'JS Packages/Publicize Components/ScheduleButton',
	component: ScheduleButton,
};

const Template = args => <ScheduleButton { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	scheduleTimestamp: Date.now() / 1000,
	isBusy: false,
	isDisabled: false,
};
