/**
 * External dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import SupportLink from '../../../components/support-link';

/**
 * Subtitle for the VideoPress admin page header, shared by the dashboard and
 * the video details screen.
 *
 * @return The subtitle element.
 */
export default function PageSubTitle() {
	return createInterpolateElement(
		__(
			'Professional quality, ad-free video hosting. <link>Learn more</link>.',
			'jetpack-videopress-pkg'
		),
		{ link: <SupportLink /> }
	);
}
