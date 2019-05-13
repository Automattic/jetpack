/**
 * External dependencies
 */
import {
	createNewPost,
	insertBlock,
	// getEditedPostContent,
	// pressKeyTimes,
	clickBlockAppender,
	getAllBlocks,
} from '@wordpress/e2e-test-utils';

async function lastInsertedBlock() {
	return ( await getAllBlocks() ).slice( -1 ).pop();
}

function blockSelector( wpBlock, selector ) {
	const { clientId } = wpBlock;
	return `#block-${ clientId } ${ selector }`;
}

// async function publishPostAndCheckContent() {
// 	await publishPost();

// 	// View the post.
// 	const viewPostLinks = await page.$x( "//a[contains(text(), 'View Post')]" );
// 	await viewPostLinks[ 0 ].click();
// 	await page.waitForNavigation();

// 	// Check the the content doesn't contain <p> tags
// 	await page.waitForSelector( '.entry-content' );
// 	const content = await page.$eval( '.entry-content', element => element.innerHTML.trim() );
// 	expect( content ).toMatchSnapshot();
// }

describe( 'First test', () => {
	it( 'Add some blocks', async () => {
		await createNewPost();

		// Add demo content
		await clickBlockAppender();
		// await page.keyboard.type( 'First paragraph' );
		// await page.keyboard.press( 'Enter' );
		// await page.keyboard.type( 'Second paragraph' );
		// await page.keyboard.press( 'Enter' );
		// await insertBlock( 'Preformatted' );
		await insertBlock( 'Tiled Gallery' );
		const block = await lastInsertedBlock();
		blockSelector( block, '.components-form-file-upload input' );
		// const uploadButtonSelector = blockSelector( block, '.components-form-file-upload input' );
		// const spinnerSelector = blockSelector( block, '.components-spinner' );
		// const content = await getEditedPostContent();
		// console.log(content);

		// expect( content ).toMatchSnapshot();

		// console.log(uploadButtonSelector);
		// console.log(`Current directory: ${process.cwd()}`);

		// // await insertBlock( 'Slideshow' );
		// const dropZoneInput = await page.$( uploadButtonSelector );
		// await dropZoneInput.uploadFile('./tests/e2e/assets/image.jpg');

		// await page.waitForSelector( spinnerSelector );

		// // wait for selector to disappear
		// await page.waitForFunction( selector => ! document.querySelector( selector ), {}, spinnerSelector );

		// await jestPuppeteer.debug();
	} );
} );
