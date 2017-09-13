/* global wp, _, */
/* eslint react/react-in-jsx-scope: 0 */
const { __ } = wp.i18n;
const {
	registerBlockType,
	Editable,
	source: {
		children
	}
} = wp.blocks;

registerBlockType( 'gutenpack/test', {
	title: __( 'Test' ),
	icon: 'sort',
	category: 'layout',
	attributes: {
		title: children( 'label' )
	},
	edit: props => {
		const focusedEditable = props.focus ? props.focus.editable || 'title' : null;
		const attributes = props.attributes;
		const onChangeTitle = value => {
			props.setAttributes( { title: value } );
		};
		const onFocusTitle = focus => {
			props.setFocus( _.extend( {}, focus, { editable: 'title' } ) );
		};

		return (
			<div className={ props.className }>
				<Editable
					tagName="label"
					multiline={ false }
					placeholder={ __( 'Write visible text…' ) }
					value={ attributes.title }
					onChange={ onChangeTitle }
					focus={ focusedEditable === 'title' }
					onFocus={ onFocusTitle }
				/>
			</div>
		);
	},
	save: ( props ) => {
		const {
			attributes: {
				title
			}
		} = props;
		return (
			<h4>
				{ title }
			</h4>
		);
	}
} );
