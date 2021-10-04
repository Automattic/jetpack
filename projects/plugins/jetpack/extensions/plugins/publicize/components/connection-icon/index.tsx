/**
 * Internal dependencies
 */
import { SocialServiceIcon } from '../../../../shared/icons';

/**
 * Style dependencies
 */
import './style.scss';

type ConnectionIconProps = {
	id: string;
	serviceName: string;
	label: string;
	profilePicture: string;
};

const ConnectionIcon: React.FC< ConnectionIconProps > = props => {
	const { id, serviceName, label, profilePicture } = props;

	return (
		<label htmlFor={ id } className="jetpack-publicize-connection-label">
			<div className="components-connection-icon__picture">
				{ profilePicture ? <img src={ profilePicture } /> : <span className="placeholder" /> }
				<SocialServiceIcon
					serviceName={ serviceName }
					className="jetpack-publicize-gutenberg-social-icon"
				/>
			</div>
			<span className="jetpack-publicize-connection-label-copy">{ label }</span>
		</label>
	);
};

export default ConnectionIcon;
