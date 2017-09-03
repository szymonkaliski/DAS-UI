const utilLogger = `{
  name: 'util/logger',
  inputs: ['log'],
  outputs: [],

  code: ({ inputs, setState }) => {
    inputs.log.subscribe(log => {
      setState({ log });
    });
  },

  ui: ({ state }) => {
    return window.DOM.pre(
      {},
      typeof(state.log) == 'object'
        ? JSON.stringify(state.log, null, 2)
        : state.log
    );
  }
}`;

const timeInterval = `{
  name: 'time/interval',
  inputs: ['interval'],
  outputs: ['tick'],

  code: ({ inputs, outputs, state, setState }) => {
    let counter = 0;

    const doTick = time => {
      if (this.intervalHandle) {
        this.clearInterval(this.intervalHandle);
      }

      this.intervalHandle = setInterval(() => {
        outputs.tick.onNext(counter);
        setState({ counter });
        counter++;
      }, time);
    };

    inputs.interval.subscribe(val => {
      if (typeof val === 'number') {
        setState({ tickInterval: val });
        doTick(val);
      }
    });

    const defaultInterval = 1000;
    setState({ tickInterval: defaultInterval });
    doTick(defaultInterval);
  },

  cleanup: () => {
    this.clearInterval(this.intervalHandle);
  },

  ui: ({ state }) => {
    return DOM.div(
      null,
      DOM.div(null, 'tick: ' + state.counter),
      DOM.div(null, '(every ' + state.tickInterval + 'ms)')
    );
  }
}`;

const timeDelay = `{
  name: 'time/delay',
  inputs: ['data', 'delay'],
  outputs: ['delayed'],

  code: ({ inputs, outputs }) => {
    const connectWithDelay = delay => {
      if (this.connection) {
        this.connection.dispose();
      }

      this.connection = inputs.data.delay(delay).subscribe(delayed => outputs.delayed.onNext(delayed));
    }

    inputs.delay.startWith(1000).subscribe(delay => {
      connectWithDelay(delay);
    });
  }
}`;

const uiNumber = `{
  name: 'ui/number',
  outputs: ['number'],

  code: ({ state, outputs }) => {
    state.subscribe(({ value }) => {
      outputs.number.onNext(value);
    });
  },

  ui: ({ state, setState }) => {
    return DOM.input({
      style: { width: '100%' },
      type: 'number',
      onChange: e => setState({ value: parseFloat(e.target.value) }),
      value: state.value
    });
  }
}`;

const baseMathOps = [['sum', '+'], ['sub', '*'], ['mult', '*'], ['div', '/']].map(
  ([name, op]) =>
    `{
  name: 'math/${name}',
  outputs: ['${name}'],
  inputs: ['a', 'b'],

  code: ({ inputs, outputs }) => {
    const combined = rx.Observable.combineLatest(inputs.a.startWith(0), inputs.b.startWith(0));

    combined.subscribe(([a, b]) => {
      outputs.${name}.onNext(a ${op} b);
    });
  }
}`
);

const mathRand = `{
  name: 'math/rand',
  outputs: ['rand'],
  inputs: ['new'],

  code: ({ inputs, outputs }) => {
    inputs.new.subscribe(() => {
      outputs.rand.onNext(Math.random());
    });
  }
}`;

const twoArgMathOps = ['max', 'min', 'pow'].map(
  name =>
    `{
  name: 'math/${name}',
  outputs: ['${name}'],
  inputs: ['a', 'b'],

  code: ({ inputs, outputs }) => {
    inputs.val.subscribe(val => {
      outputs.onNext(Math.${name}(val));
    });

    const combined = rx.Observable.combineLatest(inputs.a.startWith(0), inputs.b.startWith(0));

    combined.subscribe(([a, b]) => {
      outputs.${name}.onNext(Math.${name}(a, b));
    });
  }
}`
);

const singleArgMathOps = ['sin', 'cos', 'tan', 'atan', 'ceil', 'floor', 'log', 'log10', 'exp', 'abs'].map(
  name => `{
  name: 'math/${name}',
  outputs: ['${name}'],
  inputs: ['val'],

  code: ({ inputs, outputs }) => {
    inputs.val.subscribe(val => {
      outputs.${name}.onNext(Math.${name}(val));
    });
  }
}`
);

export default [
  ...baseMathOps,
  ...singleArgMathOps,
  ...twoArgMathOps,
  mathRand,
  timeDelay,
  timeInterval,
  uiNumber,
  utilLogger,
];
