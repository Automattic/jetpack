const decoder = new TextDecoder();
const fromBase64 =
	typeof Uint8Array.fromBase64 === 'function'
		? ( toDecode: string ): string => {
				return decoder.decode( Uint8Array.fromBase64!( toDecode ) );
		  }
		: ( toDecode: string ): string => {
				const binString = atob( toDecode );
				return decoder.decode(
					Uint8Array.from( binString, ( char: string ): number => char.charCodeAt( 0 ) )
				);
		  };

const encoder = new TextEncoder();
const toBase64 =
	typeof Uint8Array.prototype.toBase64 === 'function'
		? ( toEncode: string ): string => {
				return encoder.encode( toEncode ).toBase64!();
		  }
		: ( toEncode: string ): string => {
				const bytes = encoder.encode( toEncode );
				const binString = Array.from( bytes, byte => String.fromCodePoint( byte ) ).join( '' );
				return btoa( binString );
		  };

export { fromBase64, toBase64 };
