/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { Component, createRef } from '@wordpress/element';

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
		const { isSelected, option, type } = this.props;
		return (
			<li className="jetpack-option">
				{ type && type !== 'select' && (
					<input className="jetpack-option__type" type={ type } disabled />
				) }
				<input
					type="text"
					className="jetpack-option__input"
					value={ option }
					placeholder={ __( 'Write option…', 'jetpack' ) }
					onChange={ this.onChangeOption }
					onKeyDown={ this.onKeyPress }
					ref={ this.textInput }
				/>
				{ isSelected && (
					<IconButton
						className="jetpack-option__remove"
						icon="trash"
						label={ __( 'Remove option', 'jetpack' ) }
						onClick={ this.onDeleteOption }
					/>
				) }
			</li>
		);
	}
}

export default JetpackOption;
