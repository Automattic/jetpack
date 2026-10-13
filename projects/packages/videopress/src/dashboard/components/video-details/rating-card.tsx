import { RadioControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, CollapsibleCard, Stack, Text } from '@wordpress/ui';
import type { VideoRating } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	value: VideoRating;
	onChange: ( next: VideoRating ) => void;
};

/**
 * Rating radio group. Single tab stop; arrow keys cycle G / PG-13 / R.
 *
 * Collapsible, and collapsed by default — the rating is set once and rarely
 * revisited, and the three descriptions make it the tallest card in a column
 * that was already outrunning the canvas beside it. The selected rating shows
 * in the header, so the collapsed state still answers "what is this rated?".
 *
 * @param props          - Component props.
 * @param props.value    - Currently selected rating.
 * @param props.onChange - Receives the new rating.
 * @return The card element.
 */
export default function RatingCard( { value, onChange }: Props ): ReactElement {
	return (
		<CollapsibleCard.Root>
			<CollapsibleCard.Header>
				<Stack direction="row" gap="sm" align="center" justify="space-between">
					<Card.Title>{ __( 'Rating', 'jetpack-videopress-pkg' ) }</Card.Title>
					<CollapsibleCard.HeaderDescription>
						<Text className="vp-video-details__summary">{ value }</Text>
					</CollapsibleCard.HeaderDescription>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<RadioControl
					selected={ value }
					onChange={ next => onChange( next as VideoRating ) }
					// `description` renders through the same `StyledHelp` that
					// `BaseControl` gives every `help` line, so the type matches the
					// toggle captions in Privacy & sharing. (Only the type — the
					// two controls set different margins around it.) Splitting the
					// rating off the sentence also stops a screen reader reading the
					// whole explanation as the option's name — it becomes an
					// `aria-describedby` instead.
					options={ [
						{
							label: __( 'G', 'jetpack-videopress-pkg' ),
							description: __(
								'Suitable for all audiences, including children.',
								'jetpack-videopress-pkg'
							),
							value: 'G',
						},
						{
							label: __( 'PG-13', 'jetpack-videopress-pkg' ),
							description: __(
								'May include mild language or mature themes.',
								'jetpack-videopress-pkg'
							),
							value: 'PG-13',
						},
						{
							label: __( 'R', 'jetpack-videopress-pkg' ),
							description: __(
								'May include strong language, violence, or adult content.',
								'jetpack-videopress-pkg'
							),
							value: 'R',
						},
					] }
				/>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}
