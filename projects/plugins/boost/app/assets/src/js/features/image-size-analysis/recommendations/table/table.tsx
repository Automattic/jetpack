import type React from 'react';
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { useState, useEffect } from 'react';
import BrokenDataRow from '../row-types/broken-data-row/broken-data-row';
import ImageMissingRow from '../row-types/image-missing-row/image-missing-row';
import ImageSizeRow from '../row-types/image-size-row/image-size-row';
import LoadingRow from '../row-types/loading-row/loading-row';
import Spinner from '$features/ui/spinner/spinner';
import type { ISA_Data } from '../../lib/stores/isa-data';
import { ISASummary, ISAStatus } from '../../lib/stores/isa-summary';
import actionLinkInterpolateVar from '$lib/utils/action-link-interpolate-var';
import classnames from 'classnames';
interface TableProps {
	needsRefresh: boolean;
	refresh: () => Promise< void >;
	isaDataLoading: boolean;
	activeGroup: string;
	images: ISA_Data[];
	isaSummary: ISASummary | null;
}

const Table: React.FC< TableProps > = ( {
	needsRefresh,
	refresh,
	isaDataLoading,
	activeGroup,
	images,
	isaSummary,
} ) => {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ activeImages, setActiveImages ] = useState< ISA_Data[] >( [] );
	const [ jobFinished, setJobFinished ] = useState( false );

	useEffect( () => {
		setIsLoading( isaDataLoading );
		setJobFinished( isaSummary?.status === ISAStatus.Completed );
		setActiveImages( images );
	}, [ isaDataLoading, activeGroup, images, isaSummary ] );

	return (
		<>
			<div className={ classnames( 'jb-loading-spinner', { 'jb-active': isLoading } ) }>
				<Spinner size="3rem" lineWidth="4px" />
			</div>

			{ ! isLoading && activeImages.length === 0 ? (
				<h1>
					{ needsRefresh
						? createInterpolateElement(
								__(
									'<refresh>Refresh</refresh> to see the latest recommendations.',
									'jetpack-boost'
								),
								actionLinkInterpolateVar( refresh, 'refresh' )
						  )
						: jobFinished
						? __( '🥳 No image size issues found!', 'jetpack-boost' )
						: __( 'No image size issues found yet…', 'jetpack-boost' ) }
				</h1>
			) : (
				<div className={ classnames( 'jb-table', { 'jb-loading': isLoading } ) }>
					<div className="jb-table-header jb-recommendation-page-grid">
						<div className="jb-table-header__image">Image</div>
						<div className="jb-table-header__potential-size">Potential Size</div>
						<div className="jb-table-header__device">Device</div>
						<div className="jb-table-header__page">Page/Post</div>
					</div>

					{ isLoading
						? [ ...Array( 10 ) ].map( ( _, i ) => <LoadingRow key={ i } /> )
						: activeImages.map( image =>
								image.type === 'image_size' ? (
									<ImageSizeRow
										key={ image.id }
										enableTransition={ images.length > 0 }
										details={ image }
									/>
								) : image.type === 'image_missing' ? (
									<ImageMissingRow
										key={ image.id }
										enableTransition={ images.length > 0 }
										details={ image }
									/>
								) : (
									<BrokenDataRow key={ image.id } />
								)
						  ) }
				</div>
			) }
		</>
	);
};

export default Table;
