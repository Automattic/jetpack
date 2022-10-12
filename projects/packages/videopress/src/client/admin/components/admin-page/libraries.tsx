/**
 * External dependencies
 */
import { Button, Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { grid, formatListBullets } from '@wordpress/icons';
import classnames from 'classnames';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
/**
 * Internal dependencies
 */
import useVideos, { useLocalVideos } from '../../hooks/use-videos';
import { SearchInput } from '../input';
import { ConnectPagination } from '../pagination';
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
			{ isFilterActive && <FilterSection className={ styles[ 'filter-section' ] } /> }
			{ children }
			<ConnectPagination className={ styles.pagination } disabled={ disabled } />
		</div>
	);
};

export const VideoPressLibrary = ( { videos, totalVideos, loading }: VideoLibraryProps ) => {
	const navigate = useNavigate();
	const [ libraryType, setLibraryType ] = useState< LibraryType >( LibraryType.Grid );
	const disabled = videos?.some?.( video => video.uploading );

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
				<VideoGrid
					videos={ videos }
					onVideoDetailsClick={ handleClickEditDetails }
					loading={ loading }
				/>
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

export const ConnectLocalLibrary = () => {
	const { items: videos, uploadedLocalVideoCount } = useLocalVideos();

	return <LocalLibrary videos={ videos } totalVideos={ uploadedLocalVideoCount } />;
};
