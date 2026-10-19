// The preview's own CSS, inside its shadow root. The form's real stylesheet is linked beside it; this
// only paints what the theme would: type, colors, heading, button, and core's plain form.
export const PREVIEW_CSS = `
:host {
	all: initial;
	display: block;
}

.preview {
	box-sizing: border-box;
	padding: 32px 24px;
	background: var(--jpc-background, #fff);
	color: var(--jpc-color, #1e1e1e);
	font-family: var(--jpc-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
	font-size: var(--jpc-font-size, 16px);
	line-height: var(--jpc-line-height, 1.6);
	-webkit-font-smoothing: antialiased;
}

.preview *,
.preview *::before,
.preview *::after {
	box-sizing: border-box;
}

.preview a {
	color: var(--jpc-link, inherit);
}

.preview textarea,
.preview input {
	color: inherit;
	font: inherit;
}

.preview__heading {
	margin: 0 0 0.75em;
	color: var(--jpc-heading-color, inherit);
	font-family: var(--jpc-heading-font-family, inherit);
	font-size: var(--jpc-heading-font-size, 1.375em);
	font-weight: var(--jpc-heading-font-weight, 600);
	line-height: var(--jpc-heading-line-height, 1.3);
}

.preview .preview__button {
	border: var(--jpc-button-border-width, 0) var(--jpc-button-border-style, solid) var(--jpc-button-border-color, currentColor);
	border-radius: var(--jpc-button-radius, 0);
	background: var(--jpc-button-background, #32373c);
	color: var(--jpc-button-color, #fff);
	font-family: var(--jpc-button-font-family, inherit);
	font-weight: var(--jpc-button-font-weight, inherit);
	text-transform: var(--jpc-button-text-transform, none);
	letter-spacing: var(--jpc-button-letter-spacing, normal);
}

.preview__toolbar {
	display: flex;
	flex-wrap: wrap;
	padding-inline: 6px;
	border-block-end: 1px solid currentColor;
}

.preview__toolbar-group {
	display: flex;
	padding-inline: 6px;
}

.preview__toolbar-button {
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 36px;
	block-size: 48px;
}

.preview__toolbar-button svg {
	fill: currentColor;
}

.preview__core p {
	margin: 0 0 1em;
}

.preview__core label {
	display: block;
	margin-block-end: 0.25em;
}

.preview__core textarea,
.preview__core input[type="text"] {
	display: block;
	inline-size: 100%;
	padding: 0.5em 0.75em;
	border: 1px solid color-mix(in sRGB, currentColor 40%, transparent);
	border-radius: 0;
	background: transparent;
	resize: none;
}

.preview__core .preview__note {
	font-size: 0.875em;
}

.preview__core .preview__checkbox {
	display: flex;
	align-items: baseline;
	gap: 0.5em;
}

.preview__core .preview__checkbox label {
	margin: 0;
}

.preview__core .preview__button {
	padding: 0.75em 1.5em;
}
`;
