import { __ } from '@wordpress/i18n';

// Styles
export const IMAGE_STYLE_ENHANCE = 'enhance';
export const IMAGE_STYLE_ANIME = 'anime';
export const IMAGE_STYLE_PHOTOGRAPHIC = 'photographic';
export const IMAGE_STYLE_DIGITAL_ART = 'digital-art';
export const IMAGE_STYLE_COMICBOOK = 'comicbook';
export const IMAGE_STYLE_FANTASY_ART = 'fantasy-art';
export const IMAGE_STYLE_ANALOG_FILM = 'analog-film';
export const IMAGE_STYLE_NEONPUNK = 'neonpunk';
export const IMAGE_STYLE_ISOMETRIC = 'isometric';
export const IMAGE_STYLE_LOWPOLY = 'lowpoly';
export const IMAGE_STYLE_ORIGAMI = 'origami';
export const IMAGE_STYLE_LINE_ART = 'line-art';
export const IMAGE_STYLE_CRAFT_CLAY = 'craft-clay';
export const IMAGE_STYLE_CINEMATIC = 'cinematic';
export const IMAGE_STYLE_3D_MODEL = '3d-model';
export const IMAGE_STYLE_PIXEL_ART = 'pixel-art';
export const IMAGE_STYLE_TEXTURE = 'texture';
export const IMAGE_STYLE_MONTY_PYTHON = 'monty-python';

export const IMAGE_STYLE_LABELS = {
	[ IMAGE_STYLE_ENHANCE ]: __( 'Enhance', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_ANIME ]: __( 'Anime', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_PHOTOGRAPHIC ]: __( 'Photographic', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_DIGITAL_ART ]: __( 'Digital Art', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_COMICBOOK ]: __( 'Comicbook', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_FANTASY_ART ]: __( 'Fantasy Art', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_ANALOG_FILM ]: __( 'Analog Film', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_NEONPUNK ]: __( 'Neon Punk', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_ISOMETRIC ]: __( 'Isometric', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_LOWPOLY ]: __( 'Low Poly', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_ORIGAMI ]: __( 'Origami', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_LINE_ART ]: __( 'Line Art', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_CRAFT_CLAY ]: __( 'Craft Clay', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_CINEMATIC ]: __( 'Cinematic', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_3D_MODEL ]: __( '3D Model', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_PIXEL_ART ]: __( 'Pixel Art', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_TEXTURE ]: __( 'Texture', 'jetpack-ai-client' ),
	[ IMAGE_STYLE_MONTY_PYTHON ]: __( 'Monty Python', 'jetpack-ai-client' ),
};

export type ImageStyle = keyof typeof IMAGE_STYLE_LABELS;
