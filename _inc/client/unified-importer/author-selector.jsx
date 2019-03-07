/**
 * External dependencies
 */
import React, { PureComponent } from 'react';
import { SelectControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

class AuthorSelector extends PureComponent {
	constructor( props ) {
		super( props );
		this.usernameInput = React.createRef();
	}

	state = {
		isNew: false,
		newUsernameText: '',
	};

	handleSelectChange = value => {
		const isNew = value === '';
		this.setState( { isNew }, () => {
			if ( isNew ) {
				if ( this.usernameInput.current ) {
					this.usernameInput.current.focus();
					this.props.onChange(
						this.props.importAuthor.author_login,
						this.usernameInput.current.value
					);
				}
			} else {
				this.props.onChange( this.props.importAuthor.author_login, value );
			}
		} );
	};

	handleTextChange = event => {
		const newUsernameText = event.target.value;
		this.setState( { newUsernameText } );
		this.props.onChange( this.props.importAuthor.author_login, newUsernameText );
	};

	render() {
		const { importAuthor, siteAuthors } = this.props;
		const { isNew } = this.state;

		const options = [
			{
				// translators: %s: The login name of an author to create for post attribution
				label: sprintf( __( 'Create the user "%s"' ), importAuthor.author_login ),
				value: importAuthor.author_login,
			},
			...siteAuthors.map( author => {
				return {
					// translators: %s: The login name of an existing author to use for post attribution
					label: sprintf( __( 'Use existing user "%s"' ), author.name ),
					value: author.name,
				};
			} ),
			{ label: __( 'Create a new user...' ), value: '' },
		];

		return (
			<div>
				<SelectControl
					onChange={ this.handleSelectChange }
					label={ __( `Map this author's posts to:` ) }
					options={ options }
				/>
				{ isNew && (
					<label>
						{ __( 'Enter username:' ) }
						<input
							ref={ this.usernameInput }
							type="text"
							onChange={ this.handleTextChange }
							value={ this.state.newUsernameText }
						/>
					</label>
				) }
			</div>
		);
	}
}

export default AuthorSelector;
