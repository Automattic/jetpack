import { __ } from '@wordpress/i18n';
import type { ElementType } from 'react';

type Props = {
	descriptionComponent?: ElementType;
	tableClassName?: string;
};

export default function GradeExplanation( {
	descriptionComponent: Description = 'p',
	tableClassName,
}: Props ) {
	return (
		<>
			<Description>
				{ __(
					"Your Overall Score is a summary of your first Cornerstone Page across both mobile and desktop devices. It gives a general idea of your site's overall performance.",
					'jetpack-boost'
				) }
			</Description>
			<table className={ tableClassName }>
				<tbody>
					<tr>
						<th>A</th>
						<td>90+</td>
					</tr>
					<tr>
						<th>B</th>
						<td>75 - 90</td>
					</tr>
					<tr>
						<th>C</th>
						<td>50 - 75</td>
					</tr>
				</tbody>
			</table>
			<table className={ tableClassName }>
				<tbody>
					<tr>
						<th>D</th>
						<td>35 - 50</td>
					</tr>
					<tr>
						<th>E</th>
						<td>25 - 35</td>
					</tr>
					<tr>
						<th>F</th>
						<td>0 - 25</td>
					</tr>
				</tbody>
			</table>
		</>
	);
}
