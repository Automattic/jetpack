window.jetpackForms = window.jetpackForms || {};

window.jetpackForms.getBackgroundColor = function ( backgroundColorNode ) {
	let backgroundColor = window.getComputedStyle( backgroundColorNode ).backgroundColor;
	while (
		backgroundColor === 'rgba(0, 0, 0, 0)' &&
		backgroundColorNode.parentNode &&
		backgroundColorNode.parentNode.nodeType === window.Node.ELEMENT_NODE
	) {
		backgroundColorNode = backgroundColorNode.parentNode;

		if ( backgroundColorNode.className === 'wp-block-cover' ) {
			const coverBackgroundNode = backgroundColorNode.querySelector(
				'.wp-block-cover__background'
			);
			backgroundColor = window.getComputedStyle( coverBackgroundNode ).backgroundColor;
			continue;
		}

		backgroundColor = window.getComputedStyle( backgroundColorNode ).backgroundColor;
	}
	return backgroundColor;
};

window.jetpackForms.generateStyleVariables = function ( formNode ) {
	const STYLE_PROBE_CLASS = 'contact-form__style-probe';
	const STYLE_PROBE_STYLE =
		'position: absolute; z-index: -1; width: 1px; height: 1px; visibility: hidden';
	const HTML = `
			<div class="contact-form">
				<div class="wp-block-button">
					<div class="wp-block-button__link btn-primary">Test</div>
				</div>
				<div class="wp-block-button is-style-outline">
					<div class="wp-block-button__link btn-outline">Test</div>
				</div>
				<div class="jetpack-field">
					<input class="jetpack-field__input" type="text">
				</div>
			</div>
		`;

	if ( ! formNode ) {
		return;
	}

	const _document = window[ 'editor-canvas' ] ? window[ 'editor-canvas' ].document : document;
	const bodyNode = _document.querySelector( 'body' );

	const styleProbe = _document.createElement( 'div' );
	styleProbe.className = STYLE_PROBE_CLASS;
	styleProbe.style = STYLE_PROBE_STYLE;
	styleProbe.innerHTML = HTML;

	formNode.parentNode.appendChild( styleProbe );

	const buttonPrimaryNode = styleProbe.querySelector( '.btn-primary' );
	const buttonOutlineNode = styleProbe.querySelector( '.btn-outline' );
	const inputNode = styleProbe.querySelector( 'input[type="text"]' );

	const backgroundColor = window.jetpackForms.getBackgroundColor( bodyNode );
	const inputBackgroundFallback = window.jetpackForms.getBackgroundColor( inputNode );
	const inputBackground = window.getComputedStyle( inputNode ).backgroundColor;
	const {
		border: buttonPrimaryBorder,
		borderColor: buttonPrimaryBorderColor,
		backgroundColor: buttonPrimaryBackgroundColor,
		color: buttonPrimaryColor,
	} = window.getComputedStyle( buttonPrimaryNode );

	const {
		backgroundColor: buttonOutlineBackgroundColor,
		border: buttonOutlineBorder,
		borderWidth: buttonOutlineBorderSize,
		borderRadius: buttonOutlineBorderRadius,
		color: buttonOutlineTextColor,
		padding: buttonOutlinePadding,
		lineHeight: buttonOutlineLineHeight,
	} = window.getComputedStyle( buttonOutlineNode );

	const buttonOutlineBackgroundColorFallback =
		window.jetpackForms.getBackgroundColor( buttonOutlineNode );

	const {
		color: textColor,
		padding: inputPadding,
		paddingTop: inputPaddingTop,
		paddingLeft: inputPaddingLeft,
		border,
		borderColor,
		borderWidth,
		borderStyle,
		borderRadius,
		fontSize,
		fontFamily,
		lineHeight,
	} = window.getComputedStyle( inputNode );

	styleProbe.remove();

	return {
		'--jetpack--contact-form--primary-color': buttonPrimaryBackgroundColor,
		'--jetpack--contact-form--background-color': backgroundColor,
		'--jetpack--contact-form--text-color': textColor,
		'--jetpack--contact-form--border': border,
		'--jetpack--contact-form--border-color': borderColor,
		'--jetpack--contact-form--border-size': borderWidth,
		'--jetpack--contact-form--border-style': borderStyle,
		'--jetpack--contact-form--border-radius': borderRadius,
		'--jetpack--contact-form--input-background': inputBackground,
		'--jetpack--contact-form--input-background-fallback': inputBackgroundFallback,
		'--jetpack--contact-form--input-padding': inputPadding,
		'--jetpack--contact-form--input-padding-top': inputPaddingTop,
		'--jetpack--contact-form--input-padding-left': inputPaddingLeft,
		'--jetpack--contact-form--font-size': fontSize,
		'--jetpack--contact-form--font-family': fontFamily,
		'--jetpack--contact-form--line-height': lineHeight,
		'--jetpack--contact-form--button-primary--color': buttonPrimaryColor,
		'--jetpack--contact-form--button-primary--background-color': buttonPrimaryBackgroundColor,
		'--jetpack--contact-form--button-primary--border': buttonPrimaryBorder,
		'--jetpack--contact-form--button-primary--border-color': buttonPrimaryBorderColor,
		'--jetpack--contact-form--button-outline--padding': buttonOutlinePadding,
		'--jetpack--contact-form--button-outline--border': buttonOutlineBorder,
		'--jetpack--contact-form--button-outline--background-color': buttonOutlineBackgroundColor,
		'--jetpack--contact-form--button-outline--background-color-fallback':
			buttonOutlineBackgroundColorFallback,
		'--jetpack--contact-form--button-outline--border-size': buttonOutlineBorderSize,
		'--jetpack--contact-form--button-outline--border-radius': buttonOutlineBorderRadius,
		'--jetpack--contact-form--button-outline--text-color': buttonOutlineTextColor,
		'--jetpack--contact-form--button-outline--line-height': buttonOutlineLineHeight,
	};
};

// Add fullscreen form styles
const fullscreenStyles = `
.jetpack-contact-form-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999999;
  background-color: rgba(255, 255, 255, 0.98);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: auto;
  padding: 2rem;
}

.jetpack-contact-form-fullscreen .contact-form {
  max-width: 600px;
  width: 100%;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 40px;
  background: #fff;
  position: relative;
}

.jetpack-contact-form-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  background-color: #0675c4;
  transition: width 0.3s ease;
}

.jetpack-contact-form-step {
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: 1;
  transform: translateY(0);
}

.jetpack-contact-form-step:not(:first-child) {
  opacity: 0;
  transform: translateY(20px);
}

.jetpack-contact-form-step:not(.is-active) {
  animation: slide-in 0.4s forwards;
}

@keyframes slide-in {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.jetpack-contact-form-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.jetpack-contact-form-prev,
.jetpack-contact-form-next {
  background-color: #0675c4;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s ease;
}

.jetpack-contact-form-prev:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.jetpack-contact-form-prev:not(:disabled):hover,
.jetpack-contact-form-next:hover {
  background-color: #055c9d;
}

.jetpack-contact-form-close {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 50%;
  font-size: 24px;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  z-index: 1000000;
}

.jetpack-contact-form-close:hover {
  background-color: rgba(0, 0, 0, 0.2);
}

.jetpack-contact-form-fullscreen .grunion-field-wrap label {
  font-size: 1.2em;
  margin-bottom: 12px;
  display: block;
}

.jetpack-contact-form-fullscreen .grunion-field-wrap input[type="text"],
.jetpack-contact-form-fullscreen .grunion-field-wrap input[type="email"],
.jetpack-contact-form-fullscreen .grunion-field-wrap input[type="url"],
.jetpack-contact-form-fullscreen .grunion-field-wrap input[type="tel"],
.jetpack-contact-form-fullscreen .grunion-field-wrap textarea,
.jetpack-contact-form-fullscreen .grunion-field-wrap select {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.jetpack-contact-form-fullscreen .grunion-field-submit-wrap input[type="submit"] {
  width: 100%;
  padding: 12px 20px;
  font-size: 16px;
  border-radius: 4px;
  background-color: #0675c4;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.jetpack-contact-form-fullscreen .grunion-field-submit-wrap input[type="submit"]:hover {
  background-color: #055c9d;
}

/* Validation styling */
.jetpack-contact-form-error-message {
  color: #d63638;
  font-size: 14px;
  margin-top: 5px;
  padding: 5px 0;
  font-weight: 500;
}

.jetpack-contact-form-fullscreen .grunion-field-wrap input.has-error,
.jetpack-contact-form-fullscreen .grunion-field-wrap textarea.has-error,
.jetpack-contact-form-fullscreen .grunion-field-wrap select.has-error {
  border-color: #d63638;
  box-shadow: 0 0 0 1px #d63638;
}

.jetpack-contact-form-validation-errors {
  background-color: #fcf0f1;
  border-left: 4px solid #d63638;
  color: #d63638;
  margin: 0 0 15px 0;
  padding: 8px 12px;
  display: none;
}

.jetpack-contact-form-fullscreen input[type="checkbox"].has-error + label,
.jetpack-contact-form-fullscreen input[type="radio"].has-error + label {
  color: #d63638;
}

/* Field animation */
.jetpack-contact-form-step {
  animation: form-field-appear 0.3s forwards;
}

@keyframes form-field-appear {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

const style = document.createElement( 'style' );
style.appendChild( document.createTextNode( fullscreenStyles ) );
document.head.appendChild( style );
