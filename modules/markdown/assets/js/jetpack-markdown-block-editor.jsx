/* global React:true */

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import MarkdownPreview from './components/markdown-preview';
import MarkdownLivePreview from './components/markdown-live-preview';

const { __ } = window.wp.i18n;

const {
	Component,
} = window.wp.element;

const {
	ButtonGroup
} = window.wp.components;

const {
	BlockControls
} = window.wp.editor;

const PANEL_EDITOR = 'editor';
const PANEL_PREVIEW = 'preview';

class JetpackMarkdownBlockEditor extends Component {

	constructor() {
		super( ...arguments );

		this.updateSource = this.updateSource.bind( this );
		this.showEditor = this.showEditor.bind( this );
		this.showPreview = this.showPreview.bind( this );
		this.isEmpty = this.isEmpty.bind( this );

		this.state = {
			activePanel: PANEL_EDITOR
		};
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

		// Renders the editor panel or the preview panel based on component's state
		const editorOrPreviewPanel = function() {
			const source = attributes.source;

			switch ( this.state.activePanel ) {
				case PANEL_EDITOR:
					const placeholderSource = __( 'Write your _Markdown_ **here**...' );

					if ( ! isSelected && this.isEmpty() ) {
						return <p className={ `${ className }-placeholder` }>
							{ placeholderSource }
						</p>;
					}
					return <MarkdownLivePreview
						className={ `${ className }-live-preview` }
						onChange={ this.updateSource }
						aria-label={ __( 'Markdown' ) }
						source={ source }
						isSelected={ isSelected }
					/>;

				case PANEL_PREVIEW:
					return <MarkdownPreview source={ source } />;
			}
		};

		// Manages css classes for each panel based on component's state
		const classesForPanel = function( panelName ) {
			return classNames( {
				'components-tab-button': true,
				'is-active': this.state.activePanel === panelName

			} );
		};

		return [
			<BlockControls >
				<ButtonGroup>
					<button
						className={ classesForPanel.call( this, 'editor' ) }
						onClick={ this.showEditor }
					>
						<span>{ __( 'Markdown' ) }</span>
					</button>
					<button
						className={ classesForPanel.call( this, 'preview' ) }
						onClick={ this.showPreview }
					>
						<span>{ __( 'Preview' ) }</span>
					</button>
				</ButtonGroup>
			</BlockControls>,
			editorOrPreviewPanel.call( this )
		];
	}

}
export default JetpackMarkdownBlockEditor;
