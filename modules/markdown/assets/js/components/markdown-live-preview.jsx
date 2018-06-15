/* global React:true */

const {
	createElement
} = window.wp.element;

const { __ } = window.wp.i18n;

const emitChange = function( evt ) {
	if ( ! this.htmlEl ) {
		return;
	}

	const source = this.htmlEl.innerText;

	if ( this.props.onChange ) {
		// Clone event with Object.assign to avoid
		// "Cannot assign to read only property 'target' of object"
		evt = Object.assign( {}, evt, {
			target: {
				value: source
			}
		} );
		this.props.onChange( evt );
	}
};

export default class MarkdownLivePreview extends React.Component {

	constructor() {
		super();

		this.state = {
			html: __( 'Write your _Markdown_ **here**...' ),
		};
	}

	render() {
		const { ...props } = this.props;

		return createElement(
			'div',
			{
				...props,
				ref: ( e ) => this.htmlEl = e,
				onInput: emitChange.bind( this ),
				onBlur: emitChange.bind( this ),
				contentEditable: ! this.props.disabled,
				dangerouslySetInnerHTML: { __html: this.state.html }
			},
			this.props.children
		);
	}

}
