/**
 * External dependencies
 */
import { Button, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { grid, formatListBullets } from '@wordpress/icons';
import classnames from 'classnames';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
/**
 * Internal dependencies
 */
import useVideos from '../../hooks/use-videos';
import { SearchInput } from '../input';
import Pagination from '../pagination';
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

const ConnectedPagination = ( props: { className: string; disabled: boolean } ) => {
	const { setPage, page, itemsPerPage, total, isFetching } = useVideos();
	return total < itemsPerPage ? (
		<div className={ classnames( props.className, styles[ 'pagination-placeholder' ] ) } />
	) : (
		<Pagination
			{ ...props }
			perPage={ itemsPerPage }
			onChangePage={ setPage }
			currentPage={ page }
			total={ total }
			disabled={ isFetching || props.disabled }
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
	disabled,
}: {
	children: React.ReactNode;
	libraryType?: LibraryType;
	totalVideos?: number;
	onChangeType?: () => void;
	hideFilter?: boolean;
	title?: string;
	disabled?: boolean;
} ) => {
	const { setSearch, search, isFetching } = useVideos();
	const [ searchQuery, setSearchQuery ] = useState( search );

	const [ isFilterActive, setIsFilterActive ] = useState( false );

	const singularTotalVideosLabel = __( 'Video', 'jetpack-videopress-pkg' );
	const pluralTotalVideosLabel = __( 'Videos', 'jetpack-videopress-pkg' );
	const totalVideosLabel = totalVideos === 1 ? singularTotalVideosLabel : pluralTotalVideosLabel;

	return (
		<div className={ styles[ 'library-wrapper' ] }>
			<Text variant="headline-small" mb={ 1 }>
				{ title }
			</Text>
			<div className={ styles[ 'total-filter-wrapper' ] }>
				<Text>
					{ totalVideos } { totalVideosLabel }
				</Text>
				{ hideFilter ? null : (
					<div className={ styles[ 'filter-wrapper' ] }>
						<SearchInput
							className={ styles[ 'search-input' ] }
							onSearch={ setSearch }
							value={ searchQuery }
							loading={ isFetching }
							onChange={ setSearchQuery }
							disabled={ disabled }
						/>

						<FilterButton
							onClick={ () => setIsFilterActive( v => ! v ) }
							isActive={ isFilterActive }
							disabled={ disabled }
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
			<ConnectedPagination className={ styles.pagination } disabled={ disabled } />
		</div>
	);
};

export const VideoPressLibrary = ( { videos, totalVideos }: VideoLibraryProps ) => {
	const navigate = useNavigate();
	const [ libraryType, setLibraryType ] = useState< LibraryType >( LibraryType.Grid );
	const disabled = videos?.some?.(
		video => video.uploading || ( ! video.finished && video.posterImage === null )
	);

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
			totalVideos={ totalVideos }
			onChangeType={ toggleType }
			libraryType={ libraryType }
			title={ __( 'Your VideoPress library', 'jetpack-videopress-pkg' ) }
			disabled={ disabled }
		>
			{ libraryType === LibraryType.Grid ? (
				<VideoGrid videos={ videos } onVideoDetailsClick={ handleClickEditDetails } />
			) : (
				<VideoList videos={ videos } onVideoDetailsClick={ handleClickEditDetails } hidePlays />
			) }
		</VideoLibraryWrapper>
	);
};

export const LocalLibrary = ( { videos, totalVideos }: VideoLibraryProps ) => {
	return (
		<VideoLibraryWrapper
			totalVideos={ totalVideos }
			hideFilter
			title={ __( 'Local videos', 'jetpack-videopress-pkg' ) }
		>
			<VideoList
				hidePrivacy
				hideDuration
				hidePlays
				showEditButton={ false }
				showQuickActions={ false }
				videos={ videos }
			/>
		</VideoLibraryWrapper>
	);
};
