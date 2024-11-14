import { __ } from '@wordpress/i18n';
import {
	Hero,
	ISAStatus,
	Pagination,
	Table,
	Tabs,
	getGroupedReports,
	useIsaData,
	useIsaReport,
} from '$features/image-size-analysis';
import Footer from '$layout/footer/footer';
import Header from '$layout/header/header';
import { isaGroupKeys } from '$features/image-size-analysis/lib/isa-groups';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import styles from './image-size-analysis.module.scss';
import clsx from 'clsx';

type Props = {
	isImageCdnModuleActive: boolean;
	page: number;
	group: isaGroupKeys;
};

const ImageSizeAnalysis = ( { page, group, isImageCdnModuleActive }: Props ) => {
	const [ isaData ] = useIsaData( page, group );
	const [ isaReport ] = useIsaReport();
	const navigate = useNavigate();

	const groupedReports = isaReport.data ? getGroupedReports( isaReport.data ) : undefined;
	const activeGroupName = group as keyof typeof groupedReports;
	const activeReport =
		groupedReports && activeGroupName ? groupedReports[ activeGroupName ] : undefined;

	// isaReport will automatically refetch while the report is being generated.
	// This effect will refresh isaData every time the report is refetched.
	useEffect( () => {
		if ( isaReport.data?.status === ISAStatus.Queued ) {
			isaData.refetch();
		}
	}, [ isaReport.data, isaData ] );

	return (
		<div id="jb-dashboard" className="jb-dashboard">
			<Header subPageTitle={ __( 'Image analysis report', 'jetpack-boost' ) } />
			<div className={ clsx( styles.page, 'jb-section--alt' ) }>
				<div className="jb-container">
					<Hero
						group={ activeReport }
						isUpdateInProgress={ isaReport?.data?.status === ISAStatus.Queued }
						isImageCdnModuleActive={ isImageCdnModuleActive }
						isaLastUpdated={ isaData.data?.last_updated || 0 }
					/>
					<Tabs
						currentTab={ activeReport }
						activeGroupKey={ group }
						imageDataGroupTabs={ groupedReports }
						setActiveTab={ groupName => {
							navigate( `/image-size-analysis/${ groupName }/1` );
						} }
					/>
				</div>

				<div className={ styles[ 'table-wrap' ] }>
					<Table
						isaDataLoading={ isaData.isLoading }
						images={ isaData.data?.images || [] }
						isaReport={ isaReport.data || undefined }
					/>
				</div>

				<div className="jb-container">
					<Pagination group={ group } current={ page } total={ isaData.data?.total_pages || 1 } />
					<Footer />
				</div>
			</div>
		</div>
	);
};

export default ImageSizeAnalysis;
