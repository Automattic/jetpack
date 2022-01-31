/**
 * External dependencies
 */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

Enzyme.configure( { adapter: new Adapter() } );

// based on https://github.com/facebook/jest/issues/5124#issuecomment-418005972
// since jsdom do not allow changes in location afer v10
const windowLocation = JSON.stringify( window.location );
delete window.location;
Object.defineProperty( window, 'location', {
	value: JSON.parse( windowLocation ),
} );
