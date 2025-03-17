// ...

// Error handling for other errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Error handling for 404
app.use((req, res, next) => {
  res.status(404).send('Sorry, page not found');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});