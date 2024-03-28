const save = ( { attributes: { name }, className } ) =>
	name && <div className={ className }>{ name }</div>;

export default save;
