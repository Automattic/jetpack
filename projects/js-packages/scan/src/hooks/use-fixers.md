# useFixer()

React hook for fixing security threats with the Jetpack Scan API.

## Usage

```jsx
const FixThreatButton = ({ threat }) => {
  // Initialize the hook by providing a `threatId` or `threatIds` param.
  const {
    fix,
    fixStatuses,
    fetchFixStatuses,
    loading,
  } = useFixer( {
    threatId: threat.id 
  } );

  // Load the threat's fix status when the component mounts.
  useEffect( fetchFixStatuses, [ fetchFixStatuses ] );

  return (
    <div>
      <p>Current Fixer Status: { fixStatuses[threat.id] ?? 'loading' || 'null' }</p>
      <button
        onClick={() => {
          threatFixer.fix({ poll: true });
        }}
        disabled={loading}
      >
          { ! loading ? 'Fix Now' : 'Fix In Progress...' }
      </button>
    </div>
  );
};
```
