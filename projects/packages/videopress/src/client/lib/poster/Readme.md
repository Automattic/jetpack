# Poster library

## requestVideoPoster ( guid )

Async function to request the poster of the VideoPress video based on the given guid.
It takes a guid parameter and returns a Promise that resolves to an object containing the poster image URL. 

-   _guid_ `VideoGUID`: a string representing the GUID of the VideoPress video to update the poster for.

## requestUpdatePosterByVideoFrame( guid, atTime )

_Parameters_

This function is an asynchronous function that updates the poster image of a VideoPress video at a specific frame
using the WordPress REST API. The function takes two parameters:

-   _guid_ `VideoGUID`: a string representing the GUID of the VideoPress video to update the poster for.
-   atTime_ `number`: a number representing the time (in milliseconds) of the frame to set the poster to.

The function returns a Promise that resolves to an object containing the updated poster image URL.
