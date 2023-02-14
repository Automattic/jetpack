import { __ } from '@wordpress/i18n';
import Layout from '../components/layout';
import InboxList from './list';
import InboxResponse from './response';

import './style.scss';

const Inbox = () => {
	return (
		<Layout title={ __( 'Responses', 'jetpack-forms' ) }>
			<div className="jp-forms__inbox-content">
				<div className="jp-forms__inbox-content-column">
					<InboxList />
				</div>

				<div className="jp-forms__inbox-content-column">
					<InboxResponse />
				</div>
			</div>
		</Layout>
	);
};

export default Inbox;
