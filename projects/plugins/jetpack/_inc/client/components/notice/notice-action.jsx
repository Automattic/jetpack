import { Notice } from '@wordpress/ui';
import PropTypes from 'prop-types';
import { Component } from 'react';

export default class NoticeAction extends Component {
	static displayName = 'NoticeAction';

	static propTypes = {
		href: PropTypes.string,
		onClick: PropTypes.func,
		external: PropTypes.bool,
		icon: PropTypes.string,
		variant: PropTypes.oneOf( [ 'primary', 'secondary' ] ),
	};

	static defaultProps = {
		external: false,
	};

	render() {
		const { children, href, onClick, external } = this.props;

		if ( href ) {
			// `openInNewTab` also draws the external-link arrow the old Gridicon supplied.
			return (
				<Notice.ActionLink href={ href } onClick={ onClick } openInNewTab={ external }>
					{ children }
				</Notice.ActionLink>
			);
		}

		return <Notice.ActionButton onClick={ onClick }>{ children }</Notice.ActionButton>;
	}
}
