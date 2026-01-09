import { NavigatorModal } from '@automattic/jetpack-components';

export type ScreenDetails = Extract<
	React.ComponentProps< typeof NavigatorModal.Screen >,
	{ content: React.ReactNode }
>;
