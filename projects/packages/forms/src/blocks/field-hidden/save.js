export default ( { attributes } ) => {
	return <input type="hidden" name={ attributes.name } value={ attributes.value } />;
};
