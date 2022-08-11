import { render } from 'preact';

console.log( 'Hello from the Action Bar!' );

const App = <h1>Hello World!</h1>;

// Inject our app into the DOM
render( App, document.body );
