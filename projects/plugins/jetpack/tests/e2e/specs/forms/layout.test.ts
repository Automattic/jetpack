import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import logger from '@automattic/_jetpack-e2e-commons/logger';
import type { Frame, Locator, Page } from '@playwright/test';

/**
 * Layout regressions in the Form block are almost always a disagreement between
 * the editor and the front end, and almost always invisible on the theme the
 * developer happens to be running. Two things make that so:
 *
 * 1. A theme with no `theme.json` makes WordPress load
 *    `wp-includes/css/dist/edit-post/classic.min.css` into the editor, which
 *    gives every `.wp-block` a 28px vertical margin and auto inline margins.
 *    Neither reaches a block theme, so a bug can be plainly visible on Twenty
 *    Sixteen and absent on Twenty Twenty-Four.
 * 2. The form renders from React in the editor and from PHP on the front end,
 *    so the two surfaces have different markup for the same content.
 *
 * These tests therefore run the same fixture through both themes and both
 * surfaces, and assert on geometry rather than on CSS properties. That matters:
 * `margin-inline: auto` reports a *used* value of `0px` when there is no free
 * space, so reading computed margins cannot distinguish "the rule is off" from
 * "the rule has nothing to do". Positions and widths are what a user sees.
 */

const CLASSIC_THEME = 'twentysixteen';
const BLOCK_THEME = 'twentytwentyfour';

/**
 * A form holding the three things that have broken before: a plain field, a
 * Group with its own children, and a Columns block.
 */
const SINGLE_STEP_FORM = `<!-- wp:jetpack/contact-form {"subject":"Layout test","layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/field-name -->
<div><!-- wp:jetpack/label {"label":"Full name"} /-->

<!-- wp:jetpack/input {"type":"text"} /--></div>
<!-- /wp:jetpack/field-name -->

<!-- wp:group -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Group para one</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Group para two</p>
<!-- /wp:paragraph -->

<!-- wp:jetpack/field-text -->
<div><!-- wp:jetpack/label {"label":"In group"} /-->

<!-- wp:jetpack/input {"type":"text"} /--></div>
<!-- /wp:jetpack/field-text --></div>
<!-- /wp:group -->

<!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:jetpack/field-text -->
<div><!-- wp:jetpack/label {"label":"Column one"} /-->

<!-- wp:jetpack/input {"type":"text"} /--></div>
<!-- /wp:jetpack/field-text --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:jetpack/field-text -->
<div><!-- wp:jetpack/label {"label":"Column two"} /-->

<!-- wp:jetpack/input {"type":"text"} /--></div>
<!-- /wp:jetpack/field-text --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:jetpack/contact-form -->`;

/**
 * A multistep form. The step is a flex container that carries no
 * `is-layout-flex` class, which is what lets core's classic-theme rule centre
 * its children, and it is `flex-direction: column`, which is why a `flex-basis`
 * of 100% sizes the height rather than the width.
 */
const MULTISTEP_FORM = `<!-- wp:jetpack/contact-form {"subject":"Multistep layout test","variationName":"multistep","layout":{"type":"flex","flexWrap":"nowrap","orientation":"vertical","justifyContent":"left","verticalAlignment":"top"}} -->
<div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/form-progress-indicator /-->

<!-- wp:jetpack/form-step-container -->
<div class="jetpack-form-steps-wrapper"><div class="wp-block-jetpack-form-step-container jetpack-form-step-container"><!-- wp:jetpack/form-step {"stepLabel":"Step one"} -->
<div class="wp-block-jetpack-form-step"><!-- wp:paragraph {"textAlign":"center"} -->
<p class="has-text-align-center">Step para</p>
<!-- /wp:paragraph -->

<!-- wp:jetpack/field-text {"width":50} -->
<div><!-- wp:jetpack/label {"label":"Half field"} /-->

<!-- wp:jetpack/input {"type":"text"} /--></div>
<!-- /wp:jetpack/field-text -->

<!-- wp:jetpack/field-name -->
<div><!-- wp:jetpack/label {"label":"Step name"} /-->

<!-- wp:jetpack/input {"type":"text"} /--></div>
<!-- /wp:jetpack/field-name --></div>
<!-- /wp:jetpack/form-step --></div></div>
<!-- /wp:jetpack/form-step-container --></div>
<!-- /wp:jetpack/contact-form -->`;

/**
 * The editor and the front end render the same form from different code, so
 * each probe needs its own selectors. Everything is resolved relative to the
 * form element, so theme chrome elsewhere on the page cannot be picked up by
 * accident.
 */
type Selectors = {
	form: string;
	field: string;
	label: string;
	input: string;
	group: string;
	para: string;
	column: string;
	step: string;
	stepPara: string;
	halfField: string;
};

const EDITOR_SELECTORS: Selectors = {
	form: '.jetpack-contact-form',
	field: '[data-type="jetpack/field-name"]',
	label: '[data-type="jetpack/label"]',
	input: '[data-type="jetpack/input"]',
	group: '[data-type="core/group"]',
	para: '[data-type="core/paragraph"]',
	column: '[data-type="core/column"]',
	step: '.wp-block-jetpack-form-step',
	stepPara: '[data-type="core/paragraph"]',
	halfField: '[data-type="jetpack/field-text"]',
};

const FRONT_END_SELECTORS: Selectors = {
	form: '.wp-block-jetpack-contact-form',
	field: '.grunion-field-name-wrap',
	label: 'label',
	input: 'input',
	group: '.wp-block-group',
	para: 'p',
	column: '.wp-block-column',
	step: '.wp-block-jetpack-form-step',
	stepPara: 'p',
	halfField: '.grunion-field-width-50-wrap',
};

type SingleStepMetrics = {
	formWidth: number;
	labelInputGap: number | null;
	groupWidth: number | null;
	groupFillsForm: boolean | null;
	groupParagraphGap: number | null;
	columnCount: number;
	columnsSideBySide: boolean | null;
};

type MultistepMetrics = {
	stepWidth: number | null;
	paragraphWidth: number | null;
	paragraphFillsStep: boolean | null;
	paragraphOffsetLeft: number | null;
	paragraphTextAlign: string | null;
	halfFieldWidth: number | null;
	halfFieldOffsetLeft: number | null;
	halfFieldIsAboutHalf: boolean | null;
};

/**
 * Measures the single-step fixture.
 *
 * @param root - Locator for the form element, in the editor canvas or on the page.
 * @param sel  - Selectors for the surface being measured.
 * @return The measured geometry.
 */
function measureSingleStep( root: Locator, sel: Selectors ): Promise< SingleStepMetrics > {
	return root.evaluate( ( form: HTMLElement, s: Selectors ) => {
		const box = ( el: Element | null ) => {
			if ( ! el ) {
				return null;
			}
			const r = el.getBoundingClientRect();
			return {
				left: Math.round( r.left ),
				right: Math.round( r.right ),
				top: Math.round( r.top ),
				bottom: Math.round( r.bottom ),
				width: Math.round( r.width ),
			};
		};
		const gap = ( a: ReturnType< typeof box >, b: ReturnType< typeof box > ) =>
			a && b ? Math.round( b.top - a.bottom ) : null;

		const formBox = box( form );
		const field = form.querySelector( s.field );
		const labelBox = box( field ? field.querySelector( s.label ) : null );
		const inputBox = box( field ? field.querySelector( s.input ) : null );

		const group = form.querySelector( s.group );
		const groupBox = box( group );
		const paras = group ? Array.from( group.querySelectorAll( s.para ) ).map( box ) : [];

		const columns = Array.from( form.querySelectorAll( s.column ) ).map( box );

		return {
			formWidth: formBox ? formBox.width : 0,
			labelInputGap: gap( labelBox, inputBox ),
			groupWidth: groupBox ? groupBox.width : null,
			groupFillsForm:
				groupBox && formBox ? Math.abs( groupBox.width - formBox.width ) <= 2 : null,
			groupParagraphGap: paras.length > 1 ? gap( paras[ 0 ], paras[ 1 ] ) : null,
			columnCount: columns.length,
			columnsSideBySide:
				columns.length > 1 && columns[ 0 ] && columns[ 1 ]
					? columns[ 0 ].right <= columns[ 1 ].left + 2
					: null,
		};
	}, sel );
}

/**
 * Measures the multistep fixture.
 *
 * @param root - Locator for the form element, in the editor canvas or on the page.
 * @param sel  - Selectors for the surface being measured.
 * @return The measured geometry.
 */
function measureMultistep( root: Locator, sel: Selectors ): Promise< MultistepMetrics > {
	return root.evaluate( ( form: HTMLElement, s: Selectors ) => {
		const box = ( el: Element | null ) => {
			if ( ! el ) {
				return null;
			}
			const r = el.getBoundingClientRect();
			return { left: Math.round( r.left ), width: Math.round( r.width ) };
		};

		// The editor and the front end both nest an element that repeats the
		// step class, so take the innermost one — that is the flex row container
		// whose children are the step's blocks.
		const steps = Array.from( form.querySelectorAll( s.step ) );
		const step = steps[ steps.length - 1 ] as HTMLElement | undefined;
		if ( ! step ) {
			return {
				stepWidth: null,
				paragraphWidth: null,
				paragraphFillsStep: null,
				paragraphOffsetLeft: null,
				paragraphTextAlign: null,
				halfFieldWidth: null,
				halfFieldOffsetLeft: null,
				halfFieldIsAboutHalf: null,
			};
		}

		const stepBox = box( step );
		const paraEl = step.querySelector( s.stepPara );
		const paraBox = box( paraEl );
		const halfBox = box( step.querySelector( s.halfField ) );

		return {
			stepWidth: stepBox ? stepBox.width : null,
			paragraphWidth: paraBox ? paraBox.width : null,
			paragraphFillsStep:
				paraBox && stepBox ? Math.abs( paraBox.width - stepBox.width ) <= 2 : null,
			paragraphOffsetLeft: paraBox && stepBox ? paraBox.left - stepBox.left : null,
			paragraphTextAlign: paraEl ? getComputedStyle( paraEl ).textAlign : null,
			halfFieldWidth: halfBox ? halfBox.width : null,
			halfFieldOffsetLeft: halfBox && stepBox ? halfBox.left - stepBox.left : null,
			// A half-width field is `calc(50% - gap)` on the front end, so it
			// lands a block-gap short of half — 24px on Twenty Sixteen, 19px on
			// Twenty Twenty-Four. The tolerance only has to separate "half" from
			// "full", which is half a step away, so keep it well clear of the
			// theme's gap rather than tight to today's numbers.
			halfFieldIsAboutHalf:
				halfBox && stepBox ? Math.abs( halfBox.width - stepBox.width / 2 ) <= 40 : null,
		};
	}, sel );
}

/**
 * Waits for the editor canvas to have painted the form.
 *
 * @param page - The page.
 */
async function waitForEditorCanvas( page: Page ): Promise< Frame > {
	await page.waitForFunction( () => {
		const frame = document.querySelector< HTMLIFrameElement >(
			'iframe[name="editor-canvas"]'
		);
		const doc = frame ? frame.contentDocument : document;
		return !! doc?.querySelector( '.jetpack-contact-form' );
	} );
	const frame = page.frames().find( f => f.name() === 'editor-canvas' );
	return frame ?? page.mainFrame();
}

for ( const theme of [ CLASSIC_THEME, BLOCK_THEME ] ) {
	test.describe( `Form block layout: ${ theme }`, () => {
		let singleStepPageId: number;
		let multistepPageId: number;

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( theme );

			const single = await requestUtils.createPage( {
				title: `Form layout single step (${ theme })`,
				content: SINGLE_STEP_FORM,
				status: 'publish',
			} );
			singleStepPageId = single.id;

			const multi = await requestUtils.createPage( {
				title: `Form layout multistep (${ theme })`,
				content: MULTISTEP_FORM,
				status: 'publish',
			} );
			multistepPageId = multi.id;
		} );

		test.afterAll( async ( { requestUtils } ) => {
			// `deletePage` is not bound onto RequestUtils, so go through REST.
			for ( const id of [ singleStepPageId, multistepPageId ] ) {
				await requestUtils.rest( {
					method: 'DELETE',
					path: `/wp/v2/pages/${ id }`,
					params: { force: true },
				} );
			}
		} );

		test( 'editor: a field keeps its label on its input, and containers fill the form', async ( {
			admin,
			page,
			editor,
		} ) => {
			await admin.editPost( singleStepPageId );
			await waitForEditorCanvas( page );

			const metrics = await measureSingleStep(
				editor.canvas.locator( EDITOR_SELECTORS.form ).first(),
				EDITOR_SELECTORS
			);
			logger.debug( `editor/${ theme } single step: ${ JSON.stringify( metrics ) }` );

			// The bug this guards: on a theme with no theme.json, core gives every
			// block a 28px vertical margin, which pushes a field's label a full
			// line off its own input.
			expect( metrics.labelInputGap ).not.toBeNull();
			expect( metrics.labelInputGap ).toBeLessThanOrEqual( 8 );

			// A Group added to a form fills the form, so fields nested in it are
			// usable rather than shrink-wrapped.
			expect( metrics.groupFillsForm ).toBe( true );

			// ...but the Group still spaces its *own* children. Collapsing this is
			// the regression that the container-width fix originally introduced.
			expect( metrics.groupParagraphGap ).not.toBeNull();
			expect( metrics.groupParagraphGap as number ).toBeGreaterThan( 0 );

			// Columns stay side by side rather than stacking.
			expect( metrics.columnCount ).toBe( 2 );
			expect( metrics.columnsSideBySide ).toBe( true );
		} );

		test( 'front end: the same form has the same shape', async ( { page } ) => {
			await page.goto( `/?page_id=${ singleStepPageId }` );

			const metrics = await measureSingleStep(
				page.locator( FRONT_END_SELECTORS.form ).first(),
				FRONT_END_SELECTORS
			);
			logger.debug( `front/${ theme } single step: ${ JSON.stringify( metrics ) }` );

			expect( metrics.labelInputGap ).not.toBeNull();
			expect( metrics.labelInputGap ).toBeLessThanOrEqual( 12 );
			expect( metrics.groupFillsForm ).toBe( true );
			expect( metrics.columnCount ).toBe( 2 );
			expect( metrics.columnsSideBySide ).toBe( true );
		} );

		test( 'editor: a step lays its blocks out full width and flush left', async ( {
			admin,
			page,
			editor,
		} ) => {
			await admin.editPost( multistepPageId );
			await waitForEditorCanvas( page );

			const metrics = await measureMultistep(
				editor.canvas.locator( EDITOR_SELECTORS.form ).first(),
				EDITOR_SELECTORS
			);
			logger.debug( `editor/${ theme } multistep: ${ JSON.stringify( metrics ) }` );

			test.skip( metrics.stepWidth === null, 'Multistep forms are not enabled on this site.' );

			// Core's classic-theme rule hands a step's children `margin-inline:
			// auto`, and auto margins eat a flex item's free space — which centres
			// them, because the step is a column and this beats its `align-items`.
			expect( metrics.paragraphOffsetLeft ).toBe( 0 );
			expect( metrics.halfFieldOffsetLeft ).toBe( 0 );

			// A step's blocks are full-width rows, so aligning a paragraph's text
			// is actually visible. Without this the box is only as wide as its
			// text and the alignment buttons appear to do nothing.
			expect( metrics.paragraphFillsStep ).toBe( true );
			expect( metrics.paragraphTextAlign ).toBe( 'center' );

			// A field's own width setting still wins over that.
			expect( metrics.halfFieldIsAboutHalf ).toBe( true );
		} );

		test( 'front end: a step lays its blocks out the same way', async ( { page } ) => {
			await page.goto( `/?page_id=${ multistepPageId }` );

			const metrics = await measureMultistep(
				page.locator( FRONT_END_SELECTORS.form ).first(),
				FRONT_END_SELECTORS
			);
			logger.debug( `front/${ theme } multistep: ${ JSON.stringify( metrics ) }` );

			test.skip( metrics.stepWidth === null, 'Multistep forms are not enabled on this site.' );

			expect( metrics.paragraphOffsetLeft ).toBe( 0 );
			expect( metrics.halfFieldOffsetLeft ).toBe( 0 );
			expect( metrics.paragraphFillsStep ).toBe( true );
			expect( metrics.paragraphTextAlign ).toBe( 'center' );
			expect( metrics.halfFieldIsAboutHalf ).toBe( true );
		} );
	} );
}
