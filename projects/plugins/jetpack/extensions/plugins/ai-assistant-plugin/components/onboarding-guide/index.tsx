// import { WpcomTourKit } from '@automattic/tour-kit';
// import type { WpcomConfig } from '@automattic/tour-kit';

import './style.scss';

const OnboardingGuide = () => {
	// const tourConfig: WpcomConfig = {
	// 	steps: [
	// 		{
	// 			slug: 'welcome',
	// 			meta: {
	// 				heading: 'Welcome to Jetpack AI!',
	// 				descriptions: {
	// 					desktop: 'This is the desktop description',
	// 					mobile: null,
	// 				},
	// 			},
	// 		},
	// 	],
	// 	closeHandler: () => {
	// 		return;
	// 	},
	// };

	return (
		<div className="jetpack-ai-onboarding-guide">
			<p>If you see this, yay it's been rendered!</p>
		</div>
	);
};

export default OnboardingGuide;
