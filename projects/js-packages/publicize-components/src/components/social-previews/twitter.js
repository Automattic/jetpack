import { getRedirectUrl } from '@automattic/jetpack-components';
import { TwitterPreview } from '@automattic/social-previews';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { getTweetTemplate } from '../../store/selectors';

/**
 * The twitter tab component.
 *
 * @param {object} props - The props.
 * @param {boolean} props.isTweetStorm  - Whether it's a tweetstorm.
 * @param {object[]} props.tweets - The tweets.
 * @param {object} props.media - The media.
 * @returns {React.ReactNode} The twitter tab component.
 */
export function Twitter( { isTweetStorm, tweets, media } ) {
	const template = getTweetTemplate( { connections: [] } );

	const linkTweet = { ...tweets[ 0 ], ...template, text: '' };

	return (
		<div className="twitter-preview-tab">
			<section>
				<header>
					<h2>{ __( 'Your post', 'jetpack' ) }</h2>
					<p className="description">
						{ __( 'This is what your social post will look like on Twitter', 'jetpack' ) }
					</p>
				</header>
				<TwitterPreview isTweetStorm={ isTweetStorm } tweets={ tweets } media={ media } />
			</section>
			<section>
				<header>
					<h2>{ __( 'Link preview', 'jetpack' ) }</h2>
					<p className="description">
						{ createInterpolateElement(
							__(
								'This is what it will look like when someone shares the link to your WordPress post on Twitter. <LearnMoreLink>Learn more about links</LearnMoreLink>',
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
				<TwitterPreview tweets={ [ linkTweet ] } />
			</section>
		</div>
	);
}
