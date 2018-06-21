/* global React:true */

/**
 * Internal dependencies
 */
import MarkdownPreview from './components/markdown-preview';
import MarkdownLivePreview from './components/markdown-live-preview';

const { __ } = window.wp.i18n;

const {
	Component,
} = window.wp.element;

class JetpackMarkdownBlockEditor extends Component {

	constructor() {
		super( ...arguments );

		this.updateSource = this.updateSource.bind( this );
		this.showEditor = this.showEditor.bind( this );
		this.showPreview = this.showPreview.bind( this );
		this.isEmpty = this.isEmpty.bind( this );
	}

	isEmpty() {
		const source = this.props.attributes.source;
		return ! source || source.trim() === '';
	}

	updateSource( evt ) {
		this.props.setAttributes( { source: evt.target.value } );
	}

	showEditor() {
		this.setState( { activePanel: 'editor' } );
	}

	showPreview() {
		this.setState( { activePanel: 'preview' } );
	}

	render() {
		const { attributes, className, isSelected } = this.props;

		const source = attributes.source;

		if ( ! isSelected && ! this.isEmpty() ) {
			return <MarkdownPreview source={ source } />;
		}

		const placeholderSource = __( 'Write your _Markdown_ **here**...' );

		if ( ! isSelected && this.isEmpty() ) {
			return (
				<p className={ `${ className }-placeholder` }>
					{ placeholderSource }
				</p>
			);
		}

		return <MarkdownLivePreview
			className={ `${ className }-live-preview` }
			onChange={ this.updateSource }
			aria-label={ __( 'Markdown' ) }
			isSelected={ isSelected }
			source={ source }
		/>;
	}

}
export default JetpackMarkdownBlockEditor;
