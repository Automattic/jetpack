import { NavigatorModal } from '@automattic/jetpack-components';

export type ScreenDetails = Omit<
	React.ComponentProps< typeof NavigatorModal.Screen >,
	'children'
>;
