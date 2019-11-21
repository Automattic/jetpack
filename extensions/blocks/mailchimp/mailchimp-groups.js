/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { CheckboxControl } from '@wordpress/components';
import { Fragment, Component } from '@wordpress/element';

class MailchimpGroups extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			groups: [],
		};
	}
	componentDidMount() {
		this.retrieveGroups();
	}
	retrieveGroups = () => {
		const args = {
			method: 'GET',
			path: '/wpcom/v2/mailchimp/groups',
		};
		apiFetch( args ).then( response => {
			const { interest_categories } = response;
			this.setState( { interest_categories } );
		} );
	};
	render = () => {
		const { interest_categories } = this.state;
		const { interests, onChange } = this.props;
		return (
			<Fragment>
				{ interest_categories &&
					( interest_categories || [] ).map( interest_category =>
						interest_category.interests.map( interest => (
							<CheckboxControl
								label={ interest.name }
								value={ interest.id }
								checked={ interests.indexOf( interest.id ) > -1 }
								onChange={ checked => onChange( interest.id, checked ) }
								key={ interest.id }
							/>
						) )
					) }
			</Fragment>
		);
	};
}

export default MailchimpGroups;

MailchimpGroups.defaultProps = {
	interests: [],
	onChange: () => null,
};
