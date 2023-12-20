import { __ } from '@wordpress/i18n';
import {
	Hero,
	Pagination,
	Table,
	Tabs,
	getGroupedReports,
	useIsaData,
	useIsaReport,
} from '$features/image-size-analysis';
import Footer from '../../layout/footer/footer';
import Header from '../../layout/header/header';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import { useState } from 'react';
import { isaGroupKeys } from '$features/image-size-analysis/lib/isa-groups';

const _ImageSizeAnalysis = ( { isImageCdnModuleActive }: { isImageCdnModuleActive: boolean } ) => {
	const [ page, setPage ] = useState( 1 );
	const [ group, setGroup ] = useState< isaGroupKeys >( 'all' );
	const [ isaData ] = useIsaData( page, group );
	const [ isaReport ] = useIsaReport();
	const dataGroupTabs = isaReport.data ? getGroupedReports( isaReport.data ) : undefined;
	const activeGroupName = group as keyof typeof dataGroupTabs;
	const activeReport =
		dataGroupTabs && activeGroupName ? dataGroupTabs[ activeGroupName ] : undefined;
	return (
		<div id="jb-dashboard" className="jb-dashboard">
			<Header subPageTitle={ __( 'Image analysis report', 'jetpack-boost' ) } />
			<div className="jb-recommendations-page jb-section--alt">
				<div className="jb-container">
					<Hero
						isImageCdnModuleActive={ isImageCdnModuleActive }
						isaLastUpdated={ isaData.data?.last_updated || 0 }
						group={ activeReport }
					/>
					<Tabs
						currentTab={ activeReport }
						activeGroupKey={ group }
						imageDataGroupTabs={ dataGroupTabs }
						setActiveTab={ groupName => {
							setGroup( groupName );
							setPage( 1 );
						} }
					/>
				</div>

				<div className="jb-table-wrap">
					<Table
						isaDataLoading={ isaData.isLoading }
						activeGroup={ group }
						images={ isaData.data?.images || [] }
						isaReport={ isaReport.data || undefined }
					/>
				</div>

				<div className="jb-container">
					<Pagination
						setCurrentPage={ setPage }
						group={ group }
						current={ page }
						total={ isaData.data?.total_pages || 1 }
					/>
					<Footer />
				</div>
			</div>
		</div>
	);
};

const ImageSizeAnalysis = ( { isImageCdnModuleActive }: { isImageCdnModuleActive: boolean } ) => {
	return (
		<DataSyncProvider>
			<_ImageSizeAnalysis isImageCdnModuleActive={ isImageCdnModuleActive } />
		</DataSyncProvider>
	);
};
export default ImageSizeAnalysis;
