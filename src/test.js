const PENDING = Symbol("PENDING");
const FULFILLED = Symbol("FULFILLED");
const REJECTED = Symbol("REJECTED");

const isFunction = fn => typeof fn === 'function';
const isObject = param => isFunction(param) || !!(param && typeof param === 'object');


class MakePromise {
  constructor(executor) {

    this.status = PENDING;
    this.result = null;
    this.callbacks = [];

    const transfrom = (status, result) => {
      if (this.status !== PENDING) return;
      this.status = status;
      this.result = result;
      setTimeout(() => {
        this.callbacks.forEach(callback => this.handleCallback(callback));
      }, 0)
    }

    const onFulfilled = value => transfrom(FULFILLED, value)
    const onRejected = reason => transfrom(REJECTED, reason)

    let lock = false;  // add lock，防止多次  resolve || reject
    const resolve = (value) => {
      if (lock) return;
      lock = true;
      this.resolvePromise(this, value, onFulfilled, onRejected);
    };
    const reject = (reason) => {
      if (lock) return;
      lock = true;
      onRejected(reason);
      // transfrom(REJECTED, reason)
    };

    try {
      executor(resolve, reject);
    } catch (reason) {
      reject(reason);
    }
  }

  handleCallback(callback) {
    const { onFulfilled, onRejected, resolve, reject } = callback;
    const { status, result } = this;
    try {
      if (status === FULFILLED) {
        isFunction(onFulfilled) ? resolve(onFulfilled(result)) : resolve(result);
      } else if (status === REJECTED) {
        isFunction(onRejected) ? resolve(onRejected(result)) : reject(result);
      }
    } catch (reason) {
      reject(reason);
    }
  }

  resolvePromise(promise, x, resolve, reject) {
    if (promise === x) {
      return reject(new TypeError('promise can\'t some'));
    }
    if (x instanceof MakePromise) {
      return x.then(resolve, reject);
    }
    if (isFunction(x) || (typeof x === 'object' && x)) {
      try {
        let then = x.then;
        if (isFunction(then)) {
          // then.call(x, resolve, reject)
          // return new MakePromise(then.bind(x).then(resolve, reject));
          return new MakePromise(then.bind(x)).then(resolve, reject)
        } 
      } catch (reason) {
        return reject(reason);
      }
    }
    resolve(x);
  }

  then(onFulfilled, onRejected) {
    return new MakePromise((resolve, reject) => {
      const callback = { onFulfilled, onRejected, resolve, reject };
      if (this.status === PENDING) {
        this.callbacks.push(callback);
      } else {
        setTimeout(() => this.handleCallback(callback), 0);
      }
    });
  }
}

MakePromise.deferred = function () {
  const dfd = {};
  dfd.promise = new MakePromise( (resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
  })
  return dfd;
}

module.exports = MakePromise;

// let resolvePromise;

// new MakePromise((resolve, reject) => {
//   console.log(1);
//   resolvePromise = resolve;
//   console.log(3);
// }).then(res => console.log(res));


// resolvePromise(2);

