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
export const IMAGE_STYLE_AUTO = 'auto';
export const IMAGE_STYLE_NONE = 'none';

export type ImageStyle =
	| typeof IMAGE_STYLE_ENHANCE
	| typeof IMAGE_STYLE_ANIME
	| typeof IMAGE_STYLE_PHOTOGRAPHIC
	| typeof IMAGE_STYLE_DIGITAL_ART
	| typeof IMAGE_STYLE_COMICBOOK
	| typeof IMAGE_STYLE_FANTASY_ART
	| typeof IMAGE_STYLE_ANALOG_FILM
	| typeof IMAGE_STYLE_NEONPUNK
	| typeof IMAGE_STYLE_ISOMETRIC
	| typeof IMAGE_STYLE_LOWPOLY
	| typeof IMAGE_STYLE_ORIGAMI
	| typeof IMAGE_STYLE_LINE_ART
	| typeof IMAGE_STYLE_CRAFT_CLAY
	| typeof IMAGE_STYLE_CINEMATIC
	| typeof IMAGE_STYLE_3D_MODEL
	| typeof IMAGE_STYLE_PIXEL_ART
	| typeof IMAGE_STYLE_TEXTURE
	| typeof IMAGE_STYLE_MONTY_PYTHON
	| typeof IMAGE_STYLE_AUTO
	| typeof IMAGE_STYLE_NONE;

export type ImageStyleObject = {
	label: string;
	value: ImageStyle;
};
