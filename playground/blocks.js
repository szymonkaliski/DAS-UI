const property = require('lodash.property');
const recast = require('recast');
const types = require('ast-types');

const safeAST = code => {
  let ast;

  try {
    ast = recast.parse(code);
  } catch (e) {
    return { error: e, ast };
  }

  return { ast };
};

const parseToBlock = code => {
  const { error, ast } = safeAST(addBlockSrc);
  if (error) {
    throw error;
  }

  let name, params, returns;

  types.visit(ast, {
    visitFunction: function(node) {
      // console.log(node);

      // TODO: check if it's an object, otherwise no params!
      params = node.value.params[0].properties.map(property('key.name'));
      name = node.value.id.name;

      this.traverse(node);
    },

    visitReturnStatement: function(node) {
      // console.log(node);

      returns = node.value.argument.properties.map(property('key.name'));

      this.traverse(node);
    }
  });

  return { code, name, params, returns };
};




const addBlockSrc = `
function add({ x, y }) {
  return { n: x + y };
}`;

console.log(parseToBlock(addBlockSrc));

