import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { PLACEMENT_ANCHOR } from '../anchors';
import { AutoSaveFields } from '../components/auto-save-fields';
import { CheckboxGroupEdit } from '../components/controls';
import { SectionCard } from '../components/section-card';
import { useStatus } from '../data/queries';
import { placementHeading } from '../placement';
import { getPlacementChoices } from '../script-data';
import type { Settings } from '../types';
import type { Field } from '@wordpress/dataviews';
import type { JSX } from 'react';

/**
 * Where sharing buttons, Like buttons and Comment Likes appear. Rendered only when `status.placement` holds.
 *
 * @return Section, or null before status is known.
 */
export function PlacementSection(): JSX.Element | null {
	const status = useStatus();
	const heading = status ? placementHeading( status ) : '';
	const fields = useMemo< Field< Settings >[] >(
		() => [
			{
				id: 'show',
				label: heading,
				type: 'array',
				elements: getPlacementChoices(),
				Edit: CheckboxGroupEdit,
			},
		],
		[ heading ]
	);

	if ( ! status ) {
		return null;
	}

	return (
		<SectionCard
			id={ PLACEMENT_ANCHOR }
			title={ heading }
			description={ __(
				'These choices apply to every feature named in the heading.',
				'jetpack-sharing-likes'
			) }
		>
			<AutoSaveFields fields={ fields } />
		</SectionCard>
	);
}
