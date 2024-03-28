# Data

Data queries in My Jetpack are made using [Tanstack queries](https://tanstack.com/query/v4/docs/framework/react/overview). Specifically right now, we are only using [useQuery](https://tanstack.com/query/v4/docs/framework/react/reference/useQuery) and [useMutation](https://tanstack.com/query/v4/docs/framework/react/reference/useMutation)

Most of the data queries can be made using `useSimpleQuery`, `useSimpleMutation` and `useJetpackApiQuery` directly in the component files. However, some queries need a bit of extra handling and logic, and can be created here in the `data/` directory under a new or existing subdirectory.

## Query Wrappers

### useSimpleQuery

```tsx
import { useSimpleQuery } from 'my-jetpack/_inc/data/useSimpleQuery';

const { data, isLoading, isError } = useSimpleQuery( {
    name: 'get some data',
    query: {
        path: 'my-jetpack/v1/some-data',
    }
    errorMessage: 'Failed to get some data'
} );
```
Query response values can be seen in the [tanstack documentation](https://tanstack.com/query/v4/docs/framework/react/reference/useQuery)

### useSimpleMutation

```tsx
import useSimpleMutation from 'my-jetpack/_inc/data/useSimpleMutation';
const { mutate: doSomething, isPending } = useSimpleMutation( {
    name: 'do something',
    query: {
        path: 'my-jetpack/v1/do-something',
        method: 'POST',
    }
    options: {
        onSuccess: () => {
            // do something on success
        }
    }
    errorMessage: 'Failed to do something'
} );

doSomething( null, {
    onSettled: () => {
        // do something on settled
        // onSettled runs regardless of the outcome of the query
        // In our current use-case we are sending the user to checkout
        // which we want to happen regardless of the outcome of the query
    },
    onSuccess: () => {
        // do something on success
        // only runs if query is successful
    }
} );

```
Query response values can be seen in the [tanstack documentation](https://tanstack.com/query/v4/docs/framework/react/reference/useMutation)

### useJetpackApiQuery

```tsx
import useJetpackApiQuery from 'my-jetpack/_inc/data/useJetpackApiQuery';

const { data, isLoading } = useJetpackApiQuery( {
    name: 'get some data',
    query: {
        path: 'my-jetpack/v1/some-data',
    }
    errorMessage: 'Failed to get some data'
} );
```

This is just a wrapper of useQuery, so it works very similar to useSimpleQuery. Only use this went querying data from the jetpack `restAPI` endpoint from the `@automattic/jetpack-api` package