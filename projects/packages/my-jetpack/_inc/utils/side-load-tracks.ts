declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		_tkq: Array< Array< any > >;
	}
}

/**
 * Function to get the current year and week number.
 *
 * @return {string} The current year and week number.
 */
function getCurrentYearAndWeek() {
	const date = new Date();
	const year = date.getFullYear();

	const firstDayOfYear = new Date( year, 0, 1 );
	const daysSinceFirstDay = Math.floor(
		( date.getTime() - firstDayOfYear.getTime() ) / ( 24 * 60 * 60 * 1000 )
	);

	// Calculate the current week number (assuming week starts on Sunday)
	const weekNumber = Math.ceil( ( daysSinceFirstDay + firstDayOfYear.getDay() + 1 ) / 7 );
	const formattedWeekNumber = weekNumber.toString().padStart( 2, '0' );

	return `${ year }${ formattedWeekNumber }`;
}

/**
 * Function to dynamically load a script into the document.
 * It creates a new script element, sets its source to the provided URL,
 * and appends it to the document's head.
 *
 * @param {string} src - The URL of the script to load.
 * @return {Promise<void>} A promise that resolves once the script has loaded.
 */
function loadScript( src: string ): Promise< void > {
	return new Promise( ( resolve, reject ) => {
		const script = document.createElement( 'script' );
		script.src = src;
		script.onload = () => resolve();
		script.onerror = () => {
			reject( new Error( `Failed to load script: ${ src }` ) );
		};
		document.head.appendChild( script );
	} );
}

/**
 * Function to sideload Tracks script.
 *
 * It initializes the _tkq array on the window object if it doesn't exist,
 * and then loads the tracking script from the specified URL. Once the script has loaded,
 * the provided callback function is called.
 *
 * @return {Promise<void>} A promise that resolves once the Tracks has been side loaded.
 */
export default function sideloadTracks(): Promise< void > {
	if ( window._tkq && document.querySelector( 'script[src*="stats.wp.com/w.js"]' ) ) {
		return Promise.resolve();
	}

	window._tkq = window._tkq || [];
	return loadScript( `//stats.wp.com/w.js?${ getCurrentYearAndWeek() }` );
}
