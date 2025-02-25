const appendDescription = ( target, description ) => {
	if ( ! description ) {
		return;
	}

	const descriptionElement = document.createElement( 'span' );
	descriptionElement.className = 'description';
	descriptionElement.innerHTML = description;
	descriptionElement.style.setProperty( 'margin-inline-start', '4px' );
	target.parentNode.appendChild( descriptionElement );
};

const disableAccountLevelFields = fields => {
	if ( ! fields ) {
		return;
	}

	Object.values( fields ).forEach( field => {
		if ( ! field.selector || ! field.disabled ) {
			return;
		}

		const element = document.querySelector( field.selector );
		if ( element ) {
			if ( element.tagName === 'INPUT' ) {
				element.readOnly = true;
			} else {
				element.disabled = true;
			}
			appendDescription( element, field.description );
		}
	} );
};

document.addEventListener( 'DOMContentLoaded', () => {
	disableAccountLevelFields( window.JETPACK_MU_WPCOM_USER_EDIT?.fields );
} );
