import { getDate, humanTimeDiff } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { PostShareStatus, ShareStatusItem } from '../../social-store/types';
import ConnectionIcon from '../connection-icon';
import { ShareStatusAction } from './share-status-action';
import { ShareStatusLabel } from './share-status-label';
import styles from './styles.module.scss';

const getItemId = ( item: ShareStatusItem ) => {
	return `${ item.external_id || item.connection_id }:${ item.timestamp }`;
};

type SharesDataViewProps = {
	postShareStatus: PostShareStatus;
};

/**
 * The component for the shares data view.
 *
 * @param {SharesDataViewProps} props - The component props.
 *
 * @return {import('react').ReactNode} - The shares data view component.
 */
export function SharesDataView( { postShareStatus }: SharesDataViewProps ) {
	return (
		<div className={ styles[ 'dataview-wrapper' ] }>
			<div className="dataviews-wrapper">
				<table className="dataviews-view-table">
					<thead>
						<tr className="dataviews-view-table__row">
							<th>{ __( 'Connection', 'jetpack-publicize-components' ) }</th>
							<th>{ __( 'Time', 'jetpack-publicize-components' ) }</th>
							<th>{ __( 'Status', 'jetpack-publicize-components' ) }</th>
							<th>{ __( 'Actions', 'jetpack-publicize-components' ) }</th>
						</tr>
					</thead>
					<tbody>
						{ postShareStatus.shares.map( item => (
							<tr key={ getItemId( item ) } className="dataviews-view-table__row">
								<td>
									<div className="dataviews-view-table__cell-content-wrapper">
										<div className={ styles[ 'connection-name' ] }>
											<ConnectionIcon
												serviceName={ item.service }
												label={ item.external_name }
												profilePicture={ item.profile_picture }
											/>
											<div className={ styles[ 'share-item-name-wrapper' ] }>
												<div className={ styles[ 'share-item-name' ] }>{ item.external_name }</div>
											</div>
										</div>
									</div>
								</td>
								<td>
									<div className="dataviews-view-table__cell-content-wrapper">
										{ humanTimeDiff(
											// @ts-expect-error - humanTimeDiff is incorrectly typed, first argument can be a timestamp
											item.timestamp * 1000,
											getDate( null )
										) }
									</div>
								</td>
								<td>
									<div className="dataviews-view-table__cell-content-wrapper">
										<ShareStatusLabel status={ item.status } message={ item.message } />
									</div>
								</td>
								<td>
									<div className="dataviews-view-table__cell-content-wrapper">
										<ShareStatusAction shareItem={ item } />
									</div>
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
		</div>
	);
}
