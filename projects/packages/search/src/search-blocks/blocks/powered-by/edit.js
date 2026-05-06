/**
 * Editor preview for jetpack/powered-by.
 *
 * Mirrors the front-end DOM render.php produces. The Inspector exposes a
 * "Hide on the front end" toggle on paid plans only; free-plan sites see an
 * informational note instead because the attribution is enforced
 * server-side regardless of the saved attribute (see render.php and the
 * results-panel auto-inject).
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const isFreePlan = () => !! window?.JetpackSearchBlocksConfig?.isFreePlan;

/**
 * Edit component for the powered-by block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function PoweredByEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jetpack-search-powered-by' } );
	const freePlan = isFreePlan();
	const hide = !! attributes?.hide;
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					{ freePlan ? (
						<p className="jetpack-search-powered-by__free-plan-note">
							{ __(
								'Free-plan sites always display this attribution. Upgrade to hide it.',
								'jetpack-search-pkg'
							) }
						</p>
					) : (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Hide on the front end', 'jetpack-search-pkg' ) }
							checked={ hide }
							onChange={ value => setAttributes( { hide: value } ) }
							help={ __(
								'When enabled, this block stays visible in the editor but is removed from the public page.',
								'jetpack-search-pkg'
							) }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<a
					className="jetpack-search-powered-by__link"
					href="https://jetpack.com/upgrade/search/?utm_source=poweredby"
					rel="external noopener noreferrer nofollow"
					target="_blank"
					onClick={ e => e.preventDefault() }
				>
					<span className="jetpack-search-powered-by__logo" aria-hidden="true">
						{ /* Brand mark — `fill` stays Jetpack Green regardless of the block's color supports. */ }
						<svg width="12" height="12" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
							<path
								fill="#069E08"
								d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z"
							/>
							<polygon fill="#FFFFFF" points="15,19 7,19 15,3 " />
							<polygon fill="#FFFFFF" points="17,29 17,13 25,13 " />
						</svg>
					</span>
					<span className="jetpack-search-powered-by__text">
						{ __( 'Search powered by Jetpack', 'jetpack-search-pkg' ) }
					</span>
				</a>
			</div>
		</>
	);
}
