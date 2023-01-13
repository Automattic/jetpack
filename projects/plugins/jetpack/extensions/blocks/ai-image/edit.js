import apiFetch from '@wordpress/api-fetch';
import { useBlockProps, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	Button,
	Placeholder,
	TextareaControl,
	Flex,
	FlexBlock,
	FlexItem,
	Spinner,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

function getRandomItem( arr ) {
	// get random index value
	const randomIndex = Math.floor( Math.random() * arr.length );
	return arr[ randomIndex ];
}

const PLACEHOLDER = getRandomItem( [
	'earth reviving after human extinction, a new beginning, nature taking over buildings, animal kingdom, harmony, peace, earth balanced --version 3 --s 1250 --uplight --ar 4:3 --no text, blur',
	'Freeform ferrofluids, beautiful dark chaos, swirling black frequency --ar 3:4 --iw 9 --q 2 --s 1250',
	'a home built in a huge Soap bubble, windows, doors, porches, awnings, middle of SPACE, cyberpunk lights, Hyper Detail, 8K, HD, Octane Rendering, Unreal Engine, V-Ray, full hd -- s5000 --uplight --q 3 --stop 80--w 0.5 --ar 1:3',
	'photo of an extremely cute alien fish swimming an alien habitable underwater planet, coral reefs, dream-like atmosphere, water, plants, peaceful, serenity, calm ocean, tansparent water, reefs, fish, coral, inner peace, awareness, silence, nature, evolution --version 3 --s 42000 --uplight --ar 4:3 --no text, blur',
	'Rubber Duck Aliens visiting the Earth for the first time, hyper-realistic, cinematic, detailed --ar 16:9',
	'rubber duck duke ellington. Harlem jazz club. Singing. Mic. Ambience',
	'viking north druid lich mermaid king wise old man god of death witch pagan face portrait, underwater, covered in runes, crown made of bones, necromancer, zdzisław beksiński, mikhail vrubel, hr giger, gustav klimt, symmetry, mystical occult symbol in real life, high detail, green light --ar 9:16',
	'full body character + beautiful female neopunk wizard opening a portal to the sidereal multiverse :: Mandelbrot neuro web :: intricate galaxy inlay + ultra high detail, plasma neon internal glow, precise :: consciousness projection :: astral projection :: laser sharp, octane render + unreal render + photo real :: 8k, volumetric lighting high contrast --uplight --quality 2 --stop 80 --ar 9:16',
	'hyerophant, god light, cinematic look, octane render, under water, --wallpaper',
	'Reunion of man, team, squad, cyberpunk, abstract, full hd render + 3d octane render +4k UHD + immense detail + dramatic lighting + well lit + black, purple, blue, pink, cerulean, teal, metallic colours, + fine details + octane render + 8k',
	'Lovecraftian character Cthulhu, with the hunter hat, and the saw cleaver, with bloodborne weapons, full body, in the style bloodborne style, full body, dark fantasy, trending on ArtStation, --ar 4:5',
	'Swirls :: fog :: phantom + ghost + dog + glowing eyes + bright silver ::3 smoke + shine + sphere:: black paper + elements + dark grey + dark blue + neon + baroque + rococo + white + ink + tarot card with ornate border frame + sébastien mitton, viktor antonov, sergey kolesov, detailed, intricate ink illustration + magic + glow --ar 63:88',
	'tyriel archangel, king shamn , avatar , swords , angel wings . 4k , unreal engine --wallpaper',
	'ultra quality. hyper realistic smiling rubber duck with 4 wings, intricate silver, intricate brown and orange, neon armor, ornate, cinematic lighting, floral, symetric, portrait, statue cyberpunk, abstract, full hd render + 3d octane render +4k UHD + immense detail + dramatic lighting + well lit + black, purple, blue, pink, cerulean, teal, metallic colours, + fine details + octane render + 8k, abstract',
	'Tentacles + marble + ebony ::3 fog + smoke + shine + sphere:: black paper + elements + dark grey + dark purple + neon + baroque + rococo + white + ink + tarot card with ornate border frame + sébastien mitton, viktor antonov, sergey kolesov, detailed, intricate ink illustration + magic + glow --ar 63:88',
	'fibonacci, stone, snail, wallpaper, colorful, blue gray green, 3d pattern, 8k',
] );

function getImagesFromOpenAI(
	prompt,
	setAttributes,
	setLoadingImages,
	setResultImages,
	setErrorMessage
) {
	setLoadingImages( true );
	setAttributes( { requestedPrompt: prompt } ); // This will prevent double submitting.

	apiFetch( {
		path: '/wpcom/v2/jetpack-ai/images/generations',
		method: 'POST',
		data: {
			prompt,
		},
	} )
		.then( res => {
			setLoadingImages( false );
			if ( res.error && res.error.message ) {
				setErrorMessage( res.error.message );
				return;
			}
			const images = res.data.map( image => {
				return 'data:image/png;base64,' + image.b64_json;
			} );
			setResultImages( images );
		} )
		.catch( () => {
			setErrorMessage(
				__(
					'Whoops, we have encountered an error. AI is like really, really hard and this is an experimental feature. Please try again later.',
					'jetpack'
				)
			);
			setLoadingImages( false );
		} );
}

/*eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */
export default function Edit( { attributes, setAttributes, clientId } ) {
	const [ loadingImages, setLoadingImages ] = useState( false );
	const [ resultImages, setResultImages ] = useState( [] );
	const [ prompt, setPrompt ] = useState( '' );
	const { replaceBlock } = useDispatch( blockEditorStore );
	const [ errorMessage, setErrorMessage ] = useState( '' );

	const { mediaUpload } = useSelect( select => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return {
			mediaUpload: settings.mediaUpload,
		};
	}, [] );

	const submit = () => {
		setErrorMessage( '' );
		getImagesFromOpenAI(
			prompt.trim() === '' ? PLACEHOLDER : prompt,
			setAttributes,
			setLoadingImages,
			setResultImages,
			setErrorMessage
		);
	};

	return (
		<div { ...useBlockProps() }>
			{ ! loadingImages && errorMessage && (
				<Placeholder
					label={ __( 'AI Image', 'jetpack' ) }
					notices={ [ <div>{ errorMessage }</div> ] }
				>
					<TextareaControl
						label={ __( 'What would you like to see?', 'jetpack' ) }
						value={ prompt }
						placeholder={ PLACEHOLDER }
						onChange={ setPrompt }
					/>
					<Flex direction="row">
						<FlexItem>
							<Button variant="primary" placeholder={ PLACEHOLDER } onClick={ submit }>
								{ __( 'Retry', 'jetpack' ) }
							</Button>
						</FlexItem>
					</Flex>
				</Placeholder>
			) }
			{ ! errorMessage && ! attributes.requestedPrompt && (
				<Placeholder label={ __( 'AI Image', 'jetpack' ) }>
					<div>
						<TextareaControl
							label={ __( 'What would you like to see?', 'jetpack' ) }
							placeholder={ PLACEHOLDER }
							onChange={ setPrompt }
						/>
						<Button variant="primary" onClick={ submit }>
							{ __( 'Submit', 'jetpack' ) }
						</Button>
					</div>
				</Placeholder>
			) }
			{ ! errorMessage && ! loadingImages && resultImages.length > 0 && (
				<Placeholder label={ __( 'AI Image', 'jetpack' ) }>
					<div>
						<div style={ { textAlign: 'center', margin: '12px', fontStyle: 'italic' } }>
							{ attributes.requestedPrompt }
						</div>
						<div style={ { fontSize: '20px', lineHeight: '38px' } }>
							{ __( 'Please choose your image', 'jetpack' ) }
						</div>
						<Flex direction="row" justify={ 'space-between' }>
							{ resultImages.map( image => (
								<FlexBlock key={ image }>
									<img
										className="wp-block-ai-image-image"
										src={ image }
										alt=""
										onClick={ async () => {
											if ( loadingImages ) {
												return;
											}
											setLoadingImages( true );
											// First convert image to a proper blob file
											const resp = await fetch( image );
											const blob = await resp.blob();
											const file = new File( [ blob ], 'jetpack_ai_image.png', {
												type: 'image/png',
											} );
											// Actually upload the image
											mediaUpload( {
												filesList: [ file ],
												onFileChange: ( [ img ] ) => {
													if ( ! img.id ) {
														// Without this image gets uploaded twice
														return;
													}
													replaceBlock(
														clientId,
														createBlock( 'core/image', {
															url: img.url,
															caption: attributes.requestedPrompt,
															alt: attributes.requestedPrompt,
														} )
													);
												},
												allowedTypes: [ 'image' ],
												onError: message => {
													// eslint-disable-next-line no-console
													console.error( message );
													setLoadingImages( false );
												},
											} );
										} }
									/>
								</FlexBlock>
							) ) }
						</Flex>
					</div>
				</Placeholder>
			) }
			{ ! errorMessage && attributes.content && ! loadingImages && (
				<Placeholder label={ __( 'AI Image', 'jetpack' ) }>
					<div>
						<div className="content">{ attributes.content }</div>
					</div>
				</Placeholder>
			) }
			{ ! errorMessage && loadingImages && (
				<Placeholder label={ __( 'AI Image', 'jetpack' ) }>
					<div style={ { padding: '10px', textAlign: 'center' } }>
						<Spinner
							style={ {
								height: 'calc(4px * 20)',
								width: 'calc(4px * 20)',
							} }
						/>
					</div>
				</Placeholder>
			) }
		</div>
	);
}
