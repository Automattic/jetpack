/**
 * External dependencies
 */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

Enzyme.configure( { adapter: new Adapter() } );

// Mock this that's usually set from PHP Jetpack_React_Page::page_admin_scripts().
window.Initial_State = {
	userData: {},
	dismissedNotices: {},
	locale: '{}',
	licensing: { error: '' },
};
