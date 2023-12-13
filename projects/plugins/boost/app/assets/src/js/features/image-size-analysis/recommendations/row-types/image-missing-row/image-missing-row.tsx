import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import TableRow from '../table-row/table-row';
import TableRowHover from '../table-row-hover/table-row-hover';
import type { ImageDataType } from '../../../lib/stores/zod-types';
import Device from '$features/image-size-analysis/recommendations/ui/device/device';
import Pill from '$features/image-size-analysis/recommendations/ui/pill/pill';
import RowTitle from '$features/image-size-analysis/recommendations/ui/row-title/row-title';
import { removeGetParams } from '$lib/utils/remove-get-params';

interface ImageMissingRowProps {
	enableTransition: boolean;
	details: ImageDataType;
}

const ImageMissingRow: React.FC< ImageMissingRowProps > = ( { enableTransition, details } ) => {
	const title = details.image.url.split( '/' ).pop() || '';

	return (
		<TableRow enableTransition={ enableTransition } expandable={ false }>
			<div className="jb-thumbnail-image-missing">{ __( 'Image Missing', 'jetpack-boost' ) }</div>

			<div className="jb-table-row-title">
				<RowTitle title={ removeGetParams( title ) } url={ details.page.url } />
			</div>

			<div className="jb-table-row-potential-size">
				<Pill color="#facfd2">? KB</Pill>

				<div className="jb-arrow">→</div>

				<Pill color="#d0e6b8">? KB</Pill>
			</div>

			<div className="jb-table-row-hover-content">
				<TableRowHover
					edit_url={ details.page.edit_url }
					instructions={ createInterpolateElement(
						__(
							'This image does not appear to load. Please check the URL in the relevant page.',
							'jetpack-boost'
						),
						{}
					) }
				/>
			</div>

			<div className="jb-table-row-device">
				<Device device={ details.device_type } />
			</div>

			<div className="jb-table-row-page">
				<a href={ details.page.url }>{ details.page.title }</a>
			</div>
		</TableRow>
	);
};

export default ImageMissingRow;
