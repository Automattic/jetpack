type PreventWidows = ( text: string ) => string;

const preventWidows: PreventWidows = text => {
	const noWidowsText = text.replace( /\s(?=[^\s]*$)/g, '\u00A0' );

	return noWidowsText;
};

export default preventWidows;
