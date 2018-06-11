/* global React:true */

/**
 * Internal dependencies
 */
const { __ } = window.wp.i18n;

const {
	Component,
} = window.wp.element;

const {
	PlainText
} = window.wp.editor;

class JetpackMarkdownBlockEditor extends Component {
	constructor() {
		super( ...arguments );

		this.updateSource = this.updateSource.bind( this );
	}

	updateSource( source ) {
		this.props.setAttributes( { source } );
	}

	render() {
		const { attributes, className } = this.props;

		return (
			<PlainText
				className={ className }
				onChange={ this.updateSource }
				aria-label={ __( 'Markdown' ) }
				value={ attributes.source }
			/>
		);
	}
}
export default JetpackMarkdownBlockEditor;
