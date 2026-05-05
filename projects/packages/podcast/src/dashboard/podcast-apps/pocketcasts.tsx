/**
 * Pocket Casts directory entry.
 *
 * Carries a `step2Extra` slot reminding listeners to choose the Public option
 * during submission. When the one-click API submission lands, swap the
 * `Modal` field in to replace the default 3-step flow entirely.
 */

// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import { __experimentalText as Text } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { PodcastApp } from './types';

const PocketCastsLogo = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="40"
		height="40"
		viewBox="0 0 32 32"
		aria-hidden="true"
		focusable="false"
	>
		<circle cx="16" cy="15" r="15" fill="white" />
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			fill="#f43e37"
			d="M16 32c8.837 0 16-7.163 16-16S24.837 0 16 0 0 7.163 0 16s7.163 16 16 16Zm0-28.444C9.127 3.556 3.556 9.127 3.556 16c0 6.873 5.571 12.444 12.444 12.444v-3.11A9.333 9.333 0 1 1 25.333 16h3.111c0-6.874-5.571-12.445-12.444-12.445ZM8.533 16A7.467 7.467 0 0 0 16 23.467v-2.715A4.751 4.751 0 1 1 20.752 16h2.715a7.467 7.467 0 0 0-14.934 0Z"
		/>
	</svg>
);

export const pocketcasts: PodcastApp = {
	id: 'pocketcasts',
	name: 'Pocket Casts',
	Logo: PocketCastsLogo,
	submitUrl: 'https://pocketcasts.com/submit',
	learnMoreUrl: 'https://support.pocketcasts.com/knowledge-base/submitting-podcasts/',
	step2Extra: (
		<Text as="p" variant="muted">
			{ __(
				'Choose the Public option, since this feed is for your listeners.',
				'jetpack-podcast'
			) }
		</Text>
	),
};
