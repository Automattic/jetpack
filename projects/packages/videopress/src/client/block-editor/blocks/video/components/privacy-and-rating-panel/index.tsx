/**
 * Internal dependencies
 */
import PrivacyAndRatingSettings from './privacy-and-rating-settings';
/**
 * Types
 */
import type { VideoControlProps } from '../../types';
import type React from 'react';

/**
 * React component that renders the main privacy and ratings panel.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}    - Panel to contain privacy and ratings settings.
 */
export default function PrivacyAndRatingPanel( {
	attributes,
	setAttributes,
	privateEnabledForSite,
}: VideoControlProps ): React.ReactElement {
	return <PrivacyAndRatingSettings { ...{ attributes, setAttributes, privateEnabledForSite } } />;
}
