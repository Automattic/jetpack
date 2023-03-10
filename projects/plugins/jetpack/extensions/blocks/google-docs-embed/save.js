const Save = props => {
	const { attributes } = props;

	return (
		<figure>
			<div className="embed__wrapper">
				{ `\n${ attributes.url }\n` /* URL on its own line as in core embeds. */ }
			</div>
		</figure>
	);
};

export default Save;
