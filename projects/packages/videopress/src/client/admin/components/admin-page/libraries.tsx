import { Button, Text } from '@automattic/jetpack-components';
import { Rect, SVG } from '@wordpress/components';
import { grid } from '@wordpress/icons';
import { SearchInput } from '../input';
import Pagination from '../pagination';
import VideoList from '../video-list';
import styles from './styles.module.scss';
import { VideoPressLibraryProps, LocalVideoLibraryProps } from './types';

const filterIcon = (
	<SVG width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Rect x="5" y="7" width="14" height="1.5" fill="black" />
		<Rect x="7" y="11.25" width="10" height="1.5" fill="black" />
		<Rect x="9" y="15.5" width="6" height="1.5" fill="black" />
	</SVG>
);

const VideoLibraryWrapper = ( { children, totalVideos = 0 } ) => {
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
					<Button variant="tertiary" size="small" icon={ grid } />
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

export const VideoPressLibrary = ( { videos }: VideoPressLibraryProps ) => {
	return (
		<VideoLibraryWrapper totalVideos={ videos?.length }>
			<VideoList videos={ videos } />
		</VideoLibraryWrapper>
	);
};

export const LocalLibrary = ( { videos }: LocalVideoLibraryProps ) => {
	return (
		<VideoLibraryWrapper totalVideos={ videos?.length }>
			<VideoList hidePrivacy hideDuration hidePlays hideEditButton videos={ videos } />
		</VideoLibraryWrapper>
	);
};
