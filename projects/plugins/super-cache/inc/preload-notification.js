// Set the maximum number of entries to show
const MAX_PRELOAD_ENTRIES = 5;
// Get a reference to the log element and the previous log entry
const preloadLog = jQuery( "#preload_status" );
let previousPreloadEntry = null;
let numRepeatedPreloadEntries = 0;

jQuery( document ).ready( function () {
	const intervalId = setInterval( function () {
		load_preload_status();
	}, 1000 );
} );

/**
 *
 */
function load_preload_status() {
	jQuery.get( wpsc_preload_ajax.preload_permalink_url + '?' + Math.random(), function ( data ) {
		// Trim the data and compare it to the previous entry
		const newEntry = data.trim();
		if ( newEntry !== previousPreloadEntry ) {
			// Create a new list item for the new entry and append it to the list
			const entry = jQuery("<li>").text(newEntry);
			preloadLog.append(entry);

			// Remove any excess entries from the list
			const entries = preloadLog.children();
			if ( entries.length > MAX_PRELOAD_ENTRIES ) {
				entries.slice( 0, entries.length - MAX_PRELOAD_ENTRIES ).remove();
			}

			// Reset the counter for repeated entries
			numRepeatedPreloadEntries = 0;

			// Update the previous entry to the new entry
			previousPreloadEntry = newEntry;
		} else {
			// If the new entry is the same as the previous entry, increment the counter
			numRepeatedPreloadEntries++;
		}

		// Stop fetching new entries if the same entry has been repeated 10 times
		if ( numRepeatedPreloadEntries >= 10 ) {
			clearInterval( intervalId );
		}
	});
}
