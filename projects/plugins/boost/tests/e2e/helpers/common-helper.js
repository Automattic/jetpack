import { execWpCommand, resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { PostFrontendPage } from 'jetpack-e2e-commons/pages/index.js';

export async function findPostIdByTitle( postTitle ) {
	const cmd = `db query 'SELECT ID FROM wp_posts WHERE post_title LIKE "%${ postTitle }%" AND post_status="publish"' --skip-column-names`;
	return await execWpCommand( cmd );
}

export async function visitPageByTitle( page, title ) {
	const postId = await findPostIdByTitle( title );
	const postFrontendPage = new PostFrontendPage( page );
	const url = `${ resolveSiteUrl() }/?p=${ postId }`;
	await postFrontendPage.goto( url );
	await postFrontendPage.waitForPage( true );

	return postFrontendPage;
}
