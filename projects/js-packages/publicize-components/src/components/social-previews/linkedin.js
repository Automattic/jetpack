import { getRedirectUrl } from '@automattic/jetpack-components';
import { LinkedInPreview } from '@automattic/social-previews';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { getLinkedInDetails } from '../../store/selectors';

/**
 * The linkedin tab component.
 *
 * @param {object} props - The props.
 * @returns {React.ReactNode} The linkedin tab component.
 */
export function LinkedIn( props ) {
	const { title, url, image } = props;

	const { name, profileImage } = getLinkedInDetails();

	const { message: text } = useSocialMediaMessage();

	return (
		<div className="linked-preview-tab">
			<section>
				<header>
					<h2>{ __( 'Your post', 'jetpack' ) }</h2>
					<p className="description">
						{ __( 'This is what your social post will look like on LinkedIn', 'jetpack' ) }
					</p>
				</header>
				<LinkedInPreview
					jobTitle="Job Title (Company Name)"
					image={ image }
					name={ name }
					profileImage={ profileImage }
					title={ title }
					text={ text }
					url={ url }
				/>
			</section>
			<section>
				<header>
					<h2>{ __( 'Link preview', 'jetpack' ) }</h2>
					<p className="description">
						{ createInterpolateElement(
							__(
								'This is what it will look like when someone shares the link to your WordPress post on LinkedIn. <LearnMoreLink>Learn more about links</LearnMoreLink>',
								'jetpack'
							),
							{
								LearnMoreLink: (
									<a
										href={ getRedirectUrl( 'jetpack-social-image-generator' ) }
										rel="noopener noreferrer"
										target="_blank"
									/>
								),
							}
						) }
					</p>
				</header>
				<LinkedInPreview
					jobTitle="Job Title (Company Name)"
					image={ image }
					title={ title }
					url={ url }
					{ ...getLinkedInDetails( { forceDefaults: true } ) }
				/>
			</section>
		</div>
	);
}
