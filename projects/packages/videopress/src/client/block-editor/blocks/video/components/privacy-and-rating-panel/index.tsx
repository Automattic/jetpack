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
 * Sidebar Control component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}    Component template
 */
export default function PrivacyAndRatingPanel( {
	attributes,
	setAttributes,
	privateEnabledForSite,
}: VideoControlProps ): React.ReactElement {
	return <PrivacyAndRatingSettings { ...{ attributes, setAttributes, privateEnabledForSite } } />;
}
