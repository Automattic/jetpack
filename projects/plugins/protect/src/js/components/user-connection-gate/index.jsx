import { useConnection } from '@automattic/jetpack-connection';
import UserConnectionNeededModal from '../user-connection-needed-modal';

const UserConnectionGate = ( { children } ) => {
	const { isUserConnected, hasConnectedOwner } = useConnection();

	if ( ! isUserConnected || ! hasConnectedOwner ) {
		return <UserConnectionNeededModal />;
	}

	return children;
};

export default UserConnectionGate;
