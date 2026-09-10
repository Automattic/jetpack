/**
 * External dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import SupportLink from '../../../client/components/support-link';

/**
 * Subtitle for the VideoPress admin page header, shared by the dashboard chrome
 * and the pre-connection screens so every state of the page reads the same.
 *
 * @return The subtitle element.
 */
export default function PageSubTitle() {
	return createInterpolateElement(
		__(
			'Host, manage, customize, and track your videos — all in one place. <link>Learn more</link>.',
			'jetpack-videopress-pkg'
		),
		{ link: <SupportLink /> }
	);
}
