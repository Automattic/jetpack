/**
 * External dependencies
 */
import { Button, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { grid, formatListBullets } from '@wordpress/icons';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
/**
 *
 */
import useVideos from '../../hooks/use-videos';
import { SearchInput } from '../input';
import Pagination from '../pagination';
import { PaginationProps } from '../pagination/types';
import { FilterButton, FilterSection } from '../video-filter';
import VideoGrid from '../video-grid';
import VideoList from '../video-list';
import styles from './styles.module.scss';
/**
 * Types
 */
import { VideoLibraryProps } from './types';

const LibraryType = {
	List: 'list',
	Grid: 'grid',
} as const;

type LibraryType = typeof LibraryType[ keyof typeof LibraryType ];

const ConnectedPagination: React.FC< PaginationProps > = props => {
	const { setPage, page, itemsPerPage, total } = useVideos();
	return (
		<Pagination
			{ ...props }
			perPage={ itemsPerPage }
			onChangePage={ setPage }
			currentPage={ page }
			total={ total }
		/>
	);
};

const VideoLibraryWrapper = ( {
	children,
	totalVideos = 0,
	libraryType = LibraryType.List,
	onChangeType,
	hideFilter = false,
	title,
}: {
	children: React.ReactNode;
	libraryType?: LibraryType;
	totalVideos?: number;
	onChangeType?: () => void;
	hideFilter?: boolean;
	title?: string;
} ) => {
	const { setSearch, search } = useVideos();
	const [ searchQuery, setSearchQuery ] = useState( search );

	const [ isFilterActive, setIsFilterActive ] = useState( false );

	return (
		<div className={ styles[ 'library-wrapper' ] }>
			<Text variant="headline-small" mb={ 1 }>
				{ title }
			</Text>
			<div className={ styles[ 'total-filter-wrapper' ] }>
				<Text>{ totalVideos } Video</Text>
				{ hideFilter ? null : (
					<div className={ styles[ 'filter-wrapper' ] }>
						<SearchInput
							className={ styles[ 'search-input' ] }
							onSearch={ setSearch }
							value={ searchQuery }
							onChange={ setSearchQuery }
						/>

						<FilterButton
							onClick={ () => setIsFilterActive( v => ! v ) }
							isActive={ isFilterActive }
						/>

						<Button
							variant="tertiary"
							size="small"
							icon={ libraryType === LibraryType.List ? grid : formatListBullets }
							onClick={ onChangeType }
						/>
					</div>
				) }
			</div>
			{ isFilterActive && <FilterSection className={ styles[ 'filter-section' ] } /> }
			{ children }
			<ConnectedPagination
				currentPage={ 1 }
				total={ 30 }
				perPage={ 5 }
				className={ styles.pagination }
			/>
		</div>
	);
};

export const VideoPressLibrary = ( { videos }: VideoLibraryProps ) => {
	const navigate = useNavigate();
	const [ libraryType, setLibraryType ] = useState< LibraryType >( LibraryType.Grid );

	const toggleType = () => {
		setLibraryType( current =>
			current === LibraryType.Grid ? LibraryType.List : LibraryType.Grid
		);
	};

	const handleClickEditDetails = video => {
		navigate( `/video/${ video?.id }/edit` );
	};

	return (
		<VideoLibraryWrapper
			totalVideos={ videos?.length }
			onChangeType={ toggleType }
			libraryType={ libraryType }
			title={ __( 'Your VideoPress library', 'jetpack-videopress-pkg' ) }
		>
			{ libraryType === LibraryType.Grid ? (
				<VideoGrid videos={ videos } onVideoDetailsClick={ handleClickEditDetails } />
			) : (
				<VideoList videos={ videos } onClickEdit={ handleClickEditDetails } />
			) }
		</VideoLibraryWrapper>
	);
};

export const LocalLibrary = ( { videos }: VideoLibraryProps ) => {
	return (
		<VideoLibraryWrapper
			totalVideos={ videos?.length }
			hideFilter
			title={ __( 'Local videos', 'jetpack-videopress-pkg' ) }
		>
			<VideoList hidePrivacy hideDuration hidePlays hideEditButton videos={ videos } />
		</VideoLibraryWrapper>
	);
};
