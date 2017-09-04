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

const utilFetch = `{
  name: 'util/fetch',
  inputs: ['url'],
  outputs: ['json'],

  code: ({ inputs, outputs }) => {
    inputs.url.subscribe(url => {
      fetch(url).then(res => res.json()).then(json => outputs.json.onNext(json));
    });
  },
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
      value: state.value || 0
    });
  }
}`;

const uiString = `{
  name: 'ui/string',
  outputs: ['string'],

  code: ({ state, outputs }) => {
    state.subscribe(({ value }) => {
      outputs.string.onNext(value);
    });
  },

  ui: ({ state, setState }) => {
    return DOM.input({
      style: { width: '100%' },
      type: 'text',
      onChange: e => setState({ value: e.target.value }),
      value: state.value || ''
    });
  }
}`;

const svgContainer = `{
  name: 'svg/container',
  inputs: ['children'],

  code: ({ inputs, setState }) => {
    setState({ children: [] });
    inputs.children.subscribe(val => setState({ children: val }));
  },

  ui: ({ state }) => {
    return DOM.svg(
      { width: "100%", height: "100%" },
      state.children
    );
  }
}`;

const svgCircle = `{
  name: 'svg/circle',
  inputs: ['cx', 'cy', 'r'],
  outputs: ['element'],

  code: ({ inputs, outputs }) => {
    const combined = rx.Observable.combineLatest(
      inputs.cx.startWith(0),
      inputs.cy.startWith(0),
      inputs.r.startWith(10)
    );

    combined.subscribe(([cx, cy, r]) => {
      outputs.element.onNext(DOM.circle({ cx, cy, r }));
    });
  }
}`;

const svgLine = `{
  name: 'svg/line',
  inputs: ['x1', 'y1', 'x2', 'y2'],
  outputs: ['element'],

  code: ({ inputs, outputs }) => {
    const combined = rx.Observable.combineLatest(
      inputs.x1.startWith(0),
      inputs.y1.startWith(0),
      inputs.x2.startWith(10),
      inputs.y2.startWith(10)
    );

    combined.subscribe(([x1, y1, x2, y2]) => {
      outputs.element.onNext(DOM.line({ x1, y1, x2, y2, style: { stroke: 'black', strokeWidth: 2 } }));
    });
  }
}`;

const svgRect = `{
  name: 'svg/rect',
  inputs: ['x', 'y', 'width', 'height'],
  outputs: ['element'],

  code: ({ inputs, outputs }) => {
    const combined = rx.Observable.combineLatest(
      inputs.x.startWith(0),
      inputs.y.startWith(0),
      inputs.width.startWith(10),
      inputs.height.startWith(10)
    );

    combined.subscribe(([x, y, width, height]) => {
      outputs.element.onNext(DOM.rect({ x, y, width, height }));
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
  uiString,
  utilLogger,
  utilFetch,
  svgContainer,
  svgCircle,
  svgLine,
  svgRect
];
