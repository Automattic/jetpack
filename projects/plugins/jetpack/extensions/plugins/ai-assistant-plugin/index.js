/**
 * Internal dependencies
 */
import { name } from '../../blocks/ai-assistant';
import AiAssistantPluginSidebar from './components/ai-assistant-plugin-sidebar';

// plugin settings
export { name };
export const settings = {
	render: AiAssistantPluginSidebar,
};
