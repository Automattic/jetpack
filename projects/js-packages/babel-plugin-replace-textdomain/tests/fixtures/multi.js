__( 'foo', 'a' );
_x( 'foo', 'context', 'b' );
_n( 'foo', 'foos', n, 'c' );
_nx( 'foo', 'foos', n, 'context', 'd' );

i18n.__( 'foo', 'a' );
i18n._x( 'foo', 'context', 'b' );
i18n._n( 'foo', 'foos', n, 'c' );
i18n._nx( 'foo', 'foos', n, 'context', 'd' );

_not( 'foo', 'foos', n, 'a' );
i18n._not( 'foo', 'foos', n, 'b' );
__.not( 'foo', 'c' );
