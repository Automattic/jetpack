/**
 * Internal dependencies
 */
import AiAssistantPluginSidebar from './components/ai-assistant-plugin-sidebar';
import OnboardingGuide from './components/onboarding-guide';

// plugin settings
export const name = 'ai-assistant-plugin';
export const settings = {
	render: () => (
		<>
			<AiAssistantPluginSidebar />
			<OnboardingGuide />
		</>
	),
};
