/* @jsxImportSource react */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import { SectionCard } from '../components';
import type { DiscussionSettings, NewsletterSettings } from '../types';
import type { JSX } from 'react';

/**
 * One line of the summary: what a setting does to the form, and whether it is on.
 *
 * @param props       - Props.
 * @param props.label - Setting.
 * @param props.on    - Whether it is on.
 * @return Line.
 */
function Summary( { label, on }: { label: string; on: boolean } ): JSX.Element {
	return (
		<li>
			{ createInterpolateElement(
				sprintf(
					/* translators: %1$s is a setting's name, %2$s is "On" or "Off". */
					__( '%1$s: <strong>%2$s</strong>', 'jetpack-comments' ),
					label,
					on ? __( 'On', 'jetpack-comments' ) : __( 'Off', 'jetpack-comments' )
				),
				{ strong: <strong /> }
			) }
		</li>
	);
}

/**
 * Settings other screens own that still change the form, so they are not a surprise in the preview.
 *
 * @param props            - Props.
 * @param props.discussion - Core's discussion settings.
 * @param props.newsletter - Newsletter's subscribe options.
 * @return Section.
 */
export function RelatedSection( {
	discussion,
	newsletter,
}: {
	discussion: DiscussionSettings;
	newsletter: NewsletterSettings;
} ): JSX.Element {
	return (
		<SectionCard
			title={ __( 'Set elsewhere', 'jetpack-comments' ) }
			description={ __(
				'These settings also change what readers see on the form.',
				'jetpack-comments'
			) }
		>
			<Stack direction="column" gap="md">
				<Text variant="heading-sm" render={ <h3 /> }>
					{ __( 'Discussion', 'jetpack-comments' ) }
				</Text>
				<ul className="jetpack-comments-settings__summary">
					<Summary
						label={ __( 'Commenters must fill out name and email', 'jetpack-comments' ) }
						on={ discussion.requireNameEmail }
					/>
					<Summary
						label={ __( 'Commenters must be registered and logged in', 'jetpack-comments' ) }
						on={ discussion.commentRegistration }
					/>
					<Summary
						label={ __( 'Show avatars', 'jetpack-comments' ) }
						on={ discussion.showAvatars }
					/>
				</ul>
				<Link href={ discussion.url }>
					{ __( 'Edit discussion settings', 'jetpack-comments' ) }
				</Link>
			</Stack>
			{ newsletter.active && (
				<Stack direction="column" gap="md">
					<Text variant="heading-sm" render={ <h3 /> }>
						{ __( 'Newsletter', 'jetpack-comments' ) }
					</Text>
					<ul className="jetpack-comments-settings__summary">
						<Summary
							label={ __( 'Offer a subscription to your site', 'jetpack-comments' ) }
							on={ newsletter.subscribeBlog }
						/>
						<Summary
							label={ __( 'Offer emails about new comments', 'jetpack-comments' ) }
							on={ newsletter.subscribeReplies }
						/>
					</ul>
					<Link href={ newsletter.url }>
						{ __( 'Edit subscription settings', 'jetpack-comments' ) }
					</Link>
				</Stack>
			) }
		</SectionCard>
	);
}
