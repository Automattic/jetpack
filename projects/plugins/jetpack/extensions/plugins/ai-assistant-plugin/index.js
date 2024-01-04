/**
 * Internal dependencies
 */
import AiAssistantPluginSidebar from './components/ai-assistant-plugin-sidebar';
import Onboarding from './components/onboarding';
// plugin settings
export const name = 'ai-assistant-plugin';
export const settings = {
	render: () => (
		<>
			<AiAssistantPluginSidebar />
			<Onboarding />
		</>
	),
};
