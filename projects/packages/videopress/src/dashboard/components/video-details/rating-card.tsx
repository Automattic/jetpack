import { RadioControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import type { VideoRating } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	value: VideoRating;
	onChange: ( next: VideoRating ) => void;
};

/**
 * Rating radio group. Single tab stop; arrow keys cycle G / PG-13 / R.
 *
 * @param props          - Component props.
 * @param props.value    - Currently selected rating.
 * @param props.onChange - Receives the new rating.
 * @return The card element.
 */
export default function RatingCard( { value, onChange }: Props ): ReactElement {
	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Rating', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<RadioControl
					selected={ value }
					onChange={ next => onChange( next as VideoRating ) }
					options={ [
						{
							label: __(
								'G — Suitable for all audiences, including children',
								'jetpack-videopress-pkg'
							),
							value: 'G',
						},
						{
							label: __(
								'PG-13 — May include mild language or mature themes',
								'jetpack-videopress-pkg'
							),
							value: 'PG-13',
						},
						{
							label: __(
								'R — May include strong language, violence, or adult content',
								'jetpack-videopress-pkg'
							),
							value: 'R',
						},
					] }
				/>
			</Card.Content>
		</Card.Root>
	);
}
