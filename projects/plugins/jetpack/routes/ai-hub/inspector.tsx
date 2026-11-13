import DiscoverSkillPanel from '../../_inc/client/ai/discover/skill-panel';
import type { ComponentType } from 'react';

// skill-panel.jsx is untyped, so TS infers its return as `object` rather than a React element.
const SkillPanel = DiscoverSkillPanel as ComponentType;

/**
 * Boot inspector for the Jetpack AI Hub: the side panel a skill opens in,
 * beside the Discover tab. The route's gate shows it while `skill` names one.
 *
 * @return The skill's panel, or nothing.
 */
const Inspector = () => <SkillPanel />;

export { Inspector as inspector };
