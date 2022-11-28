/**
 * External dependencies
 */
import { Button, Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { grid, formatListBullets } from '@wordpress/icons';
import classnames from 'classnames';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
/**
 * Internal dependencies
 */
import useVideos from '../../hooks/use-videos';
import { SearchInput } from '../input';
import { ConnectLocalPagination, ConnectPagination } from '../pagination';
import { FilterButton, ConnectFilterSection } from '../video-filter';
import VideoGrid from '../video-grid';
import VideoList, { LocalVideoList } from '../video-list';
import styles from './styles.module.scss';
/**
 * Types
 */
import { LocalLibraryProps, VideoLibraryProps } from './types';

const LIBRARY_TYPE_LOCALSORAGE_KEY = 'videopress-library-type';

const LibraryType = {
	List: 'list',
	Grid: 'grid',
} as const;

type LibraryType = typeof LibraryType[ keyof typeof LibraryType ];

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
	const [ isLg ] = useBreakpointMatch( 'lg' );

	const [ isFilterActive, setIsFilterActive ] = useState( false );

	const singularTotalVideosLabel = __( '1 Video', 'jetpack-videopress-pkg' );
	const pluralTotalVideosLabel = sprintf(
		/* translators: placeholder is the number of videos */
		__( '%s Videos', 'jetpack-videopress-pkg' ),
		totalVideos
	);
	const totalVideosLabel = totalVideos === 1 ? singularTotalVideosLabel : pluralTotalVideosLabel;

	return (
		<div className={ styles[ 'library-wrapper' ] }>
			<Text variant="headline-small" mb={ 1 }>
				{ title }
			</Text>
			{ ! isLg && <Text className={ styles[ 'total-sm' ] }>{ totalVideosLabel }</Text> }
			<div className={ styles[ 'total-filter-wrapper' ] }>
				{ isLg && <Text>{ totalVideosLabel }</Text> }
				{ hideFilter ? null : (
					<div className={ styles[ 'filter-wrapper' ] }>
						<SearchInput
							className={ classnames( styles[ 'search-input' ], { [ styles.small ]: ! isLg } ) }
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
			{ isFilterActive && <ConnectFilterSection className={ styles[ 'filter-section' ] } /> }
			{ children }
		</div>
	);
};

export const VideoPressLibrary = ( { videos, totalVideos, loading }: VideoLibraryProps ) => {
	const history = useHistory();
	const { search } = useVideos();

	const libraryTypeFromLocalStorage = localStorage.getItem(
		LIBRARY_TYPE_LOCALSORAGE_KEY
	) as LibraryType;

	const [ libraryType, setLibraryType ] = useState< LibraryType >(
		libraryTypeFromLocalStorage ?? LibraryType.Grid
	);

	const uploading = videos?.some?.( video => video.uploading );

	const toggleType = () => {
		setLibraryType( current => {
			const next = current === LibraryType.Grid ? LibraryType.List : LibraryType.Grid;
			localStorage.setItem( LIBRARY_TYPE_LOCALSORAGE_KEY, next );
			return next;
		} );
	};

	const handleClickEditDetails = video => {
		history.push( `/video/${ video?.id }/edit` );
	};

	const library =
		libraryType === LibraryType.Grid ? (
			<VideoGrid
				videos={ videos }
				onVideoDetailsClick={ handleClickEditDetails }
				loading={ loading }
				count={ uploading ? videos.length : 6 }
			/>
		) : (
			<VideoList
				videos={ videos }
				onVideoDetailsClick={ handleClickEditDetails }
				hidePlays
				loading={ loading }
			/>
		);

	return (
		<VideoLibraryWrapper
			totalVideos={ totalVideos }
			onChangeType={ toggleType }
			libraryType={ libraryType }
			title={ __( 'Your VideoPress library', 'jetpack-videopress-pkg' ) }
		>
			{ videos.length > 0 || loading ? (
				library
			) : (
				<Text>
					{ search.trim()
						? createInterpolateElement(
								sprintf(
									/* translators: placeholder is the search term */
									__( 'No videos match your search for <em>%s</em>.', 'jetpack-videopress-pkg' ),
									search
								),
								{
									em: <em className={ styles[ 'query-no-results' ] } />,
								}
						  )
						: __( 'No videos match your filtering criteria.', 'jetpack-videopress-pkg' ) }
				</Text>
			) }
			<ConnectPagination className={ styles.pagination } />
		</VideoLibraryWrapper>
	);
};

export const LocalLibrary = ( {
	videos,
	totalVideos,
	loading,
	uploading,
	onUploadClick,
}: LocalLibraryProps ) => {
	return (
		<VideoLibraryWrapper
			totalVideos={ totalVideos }
			hideFilter
			title={ __( 'Local videos', 'jetpack-videopress-pkg' ) }
		>
			<LocalVideoList
				videos={ videos }
				loading={ loading }
				onActionClick={ onUploadClick }
				uploading={ uploading }
			/>
			<ConnectLocalPagination className={ styles.pagination } />
		</VideoLibraryWrapper>
	);
};
