import { __ } from '@wordpress/i18n';
import type { ElementType, ReactNode } from 'react';

type Props = {
	description: ReactNode;
	descriptionComponent: ElementType;
	tableClassName: string;
};

export default function GradeExplanation( {
	description,
	descriptionComponent: Description,
	tableClassName,
}: Props ) {
	return (
		<>
			<Description>{ description }</Description>
			<table className={ tableClassName }>
				<tbody>
					<tr>
						<th>A</th>
						<td>{ __( 'Over 90', 'jetpack-boost' ) }</td>
					</tr>
					<tr>
						<th>B</th>
						<td>{ __( 'Over 75 to 90', 'jetpack-boost' ) }</td>
					</tr>
					<tr>
						<th>C</th>
						<td>{ __( 'Over 50 to 75', 'jetpack-boost' ) }</td>
					</tr>
				</tbody>
			</table>
			<table className={ tableClassName }>
				<tbody>
					<tr>
						<th>D</th>
						<td>{ __( 'Over 35 to 50', 'jetpack-boost' ) }</td>
					</tr>
					<tr>
						<th>E</th>
						<td>{ __( 'Over 25 to 35', 'jetpack-boost' ) }</td>
					</tr>
					<tr>
						<th>F</th>
						<td>{ __( '25 or below', 'jetpack-boost' ) }</td>
					</tr>
				</tbody>
			</table>
		</>
	);
}
