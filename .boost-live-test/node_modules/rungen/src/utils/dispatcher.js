const createDispatcher = () => {
  let listeners = []

  return {
    subscribe: (listener) => {
      listeners.push(listener)
      return () => {
        listeners = listeners.filter(l => l !== listener)
      }
    },
    dispatch: (action) => {
      listeners.slice().forEach(listener => listener(action))
    }
  }
}

export default createDispatcher