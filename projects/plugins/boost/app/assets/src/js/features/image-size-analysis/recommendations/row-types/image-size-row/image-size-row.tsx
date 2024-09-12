import React from 'react';
import TableRow from '../table-row/table-row';
import { type IsaImage } from '$features/image-size-analysis';
import Button from '../../../button/button';
import Device from '../../ui/device/device';
import Pill from '../../ui/pill/pill';
import RowTitle from '../../ui/row-title/row-title';
import Thumbnail from '../../ui/thumbnail/thumbnail';
import { __ } from '@wordpress/i18n';
import TableRowHover from '../table-row-hover/table-row-hover';
import { removeGetParams } from '$lib/utils/remove-get-params';
import { recordBoostEventAndRedirect } from '$lib/utils/analytics';
import styles from './image-size-row.module.scss';
import clsx from 'clsx';

interface ImageSizeRowProps {
	enableTransition: boolean;
	details: IsaImage;
	toggleImageFix: ( imageId: IsaImage[ 'id' ] ) => void;
}

const ImageSizeRow: React.FC< ImageSizeRowProps > = ( { details, toggleImageFix } ) => {
	const title = details.image.url.split( '/' ).pop();

	return (
		<TableRow expandedContent={ <Expanded details={ details } /> }>
			<TableRowContent title={ title } details={ details } toggleImageFix={ toggleImageFix } />
		</TableRow>
	);
};

export default ImageSizeRow;

interface ContentProps {
	title?: string;
	details: IsaImage;
	toggleImageFix: ( imageId: IsaImage[ 'id' ] ) => void;
}

function getPillColor( details: IsaImage ) {
	const potentialSavings = Math.max(
		0,
		Math.min( details.image.weight.current - 2, details.image.weight.potential )
	);
	const sizeDifference = ( potentialSavings / details.image.weight.current ) * 100;
	return sizeDifference <= 30 ? '#f5e5b3' : '#facfd2';
}

function getPotentialSize( details: IsaImage ) {
	const potentialSavings = Math.max(
		0,
		Math.min( details.image.weight.current - 2, details.image.weight.potential )
	);
	return potentialSavings > 0 ? Math.round( details.image.weight.current - potentialSavings ) : '?';
}

const TableRowContent: React.FC< ContentProps > = ( { title, details, toggleImageFix } ) => {
	const pillColor = getPillColor( details );
	const potentialSize = getPotentialSize( details );
	return (
		<>
			<div className={ styles.thumbnail }>
				<Thumbnail title={ title } url={ details.image.url } width={ 65 } height={ 65 } />
			</div>

			<div className="jb-table-row__title">
				<RowTitle
					title={ title ? removeGetParams( title ) : __( 'Untitled', 'jetpack-boost' ) }
					url={ details.page.url }
				/>
			</div>

			<div className={ styles[ 'potential-size' ] }>
				<Pill color={ pillColor }>{ Math.round( details.image.weight.current ) } KB</Pill>

				<div>→</div>

				<Pill color="#d0e6b8">{ potentialSize } KB</Pill>
			</div>

			<div className={ clsx( styles[ 'hover-content' ], 'jb-table-row__hover-content' ) }>
				<TableRowHover
					device_type={ details.device_type }
					edit_url={ details.page.edit_url }
					instructions={ details.instructions }
					imageId={ details.id }
					isFixed={ details.image.fixed }
					toggleImageFix={ toggleImageFix }
				/>
			</div>

			<div className={ clsx( styles.device, 'jb-table-row__device' ) }>
				<Device device={ details.device_type } />
			</div>

			<div className={ clsx( styles.page, 'jb-table-row__page' ) }>
				<a href={ details.page.url } className={ styles.link }>
					{ details.page.title }
				</a>
			</div>
		</>
	);
};

const Expanded: React.FC< { details: IsaImage } > = ( { details } ) => {
	const pillColor = getPillColor( details );
	const potentialSize = getPotentialSize( details );
	return (
		<>
			<div className={ clsx( styles[ 'expanded-info' ], styles[ 'mobile-only' ] ) }>
				<h4 className={ styles.header }>{ __( 'Potential Size', 'jetpack-boost' ) }</h4>
				<div className={ styles.pills }>
					<Pill color={ pillColor }>{ Math.round( details.image.weight.current ) } KB</Pill>
					<div>→</div>
					<Pill color="#d0e6b8">{ potentialSize } KB</Pill>
				</div>
			</div>

			<div className={ clsx( styles[ 'expanded-info' ], styles[ 'mobile-only' ] ) }>
				<h4 className={ styles.header }>{ __( 'Device', 'jetpack-boost' ) }</h4>
				<div className={ styles[ 'expanded-icon' ] }>
					<Device device={ details.device_type } />
				</div>
				<span>
					{ details.device_type === 'desktop'
						? __( 'This issue affects large screens', 'jetpack-boost' )
						: __( 'This issue affects small screens', 'jetpack-boost' ) }
				</span>
			</div>

			<div className={ clsx( styles[ 'expanded-info' ], styles[ 'image-details' ] ) }>
				<h4 className={ styles.header }>{ __( 'Image Details', 'jetpack-boost' ) }</h4>
				<div className={ styles.row }>
					<div>{ __( 'File Dimensions', 'jetpack-boost' ) }</div>
					<div className={ styles.value }>
						{ Math.round( details.image.dimensions.file.width ) }x
						{ Math.round( details.image.dimensions.file.height ) }
						px
					</div>
				</div>
				<div className={ styles.row }>
					<div>{ __( 'Expected Dimensions', 'jetpack-boost' ) }</div>
					<div className={ styles.value }>
						{ Math.round( details.image.dimensions.expected.width ) }x
						{ Math.round( details.image.dimensions.expected.height ) }
						px
					</div>
				</div>
				<div className={ styles.row }>
					<div>{ __( 'Size on screen', 'jetpack-boost' ) }</div>
					<div className={ styles.value }>
						{ Math.round( details.image.dimensions.size_on_screen.width ) }x
						{ Math.round( details.image.dimensions.size_on_screen.height ) }
						px
					</div>
				</div>
			</div>

			<div className={ clsx( styles[ 'expanded-info' ], styles[ 'fix-options' ] ) }>
				<h4 className={ styles.header }>{ __( 'How to fix', 'jetpack-boost' ) }</h4>
				<p>{ details.instructions }</p>
				{ details.page.edit_url && (
					<div className={ styles.actions }>
						<Button
							width="auto"
							fill
							onClick={ () => {
								recordBoostEventAndRedirect(
									details.page.edit_url!,
									'clicked_fix_on_page_on_isa_report',
									{ device_type: details.device_type }
								);
							} }
						>
							{ __( 'Fix on page', 'jetpack-boost' ) }
						</Button>
					</div>
				) }
			</div>
		</>
	);
};
