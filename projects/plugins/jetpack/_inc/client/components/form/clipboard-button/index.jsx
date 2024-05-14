import classNames from 'classnames';
import Clipboard from 'clipboard';
import Button from 'components/button';
import { omit, noop } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDom from 'react-dom';

export default class ClipboardButton extends React.Component {
	static displayName = 'ClipboardButton';

	static propTypes = {
		className: PropTypes.string,
		text: PropTypes.string,
		prompt: PropTypes.string,
		onCopy: PropTypes.func,
		rna: PropTypes.bool,
	};

	static defaultProps = {
		onCopy: noop,
		rna: false,
	};

	buttonRef = React.createRef();

	componentDidMount() {
		const button = ReactDom.findDOMNode( this.buttonRef.current );
		this.clipboard = new Clipboard( button, {
			text: () => this.props.text,
		} );
		this.clipboard.on( 'success', this.props.onCopy );
		this.clipboard.on( 'error', this.displayPrompt );
	}

	componentWillUnmount() {
		this.clipboard.destroy();
		delete this.clipboard;
	}

	displayPrompt = () => {
		window.prompt( this.props.prompt, this.props.text );
	};

	render() {
		const classes = classNames( 'dops-clipboard-button', this.props.className );
		return (
			<Button
				rna={ this.props.rna }
				ref={ this.buttonRef }
				{ ...omit( this.props, Object.keys( this.constructor.propTypes ) ) }
				className={ classes }
			/>
		);
	}
}
