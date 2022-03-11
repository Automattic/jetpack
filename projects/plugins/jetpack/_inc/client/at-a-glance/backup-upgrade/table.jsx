/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

export const Table = ( { chart } ) => {
	const legendItems = chart?.legend?.legendItems || [];

	return (
		<table
			border="0"
			cellPadding="5"
			summary={ __( 'This is the text alternative for the canvas graphic.', 'jetpack' ) }
		>
			<caption>{ __( 'Items for Jetpack Backup', 'jetpack' ) }</caption>
			<tbody>
				<tr>
					<th scope="col">{ __( 'Backup item type', 'jetpack' ) }</th>
					{ legendItems.map( item => {
						const data = chart.data.datasets[ item.datasetIndex ];
						return (
							<th scope="col" key={ data.label }>
								{ data.label }
							</th>
						);
					} ) }
				</tr>
				<tr>
					<th scope="row">{ __( 'Item count', 'jetpack' ) }</th>
					{ legendItems.map( item => {
						const data = chart.data.datasets[ item.datasetIndex ];
						return <td key={ data.label }>{ data.data[ 0 ] }</td>;
					} ) }
				</tr>
			</tbody>
		</table>
	);
};
