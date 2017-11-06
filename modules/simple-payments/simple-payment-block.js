const { registerBlockType } = wp.blocks;
const blockStyle = { backgroundColor: '#900', color: '#fff', padding: '20px' };

registerBlockType( 'jetpack/simple-payments-button', {
	title: 'Simple payment title',

	icon: 'universal-access-alt',

	category: 'layout',

	edit() {
		return <p style={ blockStyle }>Edit simple payments button.</p>;
	},

	save() {
		return <p style={ blockStyle }>Simple payment button saved content.</p>;
	},
} );
