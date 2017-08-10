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

const out = executeBlockSrc(sampleBlock);

console.log(
  out.code({
    input: { x: 2 },
    state: { mod: 10 }
  })
);
