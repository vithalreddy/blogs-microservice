module.exports = (err, req, res, next) => {
  // console.log(req.path, err);

  if (err) {
    if (err.isJoi) {
      err.message = err.details[0].message;
      err.status = 400;
    } else if (err.isBoom) {
      err.status = err.output.statusCode;
    }

    const status = err.status || 500;
    // console.log(err.message);
    res.status(status).json({ message: err.message });
  }
  next();
};
