import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { createElement, useCallback } from 'react';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';

const useTooltipCopy = () => {
	const { recordEvent } = useAnalytics();
	const { videopress: data } = getMyJetpackWindowInitialState();
	const hostingRedirectLink = getRedirectUrl( 'jetpack-videopress-my-jetpack-tooltip' );

	const recordHostingLinkClick = useCallback( () => {
		recordEvent( 'jetpack_videopress_card_tooltip_content_link_click', {
			location: 'video_count',
			feature: 'jetpack-videopress',
			page: 'my-jetpack',
			path: hostingRedirectLink,
		} );
	}, [ recordEvent, hostingRedirectLink ] );

	const inactiveWithVideos = {
		title: __( 'The finest video for WordPress', 'jetpack-my-jetpack' ),
		text: createInterpolateElement(
			sprintf(
				// translators: %d is the number of videos in the Media Library that could benefit from VideoPress.
				_n(
					'You have %d video in your Media Library that could benefit from VideoPress. Start <a>hosting</a> them today to unlock multiple benefits: enhanced quality add-free streaming, faster load times, customizable player controls.',
					'You have %d videos in your Media Library that could benefit from VideoPress. Start <a>hosting</a> them today to unlock multiple benefits: enhanced quality add-free streaming, faster load times, customizable player controls.',
					data?.videoCount,
					'jetpack-my-jetpack'
				),
				data?.videoCount
			),
			{
				a: createElement( 'a', {
					href: hostingRedirectLink,
					target: '_blank',
					rel: 'noreferrer noopener',
					onClick: recordHostingLinkClick,
				} ),
			}
		),
	};

	const activeAndNoVideos = {
		title: __( 'The finest video for WordPress', 'jetpack-my-jetpack' ),
		text: __(
			'Give your videos a boost! 🚀 Try hosting with VideoPress for superior quality and performance.',
			'jetpack-my-jetpack'
		),
	};

	return {
		inactiveWithVideos,
		activeAndNoVideos,
	};
};

export default useTooltipCopy;
