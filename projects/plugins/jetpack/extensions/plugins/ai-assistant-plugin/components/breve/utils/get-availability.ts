import { getFeatureAvailability } from '../../../../../blocks/ai-assistant/lib/utils/get-feature-availability';

const blogId = parseInt( window?.Jetpack_Editor_Initial_State?.wpcomBlogId );

// Enable backend prompts for beta sites + 10% of production sites.
const isBreveAvailable = getFeatureAvailability( 'ai-proofread-breve' ) || blogId % 10 === 0;

export default isBreveAvailable;
