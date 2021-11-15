const FileRule = ( options = {} ) => {
	const exts = options.extensions || [ 'gif', 'jpg', 'jpeg', 'png', 'svg' ];

	let type;
	if ( options.maxInlineSize > 0 ) {
		type = {
			type: 'asset',
			parser: {
				dataUrlCondition: {
					maxSize: options.maxInlineSize,
				},
			},
		};
	} else {
		type = { type: 'asset/resource' };
	}

	return {
		test: new RegExp(
			'\\.(?:' + exts.map( ext => ext.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) ).join( '|' ) + ')$',
			'i'
		),
		...type,
		generator: {
			filename: options.filename || 'images/[name]-[contenthash][ext]',
		},
	};
};

module.exports = FileRule;
