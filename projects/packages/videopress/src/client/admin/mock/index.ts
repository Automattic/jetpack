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
