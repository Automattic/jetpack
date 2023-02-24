import { Button } from '@wordpress/components';
import { Component, createRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class JetpackOption extends Component {
	constructor( ...args ) {
		super( ...args );
		this.onChangeOption = this.onChangeOption.bind( this );
		this.onKeyPress = this.onKeyPress.bind( this );
		this.onDeleteOption = this.onDeleteOption.bind( this );
		this.textInput = createRef();
	}

	componentDidMount() {
		if ( this.props.isInFocus ) {
			this.textInput.current.focus();
		}
	}

	componentDidUpdate() {
		if ( this.props.isInFocus ) {
			this.textInput.current.focus();
		}
	}

	onChangeOption( event ) {
		this.props.onChangeOption( this.props.index, event.target.value );
	}

	onKeyPress( event ) {
		if ( event.key === 'Enter' ) {
			this.props.onAddOption( this.props.index );
			event.preventDefault();
			return;
		}

		if ( event.key === 'Backspace' && event.target.value === '' ) {
			this.props.onChangeOption( this.props.index );
			event.preventDefault();
			return;
		}
	}

	onDeleteOption() {
		this.props.onChangeOption( this.props.index );
	}

	render() {
		const { isSelected, option, type, style } = this.props;
		return (
			<li className="jetpack-option">
				{ type && type !== 'select' && (
					<input className="jetpack-option__type" type={ type } readOnly />
				) }
				<input
					type="text"
					className="jetpack-option__input"
					value={ option }
					placeholder={ __( 'Write option…', 'jetpack-forms' ) }
					onChange={ this.onChangeOption }
					onKeyDown={ this.onKeyPress }
					ref={ this.textInput }
					style={ style }
				/>
				{ isSelected && (
					<Button
						className="jetpack-option__remove"
						icon="trash"
						label={ __( 'Remove option', 'jetpack-forms' ) }
						onClick={ this.onDeleteOption }
					/>
				) }
			</li>
		);
	}
}

export default JetpackOption;
