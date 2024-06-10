import clsx from 'clsx';
import Gridicon from 'components/gridicon';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import onKeyDownCallback from 'utils/onkeydown-callback';

class ModernOverlay extends Component {
	maybeDismiss = e => {
		if ( this.props.showDismiss && ( ! e.code || e.code === 'Escape' ) ) {
			this.props.dismiss( e );
		}
	};

	// capture the ESC key globally
	componentDidMount() {
		document.addEventListener( 'keydown', this.maybeDismiss.bind( this ), false );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keydown', this.maybeDismiss.bind( this ), false );
	}

	// prevent foreground clicks going through to the background
	clickForeground( e ) {
		e.stopPropagation();
	}

	render() {
		const classes = clsx( this.props.className, 'jp-dialogue-modern', {
			'has-featured-image': !! this.props.svg,
		} );
		return (
			<div
				className="jp-dialogue-modern-full__container"
				role="presentation"
				onClick={ this.maybeDismiss }
				onKeyDown={ onKeyDownCallback( this.maybeDismiss ) }
			>
				<div
					className={ classes }
					role="presentation"
					onClick={ this.clickForeground }
					onKeyDown={ onKeyDownCallback( this.clickForeground ) }
				>
					{ this.props.showDismiss && (
						<Gridicon
							icon="cross-small"
							className="jp-dialogue-modern-full__dismiss"
							tabIndex="0"
							onKeyDown={ onKeyDownCallback( this.props.dismiss ) }
							onClick={ this.props.dismiss }
						/>
					) }
					{ this.props.svg }
					<div className="jp-dialogue-modern__content">
						<h1 className="jp-dialogue-modern__title">{ this.props.title }</h1>
						{ this.props.content }
					</div>
					<div>{ this.props.belowContent }</div>
				</div>
			</div>
		);
	}
}

ModernOverlay.propTypes = {
	content: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object ] ).isRequired,
	belowContent: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object ] ).isRequired,
	svg: PropTypes.oneOfType( [ PropTypes.bool, PropTypes.object ] ),
	dismissOnClick: PropTypes.func,
	showDismiss: PropTypes.bool,
	title: PropTypes.string,
	adminUrl: PropTypes.string,
	dismiss: PropTypes.func,
};

ModernOverlay.defaultProps = {
	svg: false,
	showDismiss: true,
	dismiss: noop,
	content: '',
	belowContent: '',
	title: '',
};

export default ModernOverlay;
