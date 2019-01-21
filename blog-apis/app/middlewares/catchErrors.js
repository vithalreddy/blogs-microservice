/* disable eslint */

// attaches catch err to middlewares
module.exports = fn => (req, res, next) => fn(req, res, next).catch(next);
