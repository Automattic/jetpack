/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Fill, Button, SVG, Path, Polygon } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

const JetpackIcon = () => (
	<SVG width="16" height="16" viewBox="0 0 32 32">
		<Path fill="#069e08" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z" />
		<Polygon fill="#fff" points="15,19 7,19 15,3" />
		<Polygon fill="#fff" points="17,29 17,13 25,13" />
	</SVG>
);

/**
 * The "Generate With Jetpack" button rendered inside the
 * ContentGuidelineSectionActions slot on the Content Guidelines page.
 *
 * @param {object}   props
 * @param {string}   props.slug        - Guideline section slug (site, copy, images, additional).
 * @param {string}   props.draft       - Current textarea content.
 * @param {Function} props.onGenerated - Callback to push generated text back into the textarea.
 * @return {import('react').ReactElement} The generate button component.
 */
function GenerateButton( { slug, draft, onGenerated } ) {
	const [ loading, setLoading ] = useState( false );

	const handleGenerate = async () => {
		setLoading( true );
		try {
			const body = {
				sections: [ slug ],
			};

			if ( draft ) {
				body.existing_content = { [ slug ]: draft };
			}

			const response = await apiFetch( {
				path: '/wpcom/v2/jetpack-ai/suggest-guidelines',
				method: 'POST',
				data: body,
			} );

			const generated = response?.suggestions?.[ slug ];
			if ( generated ) {
				onGenerated( generated );
			}
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Jetpack AI guidelines generation failed:', error );
		} finally {
			setLoading( false );
		}
	};

	return (
		<Button
			variant="secondary"
			icon={ <JetpackIcon /> }
			onClick={ handleGenerate }
			isBusy={ loading }
			disabled={ loading }
		>
			{ loading ? __( 'Generating…', 'jetpack' ) : __( 'Generate With Jetpack', 'jetpack' ) }
		</Button>
	);
}

const SECTIONS = [ 'site', 'copy', 'images', 'additional' ];

function ContentGuidelinesAIFill() {
	return (
		<>
			{ SECTIONS.map( section => (
				<Fill key={ section } name={ `ContentGuidelineSectionActions/${ section }` }>
					{ fillProps => <GenerateButton { ...fillProps } /> }
				</Fill>
			) ) }
		</>
	);
}

registerPlugin( 'jetpack-content-guidelines-ai', {
	scope: 'content-guidelines',
	render: ContentGuidelinesAIFill,
} );
