/* eslint-disable jsdoc/require-jsdoc */

import { createHash } from 'crypto';
import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import BaseEditorPage from '@automattic/_jetpack-e2e-commons/pages/editor-page';
import { devices } from '@playwright/test';
import {
	installJetpackAiEvidenceCollector,
	readJetpackAiBrowserEvidence,
	summarizeJetpackAiBrowserEvidence,
	type JetpackAiBrowserEvidence,
	type JetpackAiToolCall,
} from '../../helpers/jetpack-ai-sidebar-evidence';
import type { ConsoleMessage, Locator, Page, Response } from '@playwright/test';

class EditorPage extends BaseEditorPage {
	async waitUntilLoaded(): Promise< void > {
		await this.page.locator( 'body.block-editor-page' ).waitFor( { timeout: 60 * 1000 } );
		await expect
			.poll(
				async () =>
					await this.page.evaluate( () => {
						type EditorWindow = Window & {
							wp?: { data: { select: ( store: string ) => unknown } };
						};
						return Boolean( ( window as EditorWindow ).wp?.data.select( 'core/editor' ) );
					} ),
				{ timeout: 60 * 1000 }
			)
			.toBe( true );
	}

	async getEditorParent(): Promise< Locator > {
		return this.page.locator( 'body.block-editor-page' );
	}

	async getEditorCanvas(): Promise< Locator > {
		const framedCanvas = this.page.locator( 'iframe[name="editor-canvas"]' );
		if ( ( await framedCanvas.count() ) > 0 ) {
			await framedCanvas.waitFor();
			return this.page
				.frameLocator( 'iframe[name="editor-canvas"]' )
				.locator( '.editor-styles-wrapper' );
		}
		return this.page.locator( '.editor-styles-wrapper' );
	}
}

const EXPECTED_BUNDLE_MATCH = process.env.JETPACK_AI_E2E_BUNDLE_MATCH;
const LOCAL_PROVIDER_BUNDLE_PATH = process.env.JETPACK_AI_E2E_PROVIDER_BUNDLE;
type EditorType = 'post' | 'page';
interface EditorTarget {
	postType: EditorType;
	editorUrl: string;
}
const EDITOR_TARGETS: EditorTarget[] = [
	{ postType: 'post', editorUrl: '/wp-admin/post-new.php' },
	{ postType: 'page', editorUrl: '/wp-admin/post-new.php?post_type=page' },
];
const BASELINE_CONTENT = 'This draft is reserved for Jetpack AI Sidebar E2E tests.';
const CONTROL_CONTENT = 'This control paragraph must remain unchanged.';
const BASELINE_TITLE = 'Unoptimized Jetpack AI E2E draft title';
const BASELINE_EXCERPT = '';
// Use a stable public image so the remote AI service can inspect it from the tunneled test site.
const IMAGE_URL = 'https://s0.wp.com/i/buttonw-com.png';
const CONTROL_IMAGE_ALT = 'Existing control image alt text';
const SEO_TITLE_META_KEY = 'jetpack_seo_html_title';
const SEO_DESCRIPTION_META_KEY = 'advanced_seo_description';
const REWRITE_CONTENT_TOOL = 'wpcom__rewrite_content';
const UPDATE_BLOCK_CONTENT_TOOL = 'wpcom__update_block_content';
const APPLY_BLOCK_EDITS_TOOL = 'big_sky__apply_block_edits';
const RESTORE_CHECKPOINT_TOOL = 'big_sky__restore_checkpoint';
const SHOW_COMPONENT_TOOL = 'jetpack_ai__show_component';

test.use( {
	userAgent: devices[ 'Desktop Chrome HiDPI' ].userAgent,
} );

interface ParagraphState {
	clientId: string;
	content: string;
}

interface ImageBlockState {
	clientId: string;
	url: string;
	alt: string;
}

interface DraftFixture {
	paragraphContents?: string[];
	imageAlts?: string[];
}

interface SelectedBlockAbilityCase {
	name: string;
	targetContent: string;
	suggestionName: string | RegExp;
	parentSuggestionName?: string | RegExp;
	expectedPrompt: string;
	assertResult: ( content: string ) => void;
}

interface EditorFieldState {
	title: string;
	excerpt: string;
	seoTitle: string;
	seoDescription: string;
}

const BASELINE_EDITOR_FIELDS: EditorFieldState = {
	title: BASELINE_TITLE,
	excerpt: BASELINE_EXCERPT,
	seoTitle: '',
	seoDescription: '',
};

interface EditorFieldAbilityCase {
	name: string;
	suggestionName: string | RegExp;
	parentSuggestionName?: string | RegExp;
	expectedPrompt: string;
	abilityTool: string;
	componentType: string;
	pickerIntro: string;
	field: keyof EditorFieldState;
}

interface ImageAbilityCase {
	name: string;
	suggestionName: string;
	parentSuggestionName?: string | RegExp;
	expectedPrompt: string;
	scope: 'selected-image' | 'all-images';
	applyButtonName: string;
}

interface ReviewAbilityCase {
	name: string;
	targetContent: string;
	suggestionName: string | RegExp;
	expectedPrompt: string;
	abilityTool: string;
	componentType: string;
	applyButtonName: string | RegExp;
	selectTargetBlock?: boolean;
	assertResult: ( content: string ) => void;
}

interface EvidenceTestInfo {
	attach: ( name: string, options: { body: string; contentType: string } ) => Promise< unknown >;
}

interface PreparedTargetEditor {
	editorPage: EditorPage;
	editorParent: Locator;
	supportsExcerpt: boolean;
}

interface PreparedRoutingScenario extends PreparedTargetEditor {
	chat: Locator;
	targetClientId: string;
	targetContent: string;
}

interface TargetRuntimeEvidence {
	targetType: 'self-hosted';
	postType: EditorType;
	supportsExcerpt: boolean;
	providerCount: number;
	providerLoaded: boolean;
	entryPointCount: number;
}

function omitEditorField(
	fields: EditorFieldState,
	omittedField: keyof EditorFieldState
): Partial< EditorFieldState > {
	return Object.fromEntries(
		Object.entries( fields ).filter( ( [ field ] ) => field !== omittedField )
	);
}

const SELECTED_BLOCK_ABILITY_CASES: SelectedBlockAbilityCase[] = [
	{
		name: 'Translate content to Spanish',
		targetContent: 'The quick brown fox jumps over the lazy dog.',
		suggestionName: 'Spanish',
		parentSuggestionName: 'Translate content',
		expectedPrompt: 'Translate this block content to Spanish',
		assertResult: content => {
			expect( content ).toMatch( /zorro|perro|rápido|perezoso/i );
		},
	},
	{
		name: 'Change tone to Formal',
		targetContent: 'Hey, can you send me the quarterly report?',
		suggestionName: /Formal$/,
		parentSuggestionName: 'Change tone',
		expectedPrompt: 'Change the tone of this text to be more formal',
		assertResult: content => {
			expect( content.toLowerCase() ).toContain( 'quarterly report' );
			expect( content ).not.toMatch( /^hey\b/i );
		},
	},
	{
		name: 'Simplify text',
		targetContent:
			'Notwithstanding the aforementioned considerations, the committee subsequently elected to postpone implementation of the proposal.',
		suggestionName: 'Simplify text',
		expectedPrompt: 'Simplify this text to make it easier to read',
		assertResult: content => {
			expect( content.toLowerCase() ).toContain( 'committee' );
			expect( content.toLowerCase() ).toContain( 'proposal' );
		},
	},
];

const EDITOR_FIELD_ABILITY_CASES: EditorFieldAbilityCase[] = [
	{
		name: 'Optimize title',
		suggestionName: /^Optimize title\b/,
		expectedPrompt: 'Optimize the title of this post',
		abilityTool: 'jetpack_ai__optimize_title',
		componentType: 'title-picker',
		pickerIntro: 'Choose a title for your post:',
		field: 'title',
	},
	{
		name: 'Generate excerpt',
		suggestionName: /^Generate excerpt\b/,
		expectedPrompt: 'Generate an excerpt for this post',
		abilityTool: 'jetpack_ai__generate_excerpt',
		componentType: 'excerpt-picker',
		pickerIntro: 'Choose an excerpt for your post',
		field: 'excerpt',
	},
	{
		name: 'Optimize SEO title',
		suggestionName: 'Title',
		parentSuggestionName: /^Optimize SEO\b/,
		expectedPrompt: 'Generate an SEO title (meta title) for this post',
		abilityTool: 'jetpack_ai__generate_seo_title',
		componentType: 'seo-title-picker',
		pickerIntro: 'Choose an SEO title for your post:',
		field: 'seoTitle',
	},
	{
		name: 'Optimize SEO description',
		suggestionName: 'Description',
		parentSuggestionName: /^Optimize SEO\b/,
		expectedPrompt: 'Generate an SEO meta description for this post',
		abilityTool: 'jetpack_ai__generate_seo_description',
		componentType: 'seo-description-picker',
		pickerIntro: 'Choose an SEO description for your post:',
		field: 'seoDescription',
	},
];

const IMAGE_ABILITY_CASES: ImageAbilityCase[] = [
	{
		name: 'Generate alt text for a selected image',
		suggestionName: 'Generate alt text',
		expectedPrompt: 'Generate descriptive alt text for this image',
		scope: 'selected-image',
		applyButtonName: 'Apply to 1 image',
	},
	{
		name: 'Optimize SEO image alt text for all images',
		suggestionName: 'Image Alt Text',
		parentSuggestionName: /^Optimize SEO\b/,
		expectedPrompt: 'Generate descriptive alt text for the images in this post',
		scope: 'all-images',
		applyButtonName: 'Apply to all 2 images',
	},
];

const REVIEW_ABILITY_CASES: ReviewAbilityCase[] = [
	{
		name: 'Simple review',
		targetContent: 'This paragraph says says the same word twice, which hurts reader clarity.',
		suggestionName: /^Simple review\b/,
		expectedPrompt:
			'Generate feedback for this saved post. Review the saved title and saved block content',
		abilityTool: 'wpcom__generate_feedback',
		componentType: 'post-feedback',
		applyButtonName: 'Apply change',
		assertResult: content => {
			expect( content.toLowerCase() ).not.toContain( 'says says' );
		},
	},
	{
		name: 'Proofread',
		targetContent: 'The writer walk to teh library every day.',
		suggestionName: /^Proofread\b/,
		expectedPrompt:
			'Proofread this saved post for spelling, grammar, and punctuation. Review the saved title and saved block content',
		abilityTool: 'wpcom__proofread_content',
		componentType: 'proofread',
		applyButtonName: 'Apply change',
		assertResult: content => {
			expect( content ).toMatch( /writer walks to the library/i );
		},
	},
	{
		name: 'Editorial review',
		targetContent: 'This sentence contains duplicated punctuation!!',
		suggestionName: /^Editorial review\b/,
		expectedPrompt:
			'Run an AI Editorial Review for this post. Check the content, reviewer notes, and site guidelines',
		abilityTool: 'wpcom__ai_editorial_review',
		componentType: 'ai-editorial-review',
		applyButtonName: /Apply change|Accept AI resolution/,
		assertResult: content => {
			expect( content ).not.toContain( '!!' );
		},
	},
];

async function getEditorContentRootClientId( editorParent: Locator ): Promise< string > {
	return await editorParent.evaluate( element => {
		type Block = {
			clientId: string;
			name: string;
			innerBlocks?: Block[];
		};
		type EditorWindow = Window & {
			wp?: {
				data: {
					select: ( store: string ) => {
						getBlocks: () => Block[];
					};
				};
			};
		};
		const editorWindow = element.ownerDocument.defaultView as EditorWindow;
		const blockEditor = editorWindow.wp?.data.select( 'core/block-editor' );
		if ( ! blockEditor ) {
			throw new Error( 'WordPress block editor store is unavailable.' );
		}
		const findPostContent = ( blocks: Block[] ): string => {
			for ( const block of blocks ) {
				if ( block.name === 'core/post-content' ) {
					return block.clientId;
				}
				const nestedMatch = findPostContent( block.innerBlocks ?? [] );
				if ( nestedMatch ) {
					return nestedMatch;
				}
			}
			return '';
		};
		return findPostContent( blockEditor.getBlocks() );
	} );
}

async function replaceDraftContent(
	editorParent: Locator,
	targetContent = BASELINE_CONTENT
): Promise< DraftFixture > {
	for ( let attempt = 0; attempt < 3; attempt += 1 ) {
		const contentRootClientId = await getEditorContentRootClientId( editorParent );
		await editorParent.evaluate(
			( element, fixture ) => {
				type EditorWindow = Window & {
					wp?: {
						blocks: {
							createBlock: ( name: string, attributes: Record< string, unknown > ) => unknown;
						};
						data: {
							dispatch: ( store: string ) => Record< string, ( ...args: unknown[] ) => void >;
						};
					};
				};
				const editorWindow = element.ownerDocument.defaultView as EditorWindow;
				const wp = editorWindow.wp;
				if ( ! wp ) {
					throw new Error( 'WordPress editor APIs are unavailable.' );
				}
				const blocks = [
					wp.blocks.createBlock( 'core/paragraph', { content: fixture.target } ),
					wp.blocks.createBlock( 'core/paragraph', { content: fixture.control } ),
				];
				const blockEditor = wp.data.dispatch( 'core/block-editor' );
				if ( fixture.contentRootClientId ) {
					blockEditor.replaceInnerBlocks( fixture.contentRootClientId, blocks, false );
				} else {
					blockEditor.resetBlocks( blocks );
				}
				wp.data.dispatch( 'core/editor' ).editPost( {
					title: fixture.title,
					excerpt: '',
					meta: {
						jetpack_seo_html_title: '',
						advanced_seo_description: '',
					},
				} );
			},
			{
				target: targetContent,
				control: CONTROL_CONTENT,
				title: BASELINE_TITLE,
				contentRootClientId,
			}
		);
		try {
			await expect
				.poll(
					async () =>
						( await readParagraphs( editorParent ) ).map( paragraph => paragraph.content ),
					{ timeout: 5 * 1000 }
				)
				.toEqual( [ targetContent, CONTROL_CONTENT ] );
			return { paragraphContents: [ targetContent, CONTROL_CONTENT ] };
		} catch {
			continue;
		}
	}
	throw new Error( 'The deterministic two-paragraph fixture could not be applied.' );
}

async function readEditorFields( editorParent: Locator ): Promise< EditorFieldState > {
	return await editorParent.evaluate(
		( element, metaKeys ) => {
			type EditorWindow = Window & {
				wp?: {
					data: {
						select: ( store: string ) => {
							getEditedPostAttribute: ( attribute: string ) => unknown;
						};
					};
				};
			};
			const editorWindow = element.ownerDocument.defaultView as EditorWindow;
			const editor = editorWindow.wp?.data.select( 'core/editor' );
			if ( ! editor ) {
				throw new Error( 'WordPress editor store is unavailable.' );
			}
			const meta = editor.getEditedPostAttribute( 'meta' ) as Record< string, unknown >;
			const asString = ( value: unknown ) => ( typeof value === 'string' ? value : '' );
			return {
				title: asString( editor.getEditedPostAttribute( 'title' ) ),
				excerpt: asString( editor.getEditedPostAttribute( 'excerpt' ) ),
				seoTitle: asString( meta?.[ metaKeys.seoTitle ] ),
				seoDescription: asString( meta?.[ metaKeys.seoDescription ] ),
			};
		},
		{ seoTitle: SEO_TITLE_META_KEY, seoDescription: SEO_DESCRIPTION_META_KEY }
	);
}

async function readParagraphs( editorParent: Locator ): Promise< ParagraphState[] > {
	const contentRootClientId = await getEditorContentRootClientId( editorParent );
	return await editorParent.evaluate( ( element, rootClientId ) => {
		type Block = {
			clientId: string;
			name: string;
			attributes?: { content?: unknown };
		};
		type EditorWindow = Window & {
			wp?: {
				data: {
					select: ( store: string ) => {
						getBlocks: ( rootClientId?: string ) => Block[];
					};
				};
			};
		};
		const editorWindow = element.ownerDocument.defaultView as EditorWindow;
		const blocks = editorWindow.wp?.data
			.select( 'core/block-editor' )
			.getBlocks( rootClientId || undefined );
		if ( ! blocks ) {
			throw new Error( 'WordPress block editor store is unavailable.' );
		}
		return blocks
			.filter( ( block: Block ) => block.name === 'core/paragraph' )
			.map( ( block: Block ) => ( {
				clientId: block.clientId,
				content:
					typeof block.attributes?.content === 'string'
						? block.attributes.content
						: String( block.attributes?.content ?? '' ),
			} ) );
	}, contentRootClientId );
}

async function replaceDraftWithImages( editorParent: Locator ): Promise< DraftFixture > {
	for ( let attempt = 0; attempt < 3; attempt += 1 ) {
		const contentRootClientId = await getEditorContentRootClientId( editorParent );
		await editorParent.evaluate(
			( element, fixture ) => {
				type EditorWindow = Window & {
					wp?: {
						blocks: {
							createBlock: ( name: string, attributes: Record< string, unknown > ) => unknown;
						};
						data: {
							dispatch: ( store: string ) => Record< string, ( ...args: unknown[] ) => void >;
						};
					};
				};
				const editorWindow = element.ownerDocument.defaultView as EditorWindow;
				const wp = editorWindow.wp;
				if ( ! wp ) {
					throw new Error( 'WordPress editor APIs are unavailable.' );
				}
				const blocks = [
					wp.blocks.createBlock( 'core/paragraph', { content: fixture.content } ),
					wp.blocks.createBlock( 'core/image', { url: fixture.url, alt: '' } ),
					wp.blocks.createBlock( 'core/image', {
						url: fixture.url,
						alt: fixture.controlAlt,
					} ),
				];
				const blockEditor = wp.data.dispatch( 'core/block-editor' );
				if ( fixture.contentRootClientId ) {
					blockEditor.replaceInnerBlocks( fixture.contentRootClientId, blocks, false );
				} else {
					blockEditor.resetBlocks( blocks );
				}
				wp.data.dispatch( 'core/editor' ).editPost( {
					title: fixture.title,
					excerpt: '',
					meta: {
						jetpack_seo_html_title: '',
						advanced_seo_description: '',
					},
				} );
			},
			{
				content: BASELINE_CONTENT,
				url: IMAGE_URL,
				controlAlt: CONTROL_IMAGE_ALT,
				title: BASELINE_TITLE,
				contentRootClientId,
			}
		);
		try {
			await expect
				.poll( async () => ( await readImages( editorParent ) ).map( image => image.alt ), {
					timeout: 5 * 1000,
				} )
				.toEqual( [ '', CONTROL_IMAGE_ALT ] );
			return { imageAlts: [ '', CONTROL_IMAGE_ALT ] };
		} catch {
			continue;
		}
	}
	throw new Error( 'The deterministic two-image fixture could not be applied.' );
}

async function readImages( editorParent: Locator ): Promise< ImageBlockState[] > {
	const contentRootClientId = await getEditorContentRootClientId( editorParent );
	return await editorParent.evaluate( ( element, rootClientId ) => {
		type Block = {
			clientId: string;
			name: string;
			attributes?: { url?: unknown; alt?: unknown };
		};
		type EditorWindow = Window & {
			wp?: {
				data: {
					select: ( store: string ) => {
						getBlocks: ( rootClientId?: string ) => Block[];
					};
				};
			};
		};
		const editorWindow = element.ownerDocument.defaultView as EditorWindow;
		const blocks = editorWindow.wp?.data
			.select( 'core/block-editor' )
			.getBlocks( rootClientId || undefined );
		if ( ! blocks ) {
			throw new Error( 'WordPress block editor store is unavailable.' );
		}
		return blocks
			.filter( ( block: Block ) => block.name === 'core/image' )
			.map( ( block: Block ) => ( {
				clientId: block.clientId,
				url: typeof block.attributes?.url === 'string' ? block.attributes.url : '',
				alt: typeof block.attributes?.alt === 'string' ? block.attributes.alt : '',
			} ) );
	}, contentRootClientId );
}

async function draftMatchesFixture(
	editorParent: Locator,
	fixture: DraftFixture
): Promise< boolean > {
	if ( fixture.paragraphContents ) {
		const contents = ( await readParagraphs( editorParent ) ).map( paragraph => paragraph.content );
		return JSON.stringify( contents ) === JSON.stringify( fixture.paragraphContents );
	}
	if ( fixture.imageAlts ) {
		const alts = ( await readImages( editorParent ) ).map( image => image.alt );
		return JSON.stringify( alts ) === JSON.stringify( fixture.imageAlts );
	}
	return false;
}

function normalizeSerializedBlockMarkup( content: string ): string {
	return content.replace( /\s+\/>/g, '/>' );
}

async function waitForSavedFixture(
	editorParent: Locator,
	fixture: DraftFixture,
	expectedContent: string
): Promise< void > {
	await expect
		.poll(
			async () => ( {
				content: normalizeSerializedBlockMarkup( await readEditedPostContent( editorParent ) ),
				fixtureMatches: await draftMatchesFixture( editorParent, fixture ),
			} ),
			{ timeout: 10 * 1000 }
		)
		.toEqual( {
			content: normalizeSerializedBlockMarkup( expectedContent ),
			fixtureMatches: true,
		} );
}

async function readRenderedImageAlts( editorPage: EditorPage ): Promise< string[] > {
	const editorCanvas = await editorPage.getEditorCanvas();
	return await editorCanvas
		.locator( '[data-type="core/image"] img' )
		.evaluateAll( images => images.map( image => image.getAttribute( 'alt' ) ?? '' ) );
}

async function selectBlock( editorParent: Locator, clientId: string ): Promise< void > {
	await editorParent.evaluate( ( element, selectedClientId ) => {
		type EditorWindow = Window & {
			wp?: {
				data: {
					dispatch: ( store: string ) => { selectBlock: ( id: string ) => void };
				};
			};
		};
		const editorWindow = element.ownerDocument.defaultView as EditorWindow;
		const blockEditor = editorWindow.wp?.data.dispatch( 'core/block-editor' );
		if ( ! blockEditor ) {
			throw new Error( 'WordPress block editor dispatcher is unavailable.' );
		}
		blockEditor.selectBlock( selectedClientId );
	}, clientId );
}

async function focusEditorBlock(
	editorParent: Locator,
	editorPage: EditorPage,
	clientId: string
): Promise< void > {
	await selectBlock( editorParent, clientId );
	const editorCanvas = await editorPage.getEditorCanvas();
	const targetBlock = editorCanvas.locator( `[data-block="${ clientId }"]` );
	await expect( targetBlock ).toBeVisible();
	await targetBlock.click();
}

async function clearSelectedBlock( editorParent: Locator ): Promise< void > {
	await editorParent.evaluate( element => {
		type EditorWindow = Window & {
			wp?: {
				data: {
					dispatch: ( store: string ) => { clearSelectedBlock: () => void };
				};
			};
		};
		const editorWindow = element.ownerDocument.defaultView as EditorWindow;
		const blockEditor = editorWindow.wp?.data.dispatch( 'core/block-editor' );
		if ( ! blockEditor ) {
			throw new Error( 'WordPress block editor dispatcher is unavailable.' );
		}
		blockEditor.clearSelectedBlock();
	} );
}

async function configureImageScope(
	editorParent: Locator,
	editorPage: EditorPage,
	scope: ImageAbilityCase[ 'scope' ]
): Promise< string > {
	const images = await readImages( editorParent );
	const targetClientId = images[ 0 ]?.clientId;
	if ( ! targetClientId || images.length !== 2 ) {
		throw new Error( 'The deterministic two-image fixture is unavailable.' );
	}
	if ( scope === 'all-images' ) {
		await clearSelectedBlock( editorParent );
		return targetClientId;
	}
	await focusEditorBlock( editorParent, editorPage, targetClientId );
	return targetClientId;
}

async function configureReviewTarget(
	editorParent: Locator,
	editorPage: EditorPage,
	targetClientId: string,
	selectTargetBlock: boolean
): Promise< void > {
	if ( ! selectTargetBlock ) {
		await clearSelectedBlock( editorParent );
		return;
	}
	await focusEditorBlock( editorParent, editorPage, targetClientId );
}

function hasExpectedImageMutation(
	scope: ImageAbilityCase[ 'scope' ],
	initialImages: ImageBlockState[],
	finalImages: ImageBlockState[]
): boolean {
	if ( finalImages.length !== initialImages.length ) {
		return false;
	}
	if ( scope === 'selected-image' ) {
		return finalImages[ 0 ].alt !== initialImages[ 0 ].alt;
	}
	return finalImages.every( ( image, index ) => image.alt !== initialImages[ index ].alt );
}

function hasExpectedRenderedImageMutation(
	scope: ImageAbilityCase[ 'scope' ],
	initialImages: ImageBlockState[],
	renderedImageAlts: string[]
): boolean {
	if ( renderedImageAlts.length !== initialImages.length ) {
		return false;
	}
	if ( scope === 'selected-image' ) {
		return (
			renderedImageAlts[ 0 ] !== initialImages[ 0 ].alt &&
			renderedImageAlts[ 1 ] === initialImages[ 1 ].alt
		);
	}
	return renderedImageAlts.every( ( alt, index ) => alt !== initialImages[ index ].alt );
}

function assertImageAbilityArguments(
	argumentsValue: Record< string, unknown > | undefined,
	scope: ImageAbilityCase[ 'scope' ]
): void {
	const clientIds = argumentsValue?.client_ids;
	if ( scope === 'selected-image' ) {
		expect( clientIds ).toEqual( [ expect.any( String ) ] );
		return;
	}
	expect( clientIds ?? [] ).toEqual( [] );
}

function assertImageMutation(
	scope: ImageAbilityCase[ 'scope' ],
	initialImages: ImageBlockState[],
	finalImages: ImageBlockState[]
): void {
	expect( finalImages[ 0 ].alt ).not.toBe( initialImages[ 0 ].alt );
	expect( finalImages[ 0 ].alt ).not.toBe( '' );
	if ( scope === 'selected-image' ) {
		expect( finalImages[ 1 ].alt ).toBe( initialImages[ 1 ].alt );
		return;
	}
	expect( finalImages[ 1 ].alt ).not.toBe( initialImages[ 1 ].alt );
	expect( finalImages[ 1 ].alt ).not.toBe( '' );
}

async function waitForAgentsManager( editorParent: Locator ): Promise< void > {
	await expect
		.poll(
			async () => {
				return await editorParent.evaluate( element => {
					type ActionsWindow = Window & { __agentsManagerActions?: { isReady?: boolean } };
					const editorWindow = element.ownerDocument.defaultView as ActionsWindow;
					return editorWindow.__agentsManagerActions?.isReady === true;
				} );
			},
			{ timeout: 60 * 1000 }
		)
		.toBe( true );
}

async function waitForEditorPostType(
	editorParent: Locator,
	expectedPostType: EditorType
): Promise< void > {
	await expect
		.poll(
			async () => {
				return await editorParent.evaluate( element => {
					type EditorWindow = Window & {
						wp?: {
							data: {
								select: ( store: string ) => { getCurrentPostType?: () => unknown };
							};
						};
					};
					const editorWindow = element.ownerDocument.defaultView as EditorWindow;
					const postType = editorWindow.wp?.data.select( 'core/editor' ).getCurrentPostType?.();
					return typeof postType === 'string' ? postType : '';
				} );
			},
			{ timeout: 60 * 1000 }
		)
		.toBe( expectedPostType );
}

async function waitForEditorChanges( editorParent: Locator ): Promise< void > {
	await expect
		.poll(
			async () =>
				await editorParent.evaluate( element => {
					type EditorWindow = Window & {
						wp?: {
							data: {
								select: ( store: string ) => {
									isEditedPostDirty?: () => boolean;
								};
							};
						};
					};
					const editorWindow = element.ownerDocument.defaultView as EditorWindow;
					return editorWindow.wp?.data.select( 'core/editor' ).isEditedPostDirty?.() === true;
				} ),
			{ timeout: 30 * 1000 }
		)
		.toBe( true );
}

async function waitForEditorContentSynchronization( editorParent: Locator ): Promise< void > {
	const contentRootClientId = await getEditorContentRootClientId( editorParent );
	await expect
		.poll(
			async () =>
				await editorParent.evaluate( ( element, rootClientId ) => {
					type EditorWindow = Window & {
						wp?: {
							blocks: {
								serialize: ( blocks: unknown[] ) => string;
							};
							data: {
								select: ( store: string ) => {
									getBlocks?: ( rootClientId?: string ) => unknown[];
									getEditedPostContent?: () => string;
								};
							};
						};
					};
					const editorWindow = element.ownerDocument.defaultView as EditorWindow;
					const wp = editorWindow.wp;
					if ( ! wp ) {
						return false;
					}
					const blocks =
						wp.data.select( 'core/block-editor' ).getBlocks?.( rootClientId || undefined ) ?? [];
					const editedContent = wp.data.select( 'core/editor' ).getEditedPostContent?.();
					return (
						typeof editedContent === 'string' && editedContent === wp.blocks.serialize( blocks )
					);
				}, contentRootClientId ),
			{ timeout: 30 * 1000 }
		)
		.toBe( true );
}

async function waitForEditorSave( editorParent: Locator ): Promise< void > {
	await expect
		.poll(
			async () =>
				await editorParent.evaluate( element => {
					type EditorWindow = Window & {
						wp?: {
							data: {
								select: ( store: string ) => {
									isEditedPostDirty?: () => boolean;
									isSavingPost?: () => boolean;
								};
							};
						};
					};
					const editorWindow = element.ownerDocument.defaultView as EditorWindow;
					const editor = editorWindow.wp?.data.select( 'core/editor' );
					return editor?.isEditedPostDirty?.() === false && editor.isSavingPost?.() === false;
				} ),
			{ timeout: 60 * 1000 }
		)
		.toBe( true );
}

async function readEditedPostContent( editorParent: Locator ): Promise< string > {
	return await editorParent.evaluate( element => {
		type EditorWindow = Window & {
			wp?: {
				data: {
					select: ( store: string ) => {
						getEditedPostContent?: () => string;
					};
				};
			};
		};
		const editorWindow = element.ownerDocument.defaultView as EditorWindow;
		return editorWindow.wp?.data.select( 'core/editor' ).getEditedPostContent?.() ?? '';
	} );
}

async function readTargetRuntimeEvidence(
	editorParent: Locator,
	editorTarget: EditorTarget,
	supportsExcerpt: boolean
): Promise< TargetRuntimeEvidence > {
	return await editorParent.evaluate(
		( element, runtime ) => {
			type RuntimeWindow = Window & {
				agentsManagerData?: {
					agentProviders?: unknown;
				};
				__JetpackAIProvider?: unknown;
			};
			const editorWindow = element.ownerDocument.defaultView as RuntimeWindow;
			const providers = editorWindow.agentsManagerData?.agentProviders;
			return {
				targetType: 'self-hosted' as const,
				postType: runtime.postType,
				supportsExcerpt: runtime.supportsExcerpt,
				providerCount: Array.isArray( providers ) ? providers.length : 0,
				providerLoaded: Boolean( editorWindow.__JetpackAIProvider ),
				entryPointCount: editorWindow.document.querySelectorAll( 'button[aria-label="Open chat"]' )
					.length,
			};
		},
		{ postType: editorTarget.postType, supportsExcerpt }
	);
}

async function editorSupportsExcerpt( editorParent: Locator ): Promise< boolean > {
	return await editorParent.evaluate( element => {
		type EditorWindow = Window & {
			wp?: {
				data: {
					select: ( store: string ) => {
						getCurrentPostType?: () => unknown;
						getPostType?: ( postType: string ) => { supports?: Record< string, boolean > };
					};
				};
			};
		};
		const editorWindow = element.ownerDocument.defaultView as EditorWindow;
		const postType = editorWindow.wp?.data.select( 'core/editor' ).getCurrentPostType?.();
		if ( typeof postType !== 'string' ) {
			return false;
		}
		return (
			editorWindow.wp?.data.select( 'core' ).getPostType?.( postType )?.supports?.excerpt === true
		);
	} );
}

async function disablePageStarterPatternModal( page: Page ): Promise< void > {
	await page.evaluate( async () => {
		type PreferencesWindow = Window & {
			wp?: {
				data?: {
					dispatch: ( store: string ) => {
						set: ( scope: string, key: string, value: boolean ) => Promise< void >;
					};
				};
			};
		};
		const preferences = ( window as PreferencesWindow ).wp?.data?.dispatch( 'core/preferences' );
		if ( ! preferences ) {
			throw new Error( 'WordPress preferences store is unavailable.' );
		}
		await preferences.set( 'core', 'enableChoosePatternModal', false );
	} );

	const modal = page.getByRole( 'dialog', { name: 'Choose a pattern' } );
	if ( await modal.isVisible() ) {
		const keepEnabled = modal.getByRole( 'checkbox', {
			name: 'Always show starter patterns for new pages',
		} );
		if ( await keepEnabled.isChecked() ) {
			await keepEnabled.uncheck();
		}
		await modal.getByRole( 'button', { name: 'Close' } ).click();
		await expect( modal ).toBeHidden();
	}
}

async function seedAndSaveTargetDraft(
	page: Page,
	editorTarget: EditorTarget,
	editorPage: EditorPage,
	editorParent: Locator,
	seedDraft: ( editorParent: Locator ) => Promise< DraftFixture >
): Promise< { fixture: DraftFixture; expectedContent: string } > {
	const fixture = await seedDraft( editorParent );
	await waitForEditorContentSynchronization( editorParent );
	await waitForEditorChanges( editorParent );
	const expectedContent = await readEditedPostContent( editorParent );
	if ( editorTarget.postType === 'page' ) {
		await disablePageStarterPatternModal( page );
	}
	await editorPage.saveDraft();
	await waitForEditorSave( editorParent );
	return { fixture, expectedContent };
}

async function reloadTargetEditor(
	page: Page,
	editorTarget: EditorTarget
): Promise< { editorPage: EditorPage; editorParent: Locator; bundleResponse: Response } > {
	const bundleResponsePromise = page.waitForResponse(
		response =>
			LOCAL_PROVIDER_BUNDLE_PATH
				? response.url().includes( 'jetpack-ai-sidebar.min.js' )
				: response.url().includes( 'jetpack-ai-sidebar.provider.mjs' ) ||
				  response.url().includes( 'jetpack-ai-sidebar.min.js' ),
		{ timeout: 60 * 1000 }
	);
	await page.reload( { waitUntil: 'domcontentloaded', timeout: 60 * 1000 } );
	const editorPage = new EditorPage( { page } );
	await editorPage.waitUntilLoaded();
	const editorParent = await editorPage.getEditorParent();
	await waitForEditorPostType( editorParent, editorTarget.postType );
	return { editorPage, editorParent, bundleResponse: await bundleResponsePromise };
}

async function prepareTargetEditor(
	page: Page,
	testInfo: EvidenceTestInfo,
	editorTarget: EditorTarget,
	seedDraft: ( editorParent: Locator ) => Promise< DraftFixture >
): Promise< PreparedTargetEditor > {
	if ( LOCAL_PROVIDER_BUNDLE_PATH ) {
		await page.route( /\/jetpack-ai-sidebar(?:\.min)?\.js(?:\?.*)?$/, route =>
			route.fulfill( {
				path: LOCAL_PROVIDER_BUNDLE_PATH,
				contentType: 'application/javascript',
			} )
		);
	}
	await page.route( /survicate/i, route => route.abort() );
	await page.goto( editorTarget.editorUrl, {
		waitUntil: 'domcontentloaded',
		timeout: 60 * 1000,
	} );
	let editorPage = new EditorPage( { page } );
	await editorPage.waitUntilLoaded();
	await editorPage.setPreferences( 'core/edit-post', {
		welcomeGuide: false,
		fullscreenMode: false,
	} );
	if ( editorTarget.postType === 'page' ) {
		await disablePageStarterPatternModal( page );
	}
	let editorParent = await editorPage.getEditorParent();
	await waitForEditorPostType( editorParent, editorTarget.postType );
	let seededDraft = await seedAndSaveTargetDraft(
		page,
		editorTarget,
		editorPage,
		editorParent,
		seedDraft
	);
	let reloadedEditor = await reloadTargetEditor( page, editorTarget );
	( { editorPage, editorParent } = reloadedEditor );
	let fixtureNeedsRetry = false;
	try {
		await waitForSavedFixture( editorParent, seededDraft.fixture, seededDraft.expectedContent );
	} catch {
		fixtureNeedsRetry = true;
	}
	if ( fixtureNeedsRetry ) {
		seededDraft = await seedAndSaveTargetDraft(
			page,
			editorTarget,
			editorPage,
			editorParent,
			seedDraft
		);
		reloadedEditor = await reloadTargetEditor( page, editorTarget );
		( { editorPage, editorParent } = reloadedEditor );
		await waitForSavedFixture( editorParent, seededDraft.fixture, seededDraft.expectedContent );
	}
	const supportsExcerpt = await editorSupportsExcerpt( editorParent );
	const { bundleResponse } = reloadedEditor;
	const bundleBody = await bundleResponse.body();
	const bundleEvidence = {
		source: LOCAL_PROVIDER_BUNDLE_PATH ? 'local' : 'deployed',
		sha256: createHash( 'sha256' ).update( bundleBody ).digest( 'hex' ),
	};
	await testInfo.attach( 'jetpack-ai-sidebar-bundle.json', {
		body: JSON.stringify( bundleEvidence, null, 2 ),
		contentType: 'application/json',
	} );
	expect( bundleResponse.url() ).toContain( EXPECTED_BUNDLE_MATCH ?? 'jetpack-ai-sidebar' );
	await waitForAgentsManager( editorParent );
	await testInfo.attach( 'jetpack-ai-sidebar-target.json', {
		body: JSON.stringify(
			await readTargetRuntimeEvidence( editorParent, editorTarget, supportsExcerpt ),
			null,
			2
		),
		contentType: 'application/json',
	} );

	return { editorPage, editorParent, supportsExcerpt };
}

async function startFreshChat( chat: Locator ): Promise< void > {
	const moreOptions = chat.getByRole( 'button', { name: 'More Options' } );
	await moreOptions.click();
	const newChat = chat.getByRole( 'menuitem', { name: 'New chat' } );
	if ( await newChat.isEnabled() ) {
		await newChat.click();
		return;
	}
	const input = chat.locator( '[data-slot="chat-input"] textarea' );
	if ( await input.isEnabled() ) {
		await moreOptions.click();
		return;
	}
	await expect( newChat ).toBeEnabled( { timeout: 2 * 60 * 1000 } );
	await newChat.click();
}

async function openAgentsManager( editorParent: Locator ): Promise< Locator > {
	const chat = editorParent.locator( '.agents-manager-chat' );
	const chatInput = chat.locator( '[data-slot="chat-input"] textarea' );
	if ( await chatInput.isVisible() ) {
		return chat;
	}
	const entryPoint = editorParent.getByRole( 'button', { name: 'Open chat', exact: true } );
	await expect
		.poll( async () => ( await chatInput.isVisible() ) || ( await entryPoint.isVisible() ), {
			timeout: 60 * 1000,
		} )
		.toBe( true );
	for ( let attempt = 0; attempt < 3; attempt += 1 ) {
		if ( await chatInput.isVisible() ) {
			return chat;
		}
		try {
			await entryPoint.click( { timeout: 10 * 1000 } );
		} catch {
			// A successful click can remove the entry point before Playwright finishes the action.
		}
		try {
			await chatInput.waitFor( { state: 'visible', timeout: 10 * 1000 } );
			return chat;
		} catch {
			// Retry the entry point because the first click can be lost while the bundle initializes.
		}
	}
	throw new Error( 'Agents Manager did not open after three entry-point clicks.' );
}

async function clickSuggestion(
	chat: Locator,
	name: string | RegExp,
	parentName?: string | RegExp,
	fallbackPrompt?: string
): Promise< void > {
	const suggestion = chat.getByRole( 'button', {
		name,
		exact: typeof name === 'string',
	} );
	const selectAndSend = async () => {
		await suggestion.click();
		const sendButton = chat.getByRole( 'button', { name: 'Send message', exact: true } );
		await expect( sendButton ).toBeEnabled();
		await sendButton.click();
	};
	if ( await suggestion.isVisible() ) {
		await selectAndSend();
		return;
	}
	const writingToggle = chat.getByRole( 'button', { name: /^Writing/ } );
	if ( parentName ) {
		const parentSuggestion = chat.getByRole( 'button', {
			name: parentName,
			exact: typeof parentName === 'string',
		} );
		try {
			await expect
				.poll(
					async () => {
						if ( await parentSuggestion.isVisible() ) {
							return 'parent';
						}
						if ( await writingToggle.isVisible() ) {
							return 'writing';
						}
						return 'loading';
					},
					{ timeout: 10 * 1000 }
				)
				.not.toBe( 'loading' );
		} catch ( error ) {
			if ( fallbackPrompt ) {
				await sendChatMessage( chat, fallbackPrompt );
				return;
			}
			throw error;
		}
		const suggestionLocation = ( await parentSuggestion.isVisible() ) ? 'parent' : 'writing';
		if ( suggestionLocation === 'writing' ) {
			await writingToggle.click();
		}
		await expect( parentSuggestion ).toBeVisible( { timeout: 10 * 1000 } );
		await parentSuggestion.click();
		try {
			await suggestion.waitFor( { state: 'visible', timeout: 10 * 1000 } );
		} catch ( error ) {
			if ( fallbackPrompt ) {
				await sendChatMessage( chat, fallbackPrompt );
				return;
			}
			throw error;
		}
		await selectAndSend();
		return;
	}
	try {
		await suggestion.waitFor( { state: 'visible', timeout: 3 * 1000 } );
		await selectAndSend();
		return;
	} catch {
		// Continue with grouped suggestions.
	}

	if ( await writingToggle.isVisible() ) {
		await writingToggle.click();
	}
	try {
		await suggestion.waitFor( { state: 'visible', timeout: 10 * 1000 } );
		await selectAndSend();
	} catch ( error ) {
		if ( fallbackPrompt ) {
			await sendChatMessage( chat, fallbackPrompt );
			return;
		}
		throw error;
	}
}

async function sendChatMessage( chat: Locator, message: string ): Promise< void > {
	const input = chat.locator( '[data-slot="chat-input"] textarea' );
	await expect( input ).toHaveCount( 1 );
	await expect( input ).toBeVisible();
	await input.fill( message );
	const sendButton = chat.getByRole( 'button', { name: 'Send message', exact: true } );
	await expect( sendButton ).toBeEnabled();
	await sendButton.click();
}

function getToolCalls( toolCalls: JetpackAiToolCall[], name: string ): JetpackAiToolCall[] {
	return toolCalls.filter( call => call.name === name );
}

function getLastToolCall(
	toolCalls: JetpackAiToolCall[],
	name: string
): JetpackAiToolCall | undefined {
	const matchingCalls = getToolCalls( toolCalls, name );
	return matchingCalls[ matchingCalls.length - 1 ];
}

function hasToolError( evidence: JetpackAiBrowserEvidence ): boolean {
	return evidence.streams.some( stream => stream.body.includes( 'Tool error (' ) );
}

async function expectFallbackBlockEditRoute( page: Page ): Promise< JetpackAiToolCall > {
	await expect
		.poll(
			async () => {
				const { toolCalls } = await readJetpackAiBrowserEvidence( page );
				const fallbackCall = getToolCalls( toolCalls, UPDATE_BLOCK_CONTENT_TOOL )[ 0 ];
				return {
					fallback: fallbackCall ? 1 : 0,
					rewrite: getToolCalls( toolCalls, REWRITE_CONTENT_TOOL ).length,
					apply: getToolCalls( toolCalls, APPLY_BLOCK_EDITS_TOOL ).length,
					argumentsComplete:
						typeof fallbackCall?.arguments.clientId === 'string' &&
						typeof fallbackCall.arguments.currentText === 'string' &&
						typeof fallbackCall.arguments.content === 'string',
				};
			},
			{ timeout: 3 * 60 * 1000 }
		)
		.toEqual( { fallback: 1, rewrite: 0, apply: 0, argumentsComplete: true } );
	const { toolCalls } = await readJetpackAiBrowserEvidence( page );
	return getToolCalls( toolCalls, UPDATE_BLOCK_CONTENT_TOOL )[ 0 ];
}

async function expectConfiguredSelectedBlockRoute(
	page: Page,
	targetClientId: string,
	targetContent: string
): Promise< void > {
	const fallbackCall = await expectFallbackBlockEditRoute( page );
	expect( fallbackCall.arguments.clientId ).toBe( targetClientId );
	expect( fallbackCall.arguments.currentText ).toBe( targetContent );
	expect( fallbackCall.arguments.content ).toEqual( expect.any( String ) );
}

async function waitForTargetBlockChange(
	editorParent: Locator,
	targetClientId: string,
	originalContent: string
): Promise< ParagraphState[] > {
	let paragraphs: ParagraphState[] = [];
	await expect
		.poll(
			async () => {
				paragraphs = await readParagraphs( editorParent );
				return paragraphs.find( paragraph => paragraph.clientId === targetClientId )?.content;
			},
			{ timeout: 60 * 1000 }
		)
		.not.toBe( originalContent );
	expect( paragraphs.find( paragraph => paragraph.content === CONTROL_CONTENT ) ).toBeDefined();
	return paragraphs;
}

async function preparePostRoutingScenario(
	page: Page,
	testInfo: EvidenceTestInfo,
	targetContent: string,
	selectTarget: boolean
): Promise< PreparedRoutingScenario > {
	const prepared = await prepareTargetEditor( page, testInfo, EDITOR_TARGETS[ 0 ], parent =>
		replaceDraftContent( parent, targetContent )
	);
	const target = ( await readParagraphs( prepared.editorParent ) ).find(
		paragraph => paragraph.content === targetContent
	);
	expect( target ).toBeDefined();
	const chat = await openAgentsManager( prepared.editorParent );
	await startFreshChat( chat );
	await openAgentsManager( prepared.editorParent );
	if ( selectTarget ) {
		await focusEditorBlock( prepared.editorParent, prepared.editorPage, target!.clientId );
	} else {
		await clearSelectedBlock( prepared.editorParent );
	}
	return {
		...prepared,
		chat,
		targetClientId: target!.clientId,
		targetContent,
	};
}

async function runPostRoutingScenario(
	page: Page,
	testInfo: EvidenceTestInfo,
	options: { targetContent: string; selectTarget: boolean },
	run: ( scenario: PreparedRoutingScenario ) => Promise< void >
): Promise< void > {
	const consoleErrors: string[] = [];
	page.on( 'console', message => collectConsoleErrors( consoleErrors, message ) );
	await installJetpackAiEvidenceCollector( page );
	let scenario: PreparedRoutingScenario | undefined;
	try {
		scenario = await preparePostRoutingScenario(
			page,
			testInfo,
			options.targetContent,
			options.selectTarget
		);
		await run( scenario );
	} finally {
		const evidence = await readJetpackAiBrowserEvidence( page ).catch( () => ( {
			blockActionCompletions: 0,
			streams: [],
			toolCalls: [],
		} ) );
		const finalParagraphs = scenario
			? await readParagraphs( scenario.editorParent ).catch( () => [] )
			: [];
		await testInfo.attach( 'jetpack-ai-sidebar-routing-run.json', {
			body: JSON.stringify(
				{
					bigSkyMode: 'disabled',
					...summarizeDiagnostics( consoleErrors, evidence ),
					targetClientId: scenario?.targetClientId,
					finalParagraphs,
				},
				null,
				2
			),
			contentType: 'application/json',
		} );
	}
}

function collectConsoleErrors( errors: string[], message: ConsoleMessage ): void {
	if ( message.type() === 'error' ) {
		errors.push( message.text() );
	}
}

function summarizeDiagnostics(
	consoleErrors: string[],
	evidence: JetpackAiBrowserEvidence
): Record< string, unknown > {
	return {
		// Keep public CI artifacts useful without publishing request URLs, payloads, or responses.
		consoleErrorCount: consoleErrors.length,
		evidence: summarizeJetpackAiBrowserEvidence( evidence ),
	};
}

test.describe( 'Jetpack AI Sidebar: connected-site abilities', () => {
	let seoToolsWasActive = false;

	test.describe( 'Connected Jetpack site', () => {
		test.beforeAll( async ( { testUtils } ) => {
			seoToolsWasActive = await testUtils.isModuleActive( 'seo-tools' );
			await testUtils.executeContainerCommand( [
				'exec-silent',
				'--',
				'ln',
				'-sf',
				'/usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/plugins/e2e-jetpack-ai-sidebar.php',
				'/var/www/html/wp-content/mu-plugins/e2e-jetpack-ai-sidebar.php',
			] );
			if ( ! seoToolsWasActive ) {
				await testUtils.activateModule( 'seo-tools' );
			}
			await testUtils.executeWpCommand( 'transient delete jetpack_ai_sidebar_asset' );
		} );

		test.afterAll( async ( { testUtils } ) => {
			if ( ! seoToolsWasActive ) {
				await testUtils.deactivateModule( 'seo-tools' );
			}
			await testUtils.executeContainerCommand( [
				'exec-silent',
				'--',
				'rm',
				'-f',
				'/var/www/html/wp-content/mu-plugins/e2e-jetpack-ai-sidebar.php',
			] );
		} );

		test.describe( 'Selected-block fallback without Big Sky', () => {
			test( 'A site without Big Sky updates the selected block with the fallback tool', async ( {
				page,
			}, testInfo ) => {
				test.setTimeout( 6 * 60 * 1000 );
				const originalContent = 'More infor here.';
				await runPostRoutingScenario(
					page,
					testInfo,
					{ targetContent: originalContent, selectTarget: true },
					async scenario => {
						await sendChatMessage( scenario.chat, 'Check grammar of this text' );
						const fallbackCall = await expectFallbackBlockEditRoute( page );
						expect( fallbackCall.arguments.clientId ).toBe( scenario.targetClientId );
						expect( fallbackCall.arguments.currentText ).toBe( originalContent );
						expect( fallbackCall.arguments.content ).toEqual( expect.any( String ) );
						await waitForTargetBlockChange(
							scenario.editorParent,
							scenario.targetClientId,
							originalContent
						);
						const { toolCalls } = await readJetpackAiBrowserEvidence( page );
						expect( getToolCalls( toolCalls, RESTORE_CHECKPOINT_TOOL ) ).toEqual( [] );
					}
				);
			} );
		} );

		for ( const editorTarget of EDITOR_TARGETS ) {
			for ( const ability of SELECTED_BLOCK_ABILITY_CASES ) {
				test( `As a writer, I can run ${ ability.name } on only the selected block in the ${ editorTarget.postType } editor`, async ( {
					page,
				}, testInfo ) => {
					test.setTimeout( 4 * 60 * 1000 );

					const consoleErrors: string[] = [];
					page.on( 'console', message => collectConsoleErrors( consoleErrors, message ) );
					await installJetpackAiEvidenceCollector( page );

					let editorPage: EditorPage | undefined;
					let editorParent: Locator | undefined;
					let targetClientId = '';
					let finalParagraphs: ParagraphState[] = [];

					try {
						await test.step( 'Given the prepared target draft is saved and refreshed with Jetpack AI', async () => {
							const prepared = await prepareTargetEditor( page, testInfo, editorTarget, parent =>
								replaceDraftContent( parent, ability.targetContent )
							);
							editorPage = prepared.editorPage;
							editorParent = prepared.editorParent;
						} );

						await test.step( 'And I select the paragraph that needs grammar correction', async () => {
							const paragraphs = await readParagraphs( editorParent! );
							const target = paragraphs.find( block => block.content === ability.targetContent );
							expect(
								target,
								'The deterministic target block should survive the refresh.'
							).toBeDefined();
							targetClientId = target!.clientId;
							await focusEditorBlock( editorParent!, editorPage!, targetClientId );
						} );

						await test.step( `And I open Agents Manager and run ${ ability.name }`, async () => {
							const chat = await openAgentsManager( editorParent! );
							await startFreshChat( chat );
							await focusEditorBlock( editorParent!, editorPage!, targetClientId );
							await clickSuggestion(
								chat,
								ability.suggestionName,
								ability.parentSuggestionName,
								ability.expectedPrompt
							);
						} );

						await test.step( 'Then the configured selected-block route is called', async () => {
							await expectConfiguredSelectedBlockRoute(
								page,
								targetClientId,
								ability.targetContent
							);
							const evidence = await readJetpackAiBrowserEvidence( page );
							expect(
								evidence.streams.some( stream =>
									stream.requestBody.includes( ability.expectedPrompt )
								),
								`The streamed request should contain the ${ ability.name } prompt.`
							).toBe( true );
						} );

						await test.step( 'And only the selected block is changed', async () => {
							await expect
								.poll(
									async () => {
										finalParagraphs = await readParagraphs( editorParent! );
										return (
											finalParagraphs.length === 2 &&
											finalParagraphs.some( block => block.content === CONTROL_CONTENT ) &&
											finalParagraphs.some(
												block =>
													block.content !== CONTROL_CONTENT &&
													block.content !== ability.targetContent
											)
										);
									},
									{ timeout: 60 * 1000 }
								)
								.toBe( true );
							const changedTarget = finalParagraphs.find(
								block => block.content !== CONTROL_CONTENT
							);
							expect( changedTarget ).toBeDefined();
							ability.assertResult( changedTarget!.content );
							expect(
								finalParagraphs.find( block => block.content === CONTROL_CONTENT )
							).toBeDefined();
						} );
					} finally {
						const evidence = await readJetpackAiBrowserEvidence( page ).catch( () => ( {
							blockActionCompletions: 0,
							streams: [],
							toolCalls: [],
						} ) );
						await testInfo.attach( 'jetpack-ai-sidebar-run.json', {
							body: JSON.stringify(
								{
									...summarizeDiagnostics( consoleErrors, evidence ),
									targetClientId,
									finalParagraphs,
								},
								null,
								2
							),
							contentType: 'application/json',
						} );
					}
				} );
			}

			for ( const ability of EDITOR_FIELD_ABILITY_CASES ) {
				test( `As a writer, I can run ${ ability.name } in the ${ editorTarget.postType } editor and apply a generated value when supported`, async ( {
					page,
				}, testInfo ) => {
					test.setTimeout( 4 * 60 * 1000 );

					const consoleErrors: string[] = [];
					page.on( 'console', message => collectConsoleErrors( consoleErrors, message ) );
					await installJetpackAiEvidenceCollector( page );

					let editorParent: Locator | undefined;
					let finalFields: EditorFieldState | undefined;
					let abilitySupported = true;

					try {
						await test.step( `Given the prepared target ${ editorTarget.postType } is saved and refreshed with Jetpack AI`, async () => {
							const prepared = await prepareTargetEditor(
								page,
								testInfo,
								editorTarget,
								replaceDraftContent
							);
							editorParent = prepared.editorParent;
							abilitySupported = ability.field !== 'excerpt' || prepared.supportsExcerpt;
							await clearSelectedBlock( editorParent );
						} );

						await test.step( `And I run ${ ability.name } from Agents Manager`, async () => {
							const chat = await openAgentsManager( editorParent! );
							await startFreshChat( chat );
							// eslint-disable-next-line playwright/no-conditional-in-test -- Excerpt availability is a post-type capability.
							if ( ! abilitySupported ) {
								const writingToggle = chat.getByRole( 'button', { name: /^Writing/ } );
								// eslint-disable-next-line playwright/no-conditional-in-test -- The group is rendered only on grouped suggestion surfaces.
								if ( await writingToggle.isVisible() ) {
									await writingToggle.click();
								}
								// eslint-disable-next-line playwright/no-conditional-expect -- Unsupported excerpt fields must hide the suggestion.
								await expect(
									chat.getByRole( 'button', { name: ability.suggestionName } )
								).toHaveCount( 0 );
								return;
							}
							await clickSuggestion(
								chat,
								ability.suggestionName,
								ability.parentSuggestionName,
								ability.expectedPrompt
							);
						} );

						await test.step( 'Then the semantic ability returns the expected picker', async () => {
							// eslint-disable-next-line playwright/no-conditional-in-test -- Unsupported excerpt fields have no picker.
							if ( ! abilitySupported ) {
								return;
							}
							await expect
								.poll(
									async () => {
										const evidence = await readJetpackAiBrowserEvidence( page );
										return {
											abilityCount: evidence.toolCalls.filter(
												call => call.name === ability.abilityTool
											).length,
											componentType: getLastToolCall( evidence.toolCalls, SHOW_COMPONENT_TOOL )
												?.arguments.type,
										};
									},
									{ timeout: 2 * 60 * 1000 }
								)
								.toEqual( { abilityCount: 1, componentType: ability.componentType } );
							const evidence = await readJetpackAiBrowserEvidence( page );
							expect(
								evidence.streams.some( stream =>
									stream.requestBody.includes( ability.expectedPrompt )
								)
							).toBe( true );
						} );

						await test.step( `And applying the picker changes only the ${ ability.field } field`, async () => {
							// eslint-disable-next-line playwright/no-conditional-in-test -- Unsupported excerpt fields have nothing to apply.
							if ( ! abilitySupported ) {
								return;
							}
							const chat = editorParent!.locator( '.agents-manager-chat' );
							const pickerIntro = chat.getByText( ability.pickerIntro, { exact: false } );
							await expect( pickerIntro ).toBeVisible( { timeout: 60 * 1000 } );
							const picker = pickerIntro.locator( '..' );
							await picker.getByRole( 'button' ).first().click();
							await expect
								.poll( async () => ( await readEditorFields( editorParent! ) )[ ability.field ] )
								.not.toBe( BASELINE_EDITOR_FIELDS[ ability.field ] );
							finalFields = await readEditorFields( editorParent! );
							expect( omitEditorField( finalFields, ability.field ) ).toEqual(
								omitEditorField( BASELINE_EDITOR_FIELDS, ability.field )
							);
							expect( await readParagraphs( editorParent! ) ).toEqual( [
								expect.objectContaining( { content: BASELINE_CONTENT } ),
								expect.objectContaining( { content: CONTROL_CONTENT } ),
							] );
						} );
					} finally {
						const evidence = await readJetpackAiBrowserEvidence( page ).catch( () => ( {
							blockActionCompletions: 0,
							streams: [],
							toolCalls: [],
						} ) );
						await testInfo.attach( 'jetpack-ai-sidebar-run.json', {
							body: JSON.stringify(
								{ ...summarizeDiagnostics( consoleErrors, evidence ), finalFields },
								null,
								2
							),
							contentType: 'application/json',
						} );
					}
				} );
			}

			for ( const ability of IMAGE_ABILITY_CASES ) {
				test( `As a writer, I can run ${ ability.name } in the ${ editorTarget.postType } editor and apply it`, async ( {
					page,
				}, testInfo ) => {
					test.setTimeout( 5 * 60 * 1000 );

					const consoleErrors: string[] = [];
					page.on( 'console', message => collectConsoleErrors( consoleErrors, message ) );
					await installJetpackAiEvidenceCollector( page );

					let editorPage: EditorPage | undefined;
					let editorParent: Locator | undefined;
					let targetClientId = '';
					let initialImages: ImageBlockState[] = [];
					let finalImages: ImageBlockState[] = [];
					let renderedImageAlts: string[] = [];

					try {
						await test.step( `Given the prepared target ${ editorTarget.postType } has two saved image blocks`, async () => {
							const prepared = await prepareTargetEditor(
								page,
								testInfo,
								editorTarget,
								replaceDraftWithImages
							);
							editorPage = prepared.editorPage;
							editorParent = prepared.editorParent;
							initialImages = await readImages( editorParent );
							targetClientId = await configureImageScope( editorParent, editorPage, ability.scope );
						} );

						await test.step( `When I run ${ ability.name } from Agents Manager`, async () => {
							const chat = await openAgentsManager( editorParent! );
							await startFreshChat( chat );
							targetClientId = await configureImageScope(
								editorParent!,
								editorPage!,
								ability.scope
							);
							await clickSuggestion(
								chat,
								ability.suggestionName,
								ability.parentSuggestionName,
								ability.expectedPrompt
							);
						} );

						await test.step( 'Then the image-alt-text ability has the correct scope', async () => {
							await expect
								.poll(
									async () => {
										const evidence = await readJetpackAiBrowserEvidence( page );
										return {
											abilityCount: evidence.toolCalls.filter(
												call => call.name === 'jetpack_ai__generate_seo_image_alt_text'
											).length,
											componentType: getLastToolCall( evidence.toolCalls, SHOW_COMPONENT_TOOL )
												?.arguments.type,
										};
									},
									{ timeout: 3 * 60 * 1000 }
								)
								.toEqual( { abilityCount: 1, componentType: 'image-alt-text-picker' } );
							const evidence = await readJetpackAiBrowserEvidence( page );
							expect(
								evidence.streams.some( stream =>
									stream.requestBody.includes( ability.expectedPrompt )
								)
							).toBe( true );
							const abilityCall = evidence.toolCalls.find(
								call => call.name === 'jetpack_ai__generate_seo_image_alt_text'
							);
							assertImageAbilityArguments( abilityCall?.arguments, ability.scope );
						} );

						await test.step( 'And applying the picker updates exactly the intended image blocks', async () => {
							const chat = editorParent!.locator( '.agents-manager-chat' );
							const applyButton = chat.getByRole( 'button', {
								name: ability.applyButtonName,
								exact: true,
							} );
							await expect( applyButton ).toBeVisible( { timeout: 60 * 1000 } );
							await applyButton.click();
							await expect
								.poll(
									async () => {
										finalImages = await readImages( editorParent! );
										renderedImageAlts = await readRenderedImageAlts( editorPage! );
										return {
											persistedBlocksUpdated: hasExpectedImageMutation(
												ability.scope,
												initialImages,
												finalImages
											),
											renderedImagesUpdated: hasExpectedRenderedImageMutation(
												ability.scope,
												initialImages,
												renderedImageAlts
											),
										};
									},
									{ timeout: 30 * 1000 }
								)
								.toEqual( { persistedBlocksUpdated: true, renderedImagesUpdated: true } );
							assertImageMutation( ability.scope, initialImages, finalImages );
							expect( await readEditorFields( editorParent! ) ).toEqual( BASELINE_EDITOR_FIELDS );
							await expect(
								chat.getByText( /Updated the HTML alt text attribute for \d+ images?\./ )
							).toBeVisible();
						} );
					} finally {
						const evidence = await readJetpackAiBrowserEvidence( page ).catch( () => ( {
							blockActionCompletions: 0,
							streams: [],
							toolCalls: [],
						} ) );
						await testInfo.attach( 'jetpack-ai-sidebar-run.json', {
							body: JSON.stringify(
								{
									...summarizeDiagnostics( consoleErrors, evidence ),
									targetClientId,
									initialImages,
									finalImages,
									renderedImageAlts,
								},
								null,
								2
							),
							contentType: 'application/json',
						} );
					}
				} );
			}

			for ( const ability of REVIEW_ABILITY_CASES ) {
				test( `As a writer, I can run ${ ability.name } in the ${ editorTarget.postType } editor and apply a block edit`, async ( {
					page,
				}, testInfo ) => {
					test.setTimeout( 6 * 60 * 1000 );

					const consoleErrors: string[] = [];
					page.on( 'console', message => collectConsoleErrors( consoleErrors, message ) );
					await installJetpackAiEvidenceCollector( page );

					let editorPage: EditorPage | undefined;
					let editorParent: Locator | undefined;
					let targetClientId = '';
					let finalParagraphs: ParagraphState[] = [];

					try {
						await test.step( `Given the prepared target ${ editorTarget.postType } has saved review content`, async () => {
							const prepared = await prepareTargetEditor( page, testInfo, editorTarget, parent =>
								replaceDraftContent( parent, ability.targetContent )
							);
							editorPage = prepared.editorPage;
							editorParent = prepared.editorParent;
							const target = ( await readParagraphs( editorParent ) ).find(
								paragraph => paragraph.content === ability.targetContent
							);
							expect( target ).toBeDefined();
							targetClientId = target!.clientId;
							await configureReviewTarget(
								editorParent,
								editorPage,
								targetClientId,
								ability.selectTargetBlock === true
							);
						} );

						await test.step( `When I run ${ ability.name } from Agents Manager`, async () => {
							const chat = await openAgentsManager( editorParent! );
							await startFreshChat( chat );
							await configureReviewTarget(
								editorParent!,
								editorPage!,
								targetClientId,
								ability.selectTargetBlock === true
							);
							await clickSuggestion(
								chat,
								ability.suggestionName,
								undefined,
								ability.expectedPrompt
							);
						} );

						await test.step( 'Then the semantic review ability returns the expected component', async () => {
							let semanticState: {
								abilityCount: number;
								componentType: unknown;
								toolError: boolean;
								streamComplete: boolean;
							} = {
								abilityCount: 0,
								componentType: undefined,
								toolError: false,
								streamComplete: false,
							};
							await expect
								.poll(
									async () => {
										const evidence = await readJetpackAiBrowserEvidence( page );
										semanticState = {
											abilityCount: evidence.toolCalls.filter(
												call => call.name === ability.abilityTool
											).length,
											componentType: getLastToolCall( evidence.toolCalls, SHOW_COMPONENT_TOOL )
												?.arguments.type,
											toolError: hasToolError( evidence ),
											streamComplete: evidence.streams.some( stream =>
												stream.body.includes( '"state":"completed"' )
											),
										};
										return {
											abilityCount: semanticState.abilityCount,
											settled:
												semanticState.componentType === ability.componentType ||
												semanticState.toolError ||
												semanticState.streamComplete,
										};
									},
									{ timeout: 4 * 60 * 1000 }
								)
								.toEqual( { abilityCount: 1, settled: true } );
							// eslint-disable-next-line playwright/no-conditional-in-test -- Service errors should fail immediately instead of timing out on a missing component.
							if ( semanticState.toolError ) {
								throw new Error(
									`${ ability.name } failed because the AI service returned a tool error.`
								);
							}
							expect( semanticState.componentType ).toBe( ability.componentType );
							const evidence = await readJetpackAiBrowserEvidence( page );
							expect(
								evidence.streams.some( stream =>
									stream.requestBody.includes( ability.expectedPrompt )
								)
							).toBe( true );
						} );

						await test.step( 'And applying a review action changes only the target block', async () => {
							const chat = editorParent!.locator( '.agents-manager-chat' );
							const applyButton = chat
								.getByRole( 'button', { name: ability.applyButtonName } )
								.first();
							await expect( applyButton ).toBeVisible( { timeout: 90 * 1000 } );
							await applyButton.click();
							await expect
								.poll(
									async () => {
										finalParagraphs = await readParagraphs( editorParent! );
										return finalParagraphs.find(
											paragraph => paragraph.clientId === targetClientId
										)?.content;
									},
									{ timeout: 60 * 1000 }
								)
								.not.toBe( ability.targetContent );
							const changedTarget = finalParagraphs.find(
								paragraph => paragraph.clientId === targetClientId
							);
							expect( changedTarget ).toBeDefined();
							ability.assertResult( changedTarget!.content );
							expect(
								finalParagraphs.find( paragraph => paragraph.content === CONTROL_CONTENT )
							).toBeDefined();
							await expect
								.poll(
									async () => ( await readJetpackAiBrowserEvidence( page ) ).blockActionCompletions,
									{ timeout: 60 * 1000 }
								)
								.toBe( 1 );
						} );
					} finally {
						const evidence = await readJetpackAiBrowserEvidence( page ).catch( () => ( {
							blockActionCompletions: 0,
							streams: [],
							toolCalls: [],
						} ) );
						await testInfo.attach( 'jetpack-ai-sidebar-run.json', {
							body: JSON.stringify(
								{
									...summarizeDiagnostics( consoleErrors, evidence ),
									targetClientId,
									finalParagraphs,
								},
								null,
								2
							),
							contentType: 'application/json',
						} );
					}
				} );
			}
		}
	} );
} );
