/**
 * Advanced settings panel for the Divi 5 VideoPress module.
 */
import { Fragment } from 'react';
import { cssFields } from './custom-css';

const {
	CssGroup,
	IdClassesGroup,
	PositionSettingsGroup,
	ScrollSettingsGroup,
	TransitionGroup,
	VisibilitySettingsGroup,
} = window?.divi?.module ?? {};

/**
 * Renders the advanced panel.
 *
 * @return {Element} The advanced settings.
 */
export const SettingsAdvanced = () => (
	<Fragment>
		<IdClassesGroup />
		<CssGroup mainSelector=".et_pb_videopress" cssFields={ cssFields } />
		<VisibilitySettingsGroup />
		<TransitionGroup />
		<PositionSettingsGroup />
		<ScrollSettingsGroup />
	</Fragment>
);
