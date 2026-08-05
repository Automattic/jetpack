/**
 * Welcome guide pages
 *
 * Slide content for the form editor welcome guide. Each page reserves an
 * image slot so artwork can be dropped in later without restructuring.
 */

import { __ } from '@wordpress/i18n';
import type { ReactNode } from 'react';

interface GuidePage {
	image: ReactNode;
	content: ReactNode;
}

/**
 * Placeholder for slide artwork.
 *
 * Reserves the image region so the guide keeps a stable size across slides
 * while the artwork is still being designed.
 *
 * @return The placeholder element.
 */
const ImageSlot = () => (
	<div className="jetpack-forms-welcome-guide__image">
		<div className="jetpack-forms-welcome-guide__image-slot" aria-hidden="true" />
	</div>
);

/**
 * Builds the welcome guide pages.
 *
 * Called at render time rather than defined as a module constant so the
 * strings are translated after the locale data has loaded.
 *
 * @return The guide pages, in order.
 */
export function getWelcomeGuidePages(): GuidePage[] {
	return [
		{
			image: <ImageSlot />,
			content: (
				<>
					<h1 className="jetpack-forms-welcome-guide__heading">
						{ __( 'Welcome to the form editor', 'jetpack-forms' ) }
					</h1>
					<p className="jetpack-forms-welcome-guide__text">
						{ __(
							'You’re building a reusable form. Create it once here, then add it to any page or post on your site.',
							'jetpack-forms'
						) }
					</p>
				</>
			),
		},
		{
			image: <ImageSlot />,
			content: (
				<>
					<h1 className="jetpack-forms-welcome-guide__heading">
						{ __( 'Add fields', 'jetpack-forms' ) }
					</h1>
					<p className="jetpack-forms-welcome-guide__text">
						{ __(
							'Start with a template — Contact, RSVP, Registration, and more. From there, add any extra fields from the inserter, where they’re grouped into Basic, Contact info, Choice, Advanced, and Multi-step. Everything you add goes inside the form automatically.',
							'jetpack-forms'
						) }
					</p>
				</>
			),
		},
		{
			image: <ImageSlot />,
			content: (
				<>
					<h1 className="jetpack-forms-welcome-guide__heading">
						{ __( 'Make each field yours', 'jetpack-forms' ) }
					</h1>
					<p className="jetpack-forms-welcome-guide__text">
						{ __(
							'Select a field to set its label, its placeholder, and whether it’s required. Field settings live in the sidebar on the right.',
							'jetpack-forms'
						) }
					</p>
				</>
			),
		},
		{
			image: <ImageSlot />,
			content: (
				<>
					<h1 className="jetpack-forms-welcome-guide__heading">
						{ __( 'Decide what happens after submit', 'jetpack-forms' ) }
					</h1>
					<p className="jetpack-forms-welcome-guide__text">
						{ __(
							'Select the form itself to choose a confirmation message or a redirect, turn on email and push notifications, connect integrations, and control whether responses are saved.',
							'jetpack-forms'
						) }
					</p>
				</>
			),
		},
		{
			image: <ImageSlot />,
			content: (
				<>
					<h1 className="jetpack-forms-welcome-guide__heading">
						{ __( 'Publish and share it', 'jetpack-forms' ) }
					</h1>
					<p className="jetpack-forms-welcome-guide__text">
						{ __(
							'When you publish, you can add the form to a new page, drop it onto an existing one, or copy the embed code. Responses land in your inbox — open it any time with “View responses”.',
							'jetpack-forms'
						) }
					</p>
				</>
			),
		},
	];
}
