/* eslint-disable no-new-func */
export const executeBlockSrc = blockSrc => new Function(`return ${blockSrc.trim()}`)();
/* eslint-enable no-new-func */

