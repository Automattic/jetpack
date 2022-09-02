import { Button, Text } from '@automattic/jetpack-components';
import { Rect, SVG } from '@wordpress/components';
import { grid, formatListBullets } from '@wordpress/icons';
import React, { useState } from 'react';
import { SearchInput } from '../input';
import Pagination from '../pagination';
import VideoGrid from '../video-grid';
import VideoList from '../video-list';
import styles from './styles.module.scss';
import { VideoLibraryProps } from './types';

const LibraryType = {
	List: 'list',
	Grid: 'grid',
} as const;

type LibraryType = typeof LibraryType[ keyof typeof LibraryType ];

const filterIcon = (
	<SVG width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Rect x="5" y="7" width="14" height="1.5" fill="black" />
		<Rect x="7" y="11.25" width="10" height="1.5" fill="black" />
		<Rect x="9" y="15.5" width="6" height="1.5" fill="black" />
	</SVG>
);

const VideoLibraryWrapper = ( {
	children,
	totalVideos = 0,
	libraryType = LibraryType.List,
	onChangeType,
}: {
	children: React.ReactNode;
	libraryType?: LibraryType;
	totalVideos?: number;
	onChangeType?: () => void;
} ) => {
	const handleSearchChange = () => {
		// TODO: implement search
	};

	const handleSearch = () => {
		// TODO: implement search
	};

	return (
		<div className={ styles[ 'library-wrapper' ] }>
			<Text variant="headline-small" mb={ 1 }>
				Your VideoPress library
			</Text>
			<div className={ styles[ 'total-filter-wrapper' ] }>
				<Text>{ totalVideos } Video</Text>
				<div className={ styles[ 'filter-wrapper' ] }>
					<SearchInput onChange={ handleSearchChange } onEnter={ handleSearch } />
					<Button variant="secondary" icon={ filterIcon } weight="regular">
						Filters
					</Button>
					<Button
						variant="tertiary"
						size="small"
						icon={ libraryType === LibraryType.List ? grid : formatListBullets }
						onClick={ onChangeType }
					/>
				</div>
			</div>
			{ children }
			<Pagination
				currentPage={ 1 }
				total={ totalVideos }
				perPage={ 5 }
				className={ styles.pagination }
			/>
		</div>
	);
};

export const VideoPressLibrary = ( { videos }: VideoLibraryProps ) => {
	const [ libraryType, setLibraryType ] = useState< LibraryType >( LibraryType.Grid );
	const toggleType = () => {
		setLibraryType( current =>
			current === LibraryType.Grid ? LibraryType.List : LibraryType.Grid
		);
	};

	return (
		<VideoLibraryWrapper
			totalVideos={ videos?.length }
			onChangeType={ toggleType }
			libraryType={ libraryType }
		>
			{ libraryType === LibraryType.Grid ? (
				<VideoGrid videos={ videos } />
			) : (
				<VideoList videos={ videos } />
			) }
		</VideoLibraryWrapper>
	);
};

export const LocalLibrary = ( { videos }: VideoLibraryProps ) => {
	return (
		<VideoLibraryWrapper totalVideos={ videos?.length }>
			<VideoList hidePrivacy hideDuration hidePlays hideEditButton videos={ videos } />
		</VideoLibraryWrapper>
	);
};
