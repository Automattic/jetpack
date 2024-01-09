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
import { isaGroupKeys } from '$features/image-size-analysis/lib/isa-groups';
import { useNavigate } from 'react-router-dom';

type Props = {
	isImageCdnModuleActive: boolean;
	page: number;
	group: isaGroupKeys;
};

const ImageSizeAnalysis = ( { page, group, isImageCdnModuleActive }: Props ) => {
	const [ isaData ] = useIsaData( page, group );
	const [ isaReport ] = useIsaReport();
	const navigate = useNavigate();
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
							navigate( `/image-size-analysis/${ groupName }/1` );
						} }
					/>
				</div>

				<div className="jb-table-wrap">
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
