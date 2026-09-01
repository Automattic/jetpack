/**
 * Internal dependencies
 */
import PrivacyAndRatingSettings from './privacy-and-rating-settings';
/**
 * Types
 */
import type { PrivacyAndRatingPanelProps } from '../../types';
import type { ReactElement } from 'react';

/**
 * React component that renders the main privacy and ratings panel.
 *
 * @param {PrivacyAndRatingPanelProps} props - Component props.
 * @return {ReactElement}               Panel to contain privacy and ratings settings.
 */
export default function PrivacyAndRatingPanel( {
	attributes,
	setAttributes,
	privateEnabledForSite,
	videoBelongToSite,
}: PrivacyAndRatingPanelProps ): ReactElement {
	return (
		<PrivacyAndRatingSettings
			{ ...{ attributes, setAttributes, privateEnabledForSite, videoBelongToSite } }
		/>
	);
}
