function capturarErroresAsincronos(controlador) {
  return (req, res, next) => (
    Promise.resolve()
      .then(() => controlador(req, res, next))
      .catch(next)
  );
}

module.exports = capturarErroresAsincronos;
