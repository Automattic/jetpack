/**
 * External dependencies
 */
import React, { Fragment } from 'react';

function toggleElements() {
	document.querySelector( '.jetpack-unified-importer' ).style.display = 'none';
	document.querySelector( 'table.importers' ).parentElement.style.display = 'block';
}

function UnifiedImporter() {
	return (
		<Fragment>
			<h1>Oh hi, hullo, Unified Importer!!!!</h1>
			<h2>Now, with React!</h2>
			<p>
				So, this element (<code>.jetpack-unified-importer</code>) is our entry point for our script.
			</p>
			<hr />
			<p>
				We can clone and mutate the core list (<code>table.importers</code>)<br />
				...then append it to the bottom of our UI as desired
			</p>
			<hr />
			<p>And we can have a button which toggles visibility of this & the "regular" UI</p>
			<p>
				e.g.&nbsp;&nbsp;
				<button className="jetpack-unified-importer__exit" onClick={ toggleElements }>
					Exit
				</button>
			</p>
		</Fragment>
	);
}

export default UnifiedImporter;
