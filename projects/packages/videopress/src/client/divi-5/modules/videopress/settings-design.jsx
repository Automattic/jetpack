/**
 * Design settings panel for the Divi 5 VideoPress module.
 */
import { Fragment } from 'react';

const {
	AnimationGroup,
	BorderGroup,
	BoxShadowGroup,
	FiltersGroup,
	SizingGroup,
	SpacingGroup,
	TransformGroup,
} = window?.divi?.module ?? {};

/**
 * Renders the design panel.
 *
 * @return {Element} The design settings.
 */
export const SettingsDesign = () => (
	<Fragment>
		<SizingGroup />
		<SpacingGroup />
		<BorderGroup />
		<BoxShadowGroup />
		<FiltersGroup />
		<TransformGroup />
		<AnimationGroup />
	</Fragment>
);
