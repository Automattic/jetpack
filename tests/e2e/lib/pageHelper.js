export async function waitForSelector( page, selector, options = {} ) {
	const timeout = options.timeout || 30000; // 30 sec
	const el = await page.waitForSelector( selector, options );

	// Throw a error if element not found while looking for element to become visible
	if ( ! options.hidden && el === null ) {
		throw new Error( `ElementNotFoundException after waiting: ${ timeout } sec.` );
	}
	// eslint-disable-next-line no-console
	console.log( `Found element by locator: ${ selector }` );
	return el;
}

export async function waitAndClick( page, selector, options = {} ) {
	const el = await waitForSelector( page, selector, { visible: true } );
	return await el.click( options );
}
