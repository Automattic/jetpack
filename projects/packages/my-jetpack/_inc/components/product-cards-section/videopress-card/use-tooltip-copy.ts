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
					'You have %d video in your Media Library that could benefit from VideoPress. Start <a>hosting</a> it today to unlock multiple benefits: enhanced quality add-free streaming, faster load times, customizable player controls.',
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

	const viewsWithoutPlan = {
		title: __( 'High-quality video, wherever your audience is', 'jetpack-my-jetpack' ),
		text: __( 'Success! 🌟 Your video is live and gathering views.', 'jetpack-my-jetpack' ),
	};

	const viewsWithPlan = {
		title: __( '30-Day views', 'jetpack-my-jetpack' ),
		text: _n(
			'This metric represents the total number of views your video has received on our platform over the past 30 days.',
			'This metric represents the total number of views your videos have received on our platform over the past 30 days.',
			data.videoCount,
			'jetpack-my-jetpack'
		),
	};

	const watchTime = {
		title: __( '30-Day viewing time', 'jetpack-my-jetpack' ),
		text: __(
			'This metric shows total video viewing time for the last 30 days, comparing it with the performance of the previous 30 days.',
			'jetpack-my-jetpack'
		),
	};

	return {
		inactiveWithVideos,
		activeAndNoVideos,
		viewsWithoutPlan,
		viewsWithPlan,
		watchTime,
	};
};

export default useTooltipCopy;
