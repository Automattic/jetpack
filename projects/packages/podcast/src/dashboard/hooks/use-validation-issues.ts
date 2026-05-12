// Submission readiness for podcast directories. Pure helper for the Settings
// draft; hook variant adds cover-media + episode-presence checks for the
// Distribution Submit gate.

import { useEntityRecord, useEntityRecords } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { usePodcastSettings } from './use-podcast-settings';
import type { PodcastSettings } from '../types';

interface CoverImageRecord {
	media_details?: { width?: number; height?: number };
	mime_type?: string;
}

/**
 * Pure rule check; returns user-facing issue strings in stable order.
 *
 * @param settings - Settings to validate, or undefined for "not loaded yet".
 * @return          Empty array when settings are missing or all rules pass.
 */
export const getValidationIssues = ( settings: PodcastSettings | undefined ): string[] => {
	if ( ! settings ) {
		return [];
	}
	const issues: string[] = [];
	if ( ! settings.podcasting_category_id ) {
		issues.push( __( 'Choose a category to use as your podcast feed.', 'jetpack-podcast' ) );
	}
	if ( ! settings.podcasting_title ) {
		issues.push( __( 'Add a podcast title.', 'jetpack-podcast' ) );
	}
	if ( ! settings.podcasting_summary ) {
		issues.push(
			__( 'Write a short summary so listeners know what your show is about.', 'jetpack-podcast' )
		);
	}
	if ( ! settings.podcasting_talent_name ) {
		issues.push( __( 'Set the host or talent name.', 'jetpack-podcast' ) );
	}
	if ( ! settings.podcasting_email ) {
		issues.push(
			__( 'Add an owner email so podcast directories can reach you.', 'jetpack-podcast' )
		);
	}
	if ( ! settings.podcasting_category_1 ) {
		issues.push( __( 'Pick at least one Apple Podcasts category.', 'jetpack-podcast' ) );
	}
	if ( ! settings.podcasting_image ) {
		issues.push( __( 'Upload a cover image (1400×1400 to 3000×3000 pixels).', 'jetpack-podcast' ) );
	}
	return issues;
};

/**
 * `getValidationIssues` plus cover MIME/dimension/square + episode-presence.
 *
 * @param settings            - Saved settings, or undefined for "not loaded".
 * @param cover               - Cover image media record, or undefined.
 * @param hasPublishedEpisode - True/false when the probe resolves; undefined while in flight.
 * @return                      Issue strings in stable order.
 */
const getDistributionIssues = (
	settings: PodcastSettings | undefined,
	cover: CoverImageRecord | undefined,
	hasPublishedEpisode: boolean | undefined
): string[] => {
	const issues = getValidationIssues( settings );
	if ( ! settings ) {
		return issues;
	}
	if ( settings.podcasting_category_id > 0 && hasPublishedEpisode === false ) {
		issues.push( __( 'Publish at least one episode.', 'jetpack-podcast' ) );
	}
	if ( settings.podcasting_image_id > 0 && cover ) {
		const width = cover.media_details?.width;
		const height = cover.media_details?.height;
		const mime = cover.mime_type;
		if ( mime && mime !== 'image/png' && mime !== 'image/jpeg' ) {
			issues.push( __( 'Cover image must be a PNG or JPG.', 'jetpack-podcast' ) );
		}
		if ( width && height && width !== height ) {
			issues.push( __( 'Cover image must be square.', 'jetpack-podcast' ) );
		}
		if ( width && ( width < 1400 || width > 3000 ) ) {
			issues.push(
				__( 'Cover image must be between 1400×1400 and 3000×3000 pixels.', 'jetpack-podcast' )
			);
		}
	}
	return issues;
};

/**
 * Distribution Submit gate. Reads cover media + an episode probe alongside
 * saved settings; both subqueries are `enabled`-gated.
 *
 * @return `{ issues, isReady, isLoading }` — issues suppressed during load.
 */
export function useValidationIssues() {
	const { data: settings, isLoading: settingsLoading } = usePodcastSettings();

	const coverImageId = settings?.podcasting_image_id ?? 0;
	const { record: cover, hasResolved: coverResolved } = useEntityRecord< CoverImageRecord >(
		'postType',
		'attachment',
		coverImageId,
		{ enabled: coverImageId > 0 }
	);

	const categoryId = settings?.podcasting_category_id ?? 0;
	const { records: episodeProbe, hasResolved: episodeProbeResolved } = useEntityRecords< {
		id: number;
	} >(
		'postType',
		'post',
		{ categories: categoryId, per_page: 1, status: 'publish', _fields: 'id' },
		{ enabled: categoryId > 0 }
	);

	const hasPublishedEpisode: boolean | undefined =
		categoryId > 0 && episodeProbeResolved
			? Array.isArray( episodeProbe ) && episodeProbe.length > 0
			: undefined;

	const isLoading =
		settingsLoading ||
		( categoryId > 0 && ! episodeProbeResolved ) ||
		( coverImageId > 0 && ! coverResolved );

	const issues = isLoading
		? []
		: getDistributionIssues( settings, cover ?? undefined, hasPublishedEpisode );

	return {
		issues,
		isReady: ! isLoading && issues.length === 0,
		isLoading,
	};
}
