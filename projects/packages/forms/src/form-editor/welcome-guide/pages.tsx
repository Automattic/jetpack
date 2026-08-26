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
}

/**
 * Every slide's artwork, in order.
 *
 * Exported so the guide can warm all of them the moment it opens without
 * building the slides themselves, which would translate every string only to
 * throw the result away.
 */
export const WELCOME_GUIDE_IMAGES = [
	welcomeImage,
	addFieldsImage,
	fieldSettingsImage,
	afterSubmitImage,
	publishImage,
];

/**
 * Builds the welcome guide pages.
 *
 * Called at render time rather than defined as a module constant so the
 * strings are translated after the locale data has loaded.
 *
 * The illustrations restate what the adjacent heading and text already say, so
 * they carry an empty alt attribute rather than repeating that copy for screen
 * readers.
 *
 * @return The guide pages, in order.
 */
export function getWelcomeGuidePages(): GuidePage[] {
	const slides = [
		{
			heading: __( 'Welcome to the form editor', 'jetpack-forms' ),
			text: __(
				'You’re building a reusable form. Create it once here, then add it to any page or post on your site.',
				'jetpack-forms'
			),
		},
		{
			heading: __( 'Add fields', 'jetpack-forms' ),
			text: __(
				'Start from a template like Contact, RSVP, or Registration, then add extra fields from the inserter. Everything you add lands inside the form automatically.',
				'jetpack-forms'
			),
		},
		{
			heading: __( 'Make each field yours', 'jetpack-forms' ),
			text: __(
				'Select any field to change its label, add placeholder text, or make it required. Field settings live in the sidebar on the right.',
				'jetpack-forms'
			),
		},
		{
			heading: __( 'Decide what happens after submit', 'jetpack-forms' ),
			text: __(
				'Select the form itself to set what happens when someone submits: show a message or redirect, send email and push notifications, and connect your integrations.',
				'jetpack-forms'
			),
		},
		{
			heading: __( 'Publish and share it', 'jetpack-forms' ),
			text: __(
				'When you publish, add the form to a new or existing page, or copy the embed code. Responses land in your inbox. Open it anytime with “View responses”.',
				'jetpack-forms'
			),
		},
	];

	return slides.map( ( { heading, text }, index ) => ( {
		image: (
			<div className="jetpack-forms-welcome-guide__image">
				<img alt="" src={ WELCOME_GUIDE_IMAGES[ index ] } />
			</div>
		),
		content: (
			<>
				<h1 className="jetpack-forms-welcome-guide__heading">{ heading }</h1>
				<p className="jetpack-forms-welcome-guide__text">{ text }</p>
			</>
		),
	} ) );
}
