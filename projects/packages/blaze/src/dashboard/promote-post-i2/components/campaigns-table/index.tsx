import { __ } from '@wordpress/i18n';
import { Campaign } from '../../../data/promote-post/types';
import CampaignItem from '../campaign-item';
import './style.scss';

interface Props {
	campaigns: Campaign[];
	isLoading: boolean;
	isFetchingPageResults: boolean;
	isWooStore: boolean;
}

export const SingleItemLoading = ( { totalRows = 8 }: { totalRows?: number } ) => {
	return (
		<tr>
			<td>
				<div className="promote-post-i2__campaign-item-wrapper">
					<div className="campaign-item__header-image-skeleton"></div>
					<div>
						<div className="campaign-item__skeleton-text" />
						<div className="campaign-item__skeleton-text campaign-item__skeleton-text2" />
					</div>
				</div>
			</td>
			{ [ ...Array( totalRows - 1 ) ].map( ( e, i ) => (
				<td key={ i }></td>
			) ) }
		</tr>
	);
};

export const ItemsLoading = ( { totalRows = 8 }: { totalRows?: number } ) => {
	const rowsNumber = 5;
	return (
		<>
			{ new Array( rowsNumber ).fill( 0, 0, rowsNumber ).map( ( _, key ) => (
				<SingleItemLoading totalRows={ totalRows } key={ key } />
			) ) }
		</>
	);
};

/**
 *
 * @param props
 */
export default function CampaignsTable( props: Props ) {
	const { campaigns, isLoading, isFetchingPageResults, isWooStore } = props;

	type CampaignColumn = {
		key: string;
		title: string;
	};

	const getHeaderColumns = (): CampaignColumn[] => {
		const columns: CampaignColumn[] = [
			{
				key: 'data',
				title: __( 'Campaign', 'jetpack-blaze' ),
			},
			{
				key: 'status',
				title: __( 'Status', 'jetpack-blaze' ),
			},
			{
				key: 'ends',
				title: __( 'Ends', 'jetpack-blaze' ),
			},
			{
				key: 'spend',
				title: __( 'Spend', 'jetpack-blaze' ),
			},
			{
				key: 'clicks',
				title: __( 'Clicks', 'jetpack-blaze' ),
			},
		];

		if ( isWooStore ) {
			columns.push( {
				key: 'conversion',
				title: __( 'Conversion rate', 'jetpack-blaze' ),
			} );
		}

		columns.push( {
			key: 'action',
			title: '',
		} );

		return columns;
	};

	return (
		<div className="promote-post-i2__table campaigns-list__table">
			<table>
				<thead>
					<tr>
						{ getHeaderColumns().map( ( item, key ) => (
							<th className={ `campaign-item__${ item.key }` } key={ key }>
								{ item.title }
							</th>
						) ) }
					</tr>
				</thead>
				<tbody>
					{ isLoading && ! isFetchingPageResults ? (
						<ItemsLoading totalRows={ 6 } />
					) : (
						<>
							{ campaigns.map( campaign => {
								return (
									<CampaignItem
										key={ `campaign-id${ campaign.campaign_id }` }
										campaign={ campaign }
									/>
								);
							} ) }
							{ isFetchingPageResults && <SingleItemLoading totalRows={ 6 } /> }
						</>
					) }
				</tbody>
			</table>
		</div>
	);
}
