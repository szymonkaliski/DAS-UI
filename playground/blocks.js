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
 * - output - object with outputs and default values
 * - code - backend
 * - ui - functional react ui, DOM exposed as global
 */

const sampleBlock = `
{
  name: 'mult',
  input: { x: 0 },
  output: { result: 0 },
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

const intervalBlock = {
  name: 'interval',

  output: { tick: 0 },
  state: { counter: 0 },

  code: ({ state, updateState, updateOutput }) => {
    setTimeout(() => {
      updateOutput({ tick: state.counter });
      updateState({ counter: state.counter + 1 });
    }, 200);
  }
};

const logBlock = {
  name: 'log',
  input: { any: '' },

  code: ({ input }) => {
    console.log(input);
  }
};

// console.log(intervalBlock)
// console.log(logBlock)

const uuid = require('uuid/v4');

class AbstractBlock {
  constructor(blockSpec) {
    this.name = blockSpec.name;
    this.input = blockSpec.input;
    this.output = blockSpec.output;
    this.state = blockSpec.state;
    this.code = blockSpec.code;
    this.ui = blockSpec.ui;



  }


}

class Graph {
  constructor() {
    this.runningBlocks = {};
    this.connections = [];
  }

  addBlock(block) {
    const id = uuid();

    this.runningBlocks[id] = block;

    return id;
  }

  addConnection(from, to) {
    const id = uuid();

    this.connections.push({ id, from, to });

    return id;
  }
}

const graph = new Graph();

const intervalId = graph.addBlock(intervalBlock);
const logId = graph.addBlock(logBlock);

graph.addConnection({ blockId: intervalId, output: 'tick' }, { blockId: logId, input: 'any' });
