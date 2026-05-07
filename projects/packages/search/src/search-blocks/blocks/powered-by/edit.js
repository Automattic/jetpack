/**
 * Editor preview for jetpack-search/powered-by.
 *
 * Mirrors the front-end DOM render.php produces. The block has no
 * custom attributes — paid-plan authors who want the colophon gone
 * just delete the block from the panel; free-plan authors can't
 * remove it (search-results/render.php auto-injects it back, see that
 * file for the gate).
 */
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Edit component for the powered-by block.
 *
 * @return {object} Rendered element.
 */
export default function PoweredByEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-search-powered-by' } );
	return (
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
					<svg
						viewBox="0 0 32 32"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
						focusable="false"
					>
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
	);
}
