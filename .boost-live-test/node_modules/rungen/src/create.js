import builtinControls from './controls/builtin'
import is from './utils/is'

const create = (userControls = []) => {
  const controls = [...userControls, ...builtinControls]

  const runtime = (input, success = () => {}, error = () => {}) => {
    const iterate = gen => {
      const yieldValue = isError => ret => {
        try {
          const { value, done } = isError ? gen.throw(ret) : gen.next(ret)
          if (done) return success(value)
          next(value)
        } catch (e) {
          return error(e)
        }
      }

      const next = ret => {
        controls.some(control => control(ret, next, runtime, yieldValue(false), yieldValue(true)))
      }

      yieldValue(false)()
    }

    const iterator = is.iterator(input)
      ? input
      : function* () {
          return yield input
        }()

    iterate(iterator, success, error)
  }

  return runtime
}

export default create;
