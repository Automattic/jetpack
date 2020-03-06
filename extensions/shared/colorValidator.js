const hexRegex = /^#?[A-Fa-f0-9]{6}$/;

export default function colorValidator( value ) {
	return hexRegex.test( value );
}
