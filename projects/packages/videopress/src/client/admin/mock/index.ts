/**
 * Internal dependencies
 */
import posterImage01 from './assets/poster-01.png';
import posterImage02 from './assets/poster-02.png';
import posterImage03 from './assets/poster-03.png';
import posterImage04 from './assets/poster-04.png';
import posterImage05 from './assets/poster-05.png';
import posterImage06 from './assets/poster-06.png';
import posterSquareImage01 from './assets/poster-square-01.jpg';
import posterSquareImage02 from './assets/poster-square-02.jpg';
import posterSquareImage03 from './assets/poster-square-03.jpg';
import posterSquareImage04 from './assets/poster-square-04.jpg';
import posterSquareImage05 from './assets/poster-square-05.jpg';
import posterSquareImage06 from './assets/poster-square-06.jpg';

export const postersArray = [
	posterImage01,
	posterImage02,
	posterImage03,
	posterImage04,
	posterImage05,
	posterImage06,
	posterSquareImage01,
	posterSquareImage02,
	posterSquareImage03,
	posterSquareImage04,
	posterSquareImage05,
	posterSquareImage06,
];

/**
 * Return a random poster image
 *
 * @returns {string} Random poster image
 */
export function randomPoster() {
	const max = postersArray.length - 1;
	const randomPos = Math.floor( Math.random() * ( max + 1 ) );
	return postersArray[ randomPos ];
}

export const videos = [
	{
		id: 1,
		posterImage: posterImage01,
		videoTitle: 'JPD Meetup - Barcelona',
		duration: 158633,
		plays: 200,
		uploadDate: '2022-08-15T21:16:59+0000',
		isPrivate: true,
		url: 'https://videos.files.wordpress.com/uz1Bk7rV/protect-navigation-9.mp4',
	},
	{
		id: 2,
		posterImage: posterImage02,
		videoTitle: 'Dope Office Setup',
		duration: 158633,
		plays: 200,
		uploadDate: '2022-08-15T21:16:59+0000',
		isPrivate: true,
		url: 'https://videos.files.wordpress.com/uz1Bk7rV/protect-navigation-9.mp4',
	},
	{
		id: 3,
		posterImage: posterImage03,
		videoTitle: 'Geneva Wheel',
		duration: 158633,
		plays: 200,
		uploadDate: '2022-08-15T21:16:59+0000',
		isPrivate: true,
		url: 'https://videos.files.wordpress.com/uz1Bk7rV/protect-navigation-9.mp4',
	},
	{
		id: 4,
		posterImage: posterImage04,
		videoTitle: 'linear-x-02.mov',
		duration: 158633,
		plays: 200,
		uploadDate: '2022-08-15T21:16:59+0000',
		isPrivate: true,
		url: 'https://videos.files.wordpress.com/uz1Bk7rV/protect-navigation-9.mp4',
	},
	{
		id: 5,
		posterImage: posterImage05,
		videoTitle: 'Random Objects',
		duration: 158633,
		plays: 200,
		uploadDate: '2022-08-15T21:16:59+0000',
		isPrivate: true,
		url: 'https://videos.files.wordpress.com/uz1Bk7rV/protect-navigation-9.mp4',
	},
	{
		id: 6,
		posterImage: posterImage06,
		videoTitle: 'office-tour-experiment.mp4',
		duration: 158633,
		plays: 200,
		uploadDate: '2022-08-15T21:16:59+0000',
		isPrivate: true,
		url: 'https://videos.files.wordpress.com/uz1Bk7rV/protect-navigation-9.mp4',
	},
];

export const localVideos = [
	{
		id: 1,
		videoTitle: 'time-clock-v2-05.mp4',
		uploadDate: '2022-08-15T21:16:59+0000',
	},
	{
		id: 2,
		videoTitle: 'Barcelona Tour',
		uploadDate: '2022-08-15T21:16:59+0000',
	},
	{
		id: 3,
		videoTitle: 'Mountain Dew Creative',
		uploadDate: '2022-08-15T21:16:59+0000',
	},
	{
		id: 4,
		videoTitle: '2021 Reel',
		uploadDate: '2022-08-15T21:16:59+0000',
	},
];
