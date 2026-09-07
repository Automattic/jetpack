import { VALID_SECTIONS } from '../../constants';

/**
 * Render the Guidelines-page section markup the draft helpers read from:
 * a list item carrying data-slug with a form textarea, per valid section.
 *
 * @param {Object} values - Optional slug-keyed initial textarea values.
 */
export function renderSections( values = {} ) {
	document.body.innerHTML = `
		<ul class="guidelines__list">
			${ VALID_SECTIONS.map(
				slug => `
				<li class="guidelines__list-item" data-slug="${ slug }">
					<form><div><textarea>${ values[ slug ] || '' }</textarea></div></form>
				</li>`
			).join( '' ) }
		</ul>`;
}

/**
 * Build the block guideline modal markup with its textarea.
 *
 * @param {string} value - Initial textarea value.
 * @return {{modal: HTMLElement, textarea: HTMLTextAreaElement}} The elements.
 */
export function renderBlockModal( value = '' ) {
	const modal = document.createElement( 'div' );
	modal.className = 'block-guideline-modal';
	const textarea = document.createElement( 'textarea' );
	textarea.className = 'components-textarea-control__input';
	textarea.value = value;
	modal.appendChild( textarea );
	document.body.appendChild( modal );
	return { modal, textarea };
}

/**
 * Set a textarea's value and fire the bubbling input event a real edit fires.
 *
 * @param {HTMLTextAreaElement} textarea - Target textarea.
 * @param {string}              value    - New value.
 */
export function typeInto( textarea, value ) {
	textarea.value = value;
	textarea.dispatchEvent( new Event( 'input', { bubbles: true } ) );
}
