// const property = require('lodash.property');
// const recast = require('recast');
// const types = require('ast-types');

// const safeAST = code => {
//   let ast;

//   try {
//     ast = recast.parse(code);
//   } catch (e) {
//     return { error: e, ast };
//   }

//   return { ast };
// };

// const parseToBlock = code => {
//   const { error, ast } = safeAST(code);

//   if (error) {
//     throw error;
//   }

//   let name, params, returns;

//   types.visit(ast, {
//     visitFunction: function(node) {
//       // console.log(node);

//       // TODO: check if it's an object, otherwise no params!
//       params = node.value.params[0].properties.map(property('key.name'));
//       name = node.value.id.name;

//       this.traverse(node);
//     },

//     visitReturnStatement: function(node) {
//       // console.log(node);

//       returns = node.value.argument.properties.map(property('key.name'));

//       this.traverse(node);
//     }
//   });

//   return { code, name, params, returns };
// };

// const addBlockSrc = `
// function add({ x, y }) {
//   return { n: x + y };
// }`;

// const lineBlockSrc = `
// function line({ x, y }) {
//   return {
//     ui: DOM.line({ x, y })
//   };
// }
// `

/*
 * block schema:
 * - input - object with inputs and default values
 * - outputValue - object with outputs and default values
 * - code - backend
 * - ui - functional react ui, DOM exposed as global
 */

const sampleBlock = `
{
  name: 'mult',
  input: { x: 0 },
  outputValue: { result: 0 },
  state: { mod: 20 },

  code: ({ input, state, updateState }) => {
    return {
      result: input.x * state.mod
    };
  },

  ui: ({ input, state, updateState }) => {
    return DOM.div(
      null,
      DOM.inut({ type: 'slider', min: 0, max: 10, onChange: e => updateState({ mod: e.target.value }) })
    );
  }
}
`;

const executeBlockSrc = blockSrc => new Function(`return ${blockSrc.trim()}`)();

// const out = executeBlockSrc(sampleBlock);

// console.log(
//   out.code({
//     input: { x: 2 },
//     state: { mod: 10 }
//   })
// );

const uuid = require('uuid/v4');
const Rx = require('rx');

const intervalBlock = {
  name: 'interval',

  outputs: ['tick'],

  code: ({ inputs, outputs }) => {
    let counter = 0;

    setInterval(() => {
      outputs.tick.onNext(counter);
      counter++;
    }, 1000);
  }
};

const tapBlock = {
  name: 'tap',

  inputs: ['any'],
  outputs: ['any'],

  code: ({ inputs, outputs }) => {
    inputs.any
      .tap(val => {
        console.log('tap:', val);
      })
      .asObservable()
      .subscribe(outputs.any);
  }
};

class Graph {
  constructor() {
    this.runningBlocks = {};
    this.connections = [];
  }

  addBlock(block) {
    const id = uuid();

    this.runningBlocks[id] = Object.assign({}, block);

    const inputs = (block.inputs || []).reduce((memo, key) => Object.assign(memo, { [key]: new Rx.Subject() }), {});
    const outputs = (block.outputs || []).reduce((memo, key) => Object.assign(memo, { [key]: new Rx.Subject() }), {});

    this.runningBlocks[id]._streams = { inputs, outputs };
    this.runningBlocks[id].code({ inputs, outputs });

    return id;
  }

  addConnection(from, to) {
    const id = uuid();

    this.connections.push({ id, from, to });

    const fromOutput = this.runningBlocks[from.id]._streams.outputs[from.output];
    const toInput = this.runningBlocks[to.id]._streams.inputs[to.input];

    fromOutput.asObservable().subscribe(toInput);

    return id;
  }
}

const graph = new Graph();

const intervalId = graph.addBlock(intervalBlock);
const tapId = graph.addBlock(tapBlock);

// graph.addConnection({ id: intervalId, output: 'tick' }, { id: tapId, input: 'any' });

// stringify and parse block

const stringifyBlock = obj => {
  return JSON.stringify(obj, (_, value) => (typeof value === 'function' ? value.toString() : value));
};

const parseBlock = str => {
  const parsed = JSON.parse(str);

  if (parsed.code) parsed.code = executeBlockSrc(parsed.code);
  if (parsed.ui) parsed.ui = executeBlockSrc(parsed.ui);

  return parsed;
};

const stringified = stringifyBlock(tapBlock);

console.log(stringified);

console.log(parseBlock(stringified));
