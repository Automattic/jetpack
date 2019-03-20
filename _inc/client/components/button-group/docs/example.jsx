/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/onclick-has-role */
/**
 * External dependencies
 */
const React = require( 'react' ),
	PureRenderMixin = require( 'react-pure-render/mixin' );

const createReactClass = require( 'create-react-class' );

/**
 * Internal dependencies
 */
const ButtonGroup = require( 'components/button-group' ),
	Button = require( 'components/button' ),
	Card = require( 'components/card' ),
	Gridicon = require( 'components/gridicon' );

const Buttons = createReactClass( {
	displayName: 'ButtonGroup',

	mixins: [ PureRenderMixin ],

	getInitialState: function() {
		return {
			compact: false,
		};
	},

	toggleButtons: function() {
		this.setState( { compact: ! this.state.compact } );
	},

	render: function() {
		return (
			<div>
				<a
					className="docs__design-toggle button"
					role="button"
					tabIndex={ 0 }
					onClick={ this.toggleButtons }
				>
					{ this.state.compact ? 'Normal Buttons' : 'Compact Buttons' }
				</a>
				<Card>
					<div className="docs__design-button-row">
						<ButtonGroup>
							<Button compact={ this.state.compact }>Do thing</Button>
							<Button compact={ this.state.compact }>Do another thing</Button>
						</ButtonGroup>
					</div>
					<div className="docs__design-button-row">
						<ButtonGroup>
							<Button compact={ this.state.compact }>Button one</Button>
							<Button compact={ this.state.compact }>Button two</Button>
							<Button compact={ this.state.compact } scary>
								Button Three
							</Button>
						</ButtonGroup>
					</div>
					<div className="docs__design-button-row">
						<ButtonGroup>
							<Button compact={ this.state.compact }>
								<Gridicon icon="add-image" />
							</Button>
							<Button compact={ this.state.compact }>
								<Gridicon icon="heart" />
							</Button>
							<Button compact={ this.state.compact }>
								<Gridicon icon="briefcase" />
							</Button>
							<Button compact={ this.state.compact }>
								<Gridicon icon="history" />
							</Button>
						</ButtonGroup>
					</div>
					<div className="docs__design-button-row">
						<ButtonGroup>
							<Button primary compact={ this.state.compact }>
								Publish
							</Button>
							<Button primary compact={ this.state.compact }>
								<Gridicon icon="calendar" />
							</Button>
						</ButtonGroup>
					</div>
				</Card>
			</div>
		);
	},
} );

module.exports = Buttons;
