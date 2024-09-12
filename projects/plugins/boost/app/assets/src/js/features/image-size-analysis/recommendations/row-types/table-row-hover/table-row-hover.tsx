import React from 'react';
import { __ } from '@wordpress/i18n';
import Button from '$features/image-size-analysis/button/button';
import { recordBoostEventAndRedirect } from '$lib/utils/analytics';
import { type IsaImage } from '$features/image-size-analysis';
import styles from './table-row-hover.module.scss';

// @REACT-TODO: Move this to a DataSync Store.
const __DEV_ENABLE_FIX_BUTTON = false;

interface TableRowHoverProps {
	imageId?: IsaImage[ 'id' ];
	edit_url?: string;
	instructions: string;
	device_type: string | null;
	isFixed?: boolean;
	toggleImageFix?: ( imageId: IsaImage[ 'id' ] ) => void;
}

const TableRowHover: React.FC< TableRowHoverProps > = ( {
	imageId,
	edit_url,
	instructions,
	device_type,
	isFixed,
	toggleImageFix,
} ) => {
	return (
		<div className={ styles.hover }>
			<p className={ styles.instruction }>{ instructions }</p>

			{ edit_url && (
				<div>
					{ __DEV_ENABLE_FIX_BUTTON && imageId && toggleImageFix && device_type === 'desktop' ? (
						<Button width="auto" fill onClick={ () => toggleImageFix( imageId ) }>
							{ isFixed ? __( 'Undo Fix', 'jetpack-boost' ) : __( 'Fix', 'jetpack-boost' ) }
						</Button>
					) : (
						<Button
							small
							fill
							onClick={ () =>
								recordBoostEventAndRedirect( edit_url, 'clicked_edit_page_on_isa_report', {
									device_type: device_type || 'unknown',
								} )
							}
						>
							{ __( 'Edit Page', 'jetpack-boost' ) }
						</Button>
					) }
				</div>
			) }
		</div>
	);
};

export default TableRowHover;
