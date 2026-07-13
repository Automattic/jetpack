/**
 * Editor preview for jetpack-search/ai-answer.
 *
 * The block has no editor-side state — render.php drives the front end via
 * the Interactivity store. The preview here is static markup mirroring the
 * `done` state with a sample answer + citations so authors can see what
 * they're placing without an SSE connection in the editor.
 *
 * AI Answer is a paid feature. On sites without a paid Search plan the
 * preview is replaced with an upgrade Placeholder — mirrors the front-end
 * gate in render.php so authors don't insert a block that won't render. The
 * paid-plan flag is localized onto `window.JetpackSearchBlocksConfig`
 * (`supportsPaidSearch`); the source of truth is the matching PHP gate.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Button, PanelBody, Placeholder, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const SAMPLE_CITATIONS = [
	{ title: 'Getting started with WordPress', url: 'https://example.com/getting-started' },
	{ title: 'Customizing your theme', url: 'https://example.com/customizing' },
];

// Editor preview defaults to "paid" when the localized config isn't present
// (e.g. a Jest harness or a non-enqueued bundle context) so existing tests
// see the full preview and the gate is opt-in via an explicit `false`.
const supportsPaidSearch = () =>
	typeof window === 'undefined' ||
	! window.JetpackSearchBlocksConfig ||
	window.JetpackSearchBlocksConfig.supportsPaidSearch !== false;

const UPGRADE_URL = 'https://jetpack.com/upgrade/search/?utm_source=ai-answer-block';

/**
 * Editor preview component.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function AiAnswerEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();

	if ( ! supportsPaidSearch() ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					label={ __( 'AI Answer', 'jetpack-search-pkg' ) }
					instructions={ __(
						'AI Answer is part of the paid Jetpack Search plan. Upgrade to enable AI-generated answers with citations on your search results.',
						'jetpack-search-pkg'
					) }
				>
					<Button variant="primary" href={ UPGRADE_URL } target="_blank" rel="noopener noreferrer">
						{ __( 'Upgrade Jetpack Search', 'jetpack-search-pkg' ) }
					</Button>
				</Placeholder>
			</div>
		);
	}

	const heading = attributes?.heading?.trim() || __( 'AI answer', 'jetpack-search-pkg' );
	const showCitations = attributes?.showCitations !== false;
	const enableShowMore = attributes?.enableShowMore !== false;
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Heading', 'jetpack-search-pkg' ) }
						value={ attributes?.heading || '' }
						placeholder={ __( 'AI answer', 'jetpack-search-pkg' ) }
						onChange={ value => setAttributes( { heading: value } ) }
						help={ __(
							'Label shown above the answer. Leave empty for the default.',
							'jetpack-search-pkg'
						) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show citations', 'jetpack-search-pkg' ) }
						checked={ showCitations }
						onChange={ value => setAttributes( { showCitations: value } ) }
						help={ __(
							'Display the sources used by the AI under the answer.',
							'jetpack-search-pkg'
						) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Allow "Show more" for a longer answer', 'jetpack-search-pkg' ) }
						checked={ enableShowMore }
						onChange={ value => setAttributes( { enableShowMore: value } ) }
						help={ __(
							'After the brief answer arrives, offer a button that loads a longer, more detailed response.',
							'jetpack-search-pkg'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<h2 className="jp-search-answers-panel__heading">{ heading }</h2>
				<div className="jp-search-answers-panel__content">
					<div className="jp-search-answers-panel__text">
						<p>
							{ __(
								'Once a visitor searches, an AI-generated answer will appear here with citations drawn from your site.',
								'jetpack-search-pkg'
							) }
						</p>
					</div>
					{ showCitations && (
						<ul className="jp-search-answers-panel__citations">
							{ SAMPLE_CITATIONS.map( ( { title, url } ) => (
								<li key={ url }>
									<a href={ url } onClick={ e => e.preventDefault() }>
										{ title }
									</a>
								</li>
							) ) }
						</ul>
					) }
				</div>
				{ enableShowMore && (
					<button
						type="button"
						className="jp-search-answers-panel__toggle"
						onClick={ e => e.preventDefault() }
					>
						{ __( 'Show more', 'jetpack-search-pkg' ) }
						<span className="jp-search-answers-panel__toggle-icon" aria-hidden="true" />
					</button>
				) }
			</div>
		</>
	);
}
