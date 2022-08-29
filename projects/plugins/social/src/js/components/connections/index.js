import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

const ConnectionItem = props => {
	const { connections } = window.jetpackSocialInitialState;

	return props.connectionIds.map( connectionId => {
		const connection = connections[ props.provider ][ connectionId ];
		return (
			<div key={ connectionId }>
				<tr>
					<th className={ styles.connectionRow }> { __( 'Name', 'jetpack-social' ) }</th>
					<th className={ styles.connectionRow }>{ __( 'Image', 'jetpack-social' ) }</th>
				</tr>
				<tr>
					<td className={ styles.connectionRow }>{ connection.external_display }</td>
					<td className={ styles.connectionRow }>
						{ connection.profile_picture && (
							<img
								alt="connection avatar"
								src={ connection.profile_picture }
								height="50px"
								width="50px"
							/>
						) }
					</td>
				</tr>
			</div>
		);
	} );
};

const Connections = () => {
	const { connections } = window.jetpackSocialInitialState;

	if ( ! connections ) {
		return null;
	}

	const providers = Object.keys( connections );
	return providers.map( provider => {
		return (
			<div key={ provider }>
				<h2> { provider.charAt( 0 ).toUpperCase() + provider.slice( 1 ) } Connections</h2>
				<table className={ styles.connectionTable }>
					<ConnectionItem
						connectionIds={ Object.keys( connections[ provider ] ) }
						provider={ provider }
					/>
				</table>
			</div>
		);
	} );
};

export default Connections;
