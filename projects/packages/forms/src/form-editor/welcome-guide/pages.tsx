/**
 * Welcome guide pages
 *
 * Slide content for the form editor welcome guide. Each page pairs artwork
 * with a heading and a short description.
 */

import { __ } from '@wordpress/i18n';
import addFieldsImage from './images/add-fields.webp';
import afterSubmitImage from './images/after-submit.webp';
import fieldSettingsImage from './images/field-settings.webp';
import publishImage from './images/publish.webp';
import welcomeImage from './images/welcome.webp';
import type { ReactNode } from 'react';

export interface GuidePage {
	image: ReactNode;
	content: ReactNode;
	/**
	 * The artwork's URL, alongside the rendered `image`. `Guide` ignores it,
	 * but it lets the guide preload every slide without a second list of
	 * sources that could fall out of step with the slides themselves.
	 */
	imageSrc: string;
}

/**
 * A slide's artwork.
 *
 * The illustrations restate what the adjacent heading and text already say,
 * so they carry an empty alt attribute rather than duplicating that copy for
 * screen readers.
 *
 * @param props     - Component props
 * @param props.src - Source of the illustration to render
 * @return The framed artwork.
 */
const Artwork = ( { src }: { src: string } ) => (
	<div className="jetpack-forms-welcome-guide__image">
		<img alt="" src={ src } />
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
			image: <Artwork src={ welcomeImage } />,
			imageSrc: welcomeImage,
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
			image: <Artwork src={ addFieldsImage } />,
			imageSrc: addFieldsImage,
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
			image: <Artwork src={ fieldSettingsImage } />,
			imageSrc: fieldSettingsImage,
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
			image: <Artwork src={ afterSubmitImage } />,
			imageSrc: afterSubmitImage,
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
			image: <Artwork src={ publishImage } />,
			imageSrc: publishImage,
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
