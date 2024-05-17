__( 'foo', 'srcdomain' );
_x( 'foo', 'context', 'srcdomain' );
_n( 'foo', 'foos', n, 'srcdomain' );
_nx( 'foo', 'foos', n, 'context', 'srcdomain' );

i18n.__( 'foo', 'srcdomain' );
i18n._x( 'foo', 'context', 'srcdomain' );
i18n._n( 'foo', 'foos', n, 'srcdomain' );
i18n._nx( 'foo', 'foos', n, 'context', 'srcdomain' );

_not( 'foo', 'foos', n, 'srcdomain' );
i18n._not( 'foo', 'foos', n, 'srcdomain' );
__.not( 'foo', 'srcdomain' );

(0,__)( 'foo', 'srcdomain' );
(0,_x)( 'foo', 'context', 'srcdomain' );
(0,_n)( 'foo', 'foos', n, 'srcdomain' );
(0,_nx)( 'foo', 'foos', n, 'context', 'srcdomain' );

(0,i18n.__)( 'foo', 'srcdomain' );
(0,i18n._x)( 'foo', 'context', 'srcdomain' );
(0,i18n._n)( 'foo', 'foos', n, 'srcdomain' );
(0,i18n._nx)( 'foo', 'foos', n, 'context', 'srcdomain' );
