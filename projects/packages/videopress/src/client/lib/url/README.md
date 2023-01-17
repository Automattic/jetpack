# URL utils

## getVideoPressUrl()

## pickGUIDFromUrl()

```es6
const guid = pickGUIDFromUrl( 'https://videopress.com/v/SEhvBzm2?loop=1' ); // -> SEhvBzm2
```

## buildVideoPressURL( guid, attributes )

```es6
const { guid, url } = buildVideoPressURL( 'guid-id', { autoplay: true } );
```
