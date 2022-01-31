/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';
import { noop } from 'lodash';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import Gridicon from 'components/gridicon';
import onKeyDownCallback from 'utils/onkeydown-callback';
import { imagePath } from 'constants/urls';

class JetpackDialogue extends Component {
	maybeDismiss = e => {
		if ( this.props.showDismiss && ( ! e.keyCode || e.keyCode === 27 ) ) {
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
		const classes = classNames( this.props.className, 'jp-dialogue' );
		return (
			<div
				className="jp-dialogue-full__container"
				role="presentation"
				onClick={ this.maybeDismiss }
				onKeyDown={ onKeyDownCallback( this.maybeDismiss ) }
			>
				<img
					src={ imagePath + 'stars-full.svg' }
					width="60"
					height="60"
					alt={ __( 'Stars', 'jetpack' ) }
					className="jp-dialogue-full__svg-stars"
				/>
				<img
					src={ imagePath + 'jupiter.svg' }
					width="50"
					height="100"
					alt={ __( 'Jupiter', 'jetpack' ) }
					className="jp-dialogue-full__svg-jupiter"
				/>

				<div
					className={ classes }
					role="presentation"
					onClick={ this.clickForeground }
					onKeyDown={ onKeyDownCallback( this.clickForeground ) }
				>
					{ this.props.svg }

					<h1 className="jp-dialogue__title">{ this.props.title }</h1>

					<Card>
						{ this.props.showDismiss && (
							<Gridicon
								icon="cross-small"
								className="jp-dialogue-full__dismiss"
								tabIndex="0"
								onKeyDown={ onKeyDownCallback( this.props.dismiss ) }
								onClick={ this.props.dismiss }
							/>
						) }
						{ this.props.content }
					</Card>
					<div>{ this.props.belowContent }</div>
				</div>
			</div>
		);
	}
}

JetpackDialogue.propTypes = {
	content: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object ] ).isRequired,
	belowContent: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object ] ).isRequired,
	svg: PropTypes.oneOfType( [ PropTypes.bool, PropTypes.object ] ),
	dismissOnClick: PropTypes.func,
	showDismiss: PropTypes.bool,
	title: PropTypes.string,
	dismiss: PropTypes.func,
};

JetpackDialogue.defaultProps = {
	svg: false,
	showDismiss: true,
	dismiss: noop,
	content: '',
	belowContent: '',
	title: '',
};

export default JetpackDialogue;
