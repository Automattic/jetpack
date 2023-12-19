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
import { useEffect } from 'react';

const _ImageSizeAnalysis = ( { isImageCdnModuleActive }: { isImageCdnModuleActive: boolean } ) => {
	const [ isaData, updateIsaData ] = useIsaData();
	const [ isaReport ] = useIsaReport();
	const dataGroupTabs = isaReport.data ? getGroupedReports( isaReport.data ) : undefined;
	const activeGroupName = isaData.data?.query.group as keyof typeof dataGroupTabs;
	const activeReport =
		dataGroupTabs && activeGroupName ? dataGroupTabs[ activeGroupName ] : undefined;

	// @TODO:
	// Figure out a way to navigate using DataSync.
	useEffect( () => {
		const timer = setTimeout( () => {
			const data = {
				data: isaData.data?.data,
				query: {
					...isaData.data?.query,
					group: 'pages',
				},
			};
			updateIsaData.mutate( data );
		}, 3000 );
		return () => clearTimeout( timer );
	}, [] );
	return (
		<div id="jb-dashboard" className="jb-dashboard">
			<Header subPageTitle={ __( 'Image analysis report', 'jetpack-boost' ) } />
			<div className="jb-recommendations-page jb-section--alt">
				<div className="jb-container">
					<Hero
						isImageCdnModuleActive={ isImageCdnModuleActive }
						isaLastUpdated={ isaData.data?.data.last_updated || 0 }
						group={ activeReport }
					/>
					<Tabs
						currentTab={ activeReport }
						activeGroupKey={ isaData.data?.query.group }
						imageDataGroupTabs={ dataGroupTabs }
					/>
				</div>

				<div className="jb-table-wrap">
					<Table
						isaDataLoading={ isaData.isLoading }
						activeGroup={ isaData.data?.query.group }
						images={ isaData.data?.data.images || [] }
						isaReport={ isaReport.data || undefined }
					/>
				</div>

				<div className="jb-container">
					<Pagination
						group={ isaData.data?.query.group || 'all' }
						current={ isaData.data?.query.page || 1 }
						total={ isaData.data?.data.total_pages || 1 }
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
