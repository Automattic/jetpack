const hexRegex = /^#?[A-Fa-f0-9]{6}$/;

export default function colourValidator( value ) {
	return hexRegex.test( value );
}
