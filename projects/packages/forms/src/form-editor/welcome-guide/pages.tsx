/**
 * Welcome guide pages
 *
 * Slide content for the form editor welcome guide. Each page reserves an
 * image slot so artwork can be dropped in later without restructuring.
 */

import { __ } from '@wordpress/i18n';
import {
	AddFieldsIllustration,
	AfterSubmitIllustration,
	FieldSettingsIllustration,
	PublishIllustration,
	ReusableFormIllustration,
} from './illustrations';
import type { ReactNode } from 'react';

interface GuidePage {
	image: ReactNode;
	content: ReactNode;
}

/**
 * Wrapper for a slide's artwork.
 *
 * @param props          - Component props
 * @param props.children - The illustration to frame
 * @return The framed artwork.
 */
const Artwork = ( { children }: { children: ReactNode } ) => (
	<div className="jetpack-forms-welcome-guide__image">{ children }</div>
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
			image: (
				<Artwork>
					<ReusableFormIllustration />
				</Artwork>
			),
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
			image: (
				<Artwork>
					<AddFieldsIllustration />
				</Artwork>
			),
			content: (
				<>
					<h1 className="jetpack-forms-welcome-guide__heading">
						{ __( 'Add fields', 'jetpack-forms' ) }
					</h1>
					<p className="jetpack-forms-welcome-guide__text">
						{ __(
							'Start from a template like Contact, RSVP, or Registration, then add extra fields from the inserter. Everything you add lands inside the form automatically.',
							'jetpack-forms'
						) }
					</p>
				</>
			),
		},
		{
			image: (
				<Artwork>
					<FieldSettingsIllustration />
				</Artwork>
			),
			content: (
				<>
					<h1 className="jetpack-forms-welcome-guide__heading">
						{ __( 'Make each field yours', 'jetpack-forms' ) }
					</h1>
					<p className="jetpack-forms-welcome-guide__text">
						{ __(
							'Select any field to change its label, add placeholder text, or make it required. Field settings live in the sidebar on the right.',
							'jetpack-forms'
						) }
					</p>
				</>
			),
		},
		{
			image: (
				<Artwork>
					<AfterSubmitIllustration />
				</Artwork>
			),
			content: (
				<>
					<h1 className="jetpack-forms-welcome-guide__heading">
						{ __( 'Decide what happens after submit', 'jetpack-forms' ) }
					</h1>
					<p className="jetpack-forms-welcome-guide__text">
						{ __(
							'Select the form itself to set what happens when someone submits: show a message or redirect, send email and push notifications, and connect your integrations.',
							'jetpack-forms'
						) }
					</p>
				</>
			),
		},
		{
			image: (
				<Artwork>
					<PublishIllustration />
				</Artwork>
			),
			content: (
				<>
					<h1 className="jetpack-forms-welcome-guide__heading">
						{ __( 'Publish and share it', 'jetpack-forms' ) }
					</h1>
					<p className="jetpack-forms-welcome-guide__text">
						{ __(
							'When you publish, add the form to a new or existing page, or copy the embed code. Responses land in your inbox. Open it anytime with “View responses”.',
							'jetpack-forms'
						) }
					</p>
				</>
			),
		},
	];
}
