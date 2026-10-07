import { useMemo } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { LIKES_ANCHOR } from '../anchors';
import { AutoSaveFields } from '../components/auto-save-fields';
import { booleanRadioEdit } from '../components/controls';
import { FeatureVariant } from '../components/feature-variant';
import { PlacementSummary } from '../components/placement-summary';
import { SectionCard } from '../components/section-card';
import { useStatus } from '../data/queries';
import { configures, type Settings } from '../types';
import type { Field } from '@wordpress/dataviews';
import type { JSX } from 'react';

/**
 * "On for all posts" or "Turned on per post", which Like buttons and Comment Likes both read.
 *
 * @param label - Field label, naming the feature being configured.
 * @return Field.
 */
export function sitewideLikesField( label: string ): Field< Settings > {
	return {
		id: 'likes_enabled',
		label,
		type: 'boolean',
		Edit: booleanRadioEdit(
			__( 'On for all posts', 'jetpack-sharing-likes' ),
			__( 'Turned on per post', 'jetpack-sharing-likes' )
		),
	};
}

/**
 * The Reblog button, WordPress.com Simple only; the route offers it nowhere else.
 *
 * @return Field.
 */
function reblogsField(): Field< Settings > {
	return {
		id: 'reblogs_enabled',
		label: __( 'WordPress.com Reblog Button', 'jetpack-sharing-likes' ),
		type: 'boolean',
		Edit: booleanRadioEdit(
			__( 'Show the Reblog button on posts', 'jetpack-sharing-likes' ),
			__( "Don't show the Reblog button on posts", 'jetpack-sharing-likes' )
		),
	};
}

/**
 * Like buttons.
 *
 * @return Section, or null before status is known.
 */
export function LikeButtonsSection(): JSX.Element | null {
	const status = useStatus();
	const fields = useMemo(
		() => [
			sitewideLikesField( __( 'WordPress.com Likes are', 'jetpack-sharing-likes' ) ),
			reblogsField(),
		],
		[]
	);

	if ( ! status ) {
		return null;
	}

	const title = _x( 'Like buttons', 'Settings header', 'jetpack-sharing-likes' );

	// The screen needs Simple, a connection or offline mode, so offline mode is the only way here.
	if ( ! status.likes.supported ) {
		return (
			<SectionCard id={ LIKES_ANCHOR } title={ title }>
				<Text render={ <p /> }>
					{ __(
						'Like buttons need a connection to WordPress.com, which is unavailable while your site is in offline mode.',
						'jetpack-sharing-likes'
					) }
				</Text>
			</SectionCard>
		);
	}

	const state = status.likes.state;

	return (
		<SectionCard id={ LIKES_ANCHOR } title={ title }>
			<FeatureVariant feature="likes" state={ state }>
				{ configures( state ) && (
					<>
						<PlacementSummary feature="likes" />
						<AutoSaveFields fields={ fields } />
					</>
				) }
			</FeatureVariant>
		</SectionCard>
	);
}
