import { __ } from '@wordpress/i18n';
import TableRow from '../table-row/table-row';
import { type IsaImage } from '$features/image-size-analysis';
import Device from '$features/image-size-analysis/recommendations/ui/device/device';
import Pill from '$features/image-size-analysis/recommendations/ui/pill/pill';
import RowTitle from '$features/image-size-analysis/recommendations/ui/row-title/row-title';
import { removeGetParams } from '$lib/utils/remove-get-params';
import TableRowHover from '../table-row-hover/table-row-hover';
import rowStyles from '../../row.module.scss';
interface ImageMissingRowProps {
	enableTransition: boolean;
	details: IsaImage;
}

const ImageMissingRow: React.FC< ImageMissingRowProps > = ( { details } ) => {
	const title = details.image.url.split( '/' ).pop() || '';

	return (
		<TableRow>
			<div>{ __( 'Image Missing', 'jetpack-boost' ) }</div>

			<div className={ rowStyles[ 'table-row-title' ] }>
				<RowTitle title={ removeGetParams( title ) } url={ details.page.url } />
			</div>

			<div>
				<Pill color="#facfd2">? KB</Pill>

				<div>→</div>

				<Pill color="#d0e6b8">? KB</Pill>
			</div>

			<div>
				<TableRowHover
					edit_url={ details.page.edit_url || undefined }
					device_type={ null }
					instructions={ __(
						'This image does not appear to load. Please check the URL in the relevant page.',
						'jetpack-boost'
					) }
				/>
			</div>

			<div>
				<Device device={ details.device_type } />
			</div>

			<div>
				<a href={ details.page.url }>{ details.page.title }</a>
			</div>
		</TableRow>
	);
};

export default ImageMissingRow;
