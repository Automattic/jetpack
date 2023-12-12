import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { useState, useEffect } from 'react';
import BrokenDataRow from '../row-types/broken-data-row/broken-data-row';
import ImageMissingRow from '../row-types/image-missing-row/image-missing-row';
import ImageSizeRow from '../row-types/image-size-row/image-size-row';
import LoadingRow from '../row-types/loading-row/loading-row';
import Spinner from '$features/ui/spinner/spinner';
import actionLinkTemplateVar from '$lib/utils/action-link-template-var';
import type { ISA_Data } from '../../lib/stores/isa-data';
import { ISASummary, ISAStatus } from '../../lib/stores/isa-summary';
import styles from './table.module.scss';

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
	const [ activeFilter, setActiveFilter ] = useState( 'active' );

	useEffect( () => {
		setIsLoading( isaDataLoading );
		setActiveFilter( activeGroup === 'ignored' ? 'ignored' : 'active' );
		setJobFinished( isaSummary?.status === ISAStatus.Completed );
		setActiveImages( getActiveImages( images, isLoading ) );
	}, [ isaDataLoading, activeGroup, images, isaSummary, isLoading ] );

	const getActiveImages = ( _images: ISA_Data[], loading: boolean ) => {
		if ( loading ) {
			return [];
		}

		const filteredImages = _images.filter( image => image.status === activeFilter );
		if ( filteredImages.length === 0 && loading ) {
			return _images;
		}

		return filteredImages;
	};

	return (
		<div>
			<div className={ `${ styles.loadingSpinner } ${ isLoading ? styles.active : '' }` }>
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
								{
									refresh: (
										// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
										<span onClick={ () => refresh() } { ...actionLinkTemplateVar( 'refresh' ) } />
									),
								}
						  )
						: jobFinished
						? __( '🥳 No image size issues found!', 'jetpack-boost' )
						: __( 'No image size issues found yet…', 'jetpack-boost' ) }
				</h1>
			) : (
				<div className={ `${ styles.table } ${ isLoading ? styles.loading : '' }` }>
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
		</div>
	);
};

export default Table;
