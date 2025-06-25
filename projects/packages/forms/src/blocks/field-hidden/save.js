export default ( { attributes } ) => {
	return <input type="hidden" name={ attributes.label } value={ attributes.default } />;
};
