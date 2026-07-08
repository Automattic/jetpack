/**
 * Neutral error-state glyph: a soft circle with an exclamation mark, tinted with
 * neutral Design System tokens rather than an alarming red, so the widget error
 * state reads as recoverable rather than alarming.
 */
export const errorStateIcon = (
	<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
		<path
			d="M19.9909 39.9818C31.0316 39.9818 39.9818 31.0316 39.9818 19.9909C39.9818 8.95024 31.0316 0 19.9909 0C8.95024 0 0 8.95024 0 19.9909C0 31.0316 8.95024 39.9818 19.9909 39.9818Z"
			fill="var(--wpds-color-background-surface-neutral-weak)"
		/>
		<path
			d="M19.9909 33.8591C21.9414 33.8591 23.5225 32.278 23.5225 30.3275C23.5225 28.3771 21.9414 26.7959 19.9909 26.7959C18.0405 26.7959 16.4593 28.3771 16.4593 30.3275C16.4593 32.278 18.0405 33.8591 19.9909 33.8591Z"
			fill="var(--wpds-color-stroke-surface-neutral)"
		/>
		<path
			d="M20.7087 6.11523H19.2731C16.4808 6.11523 15.0883 7.50778 15.6051 10.4651C16.2081 13.8747 17.5217 21.7634 17.8734 23.7158L19.9909 23.7302L22.1084 23.7158C22.4602 21.7706 23.7738 13.8747 24.3767 10.4651C24.9007 7.50778 23.5082 6.11523 20.7087 6.11523Z"
			fill="var(--wpds-color-stroke-surface-neutral)"
		/>
	</svg>
);
