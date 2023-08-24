const express = require('express');
const { app } = require('./server');
const adaptParseBody = require('./utils/adaptParseBody');
const { ddgSearch, ddgSearchSummary, googleSearch, googleSearchSummary } = require('./search');

app.use('/', express.static('public/'));

app.get('/', (req, res) => {
  res.send({ t: Date.now() });
});

app.use('/googlethis', async (req, res) => {
  res.status(404).send({ error: 'This path has been deprecated. Please use: \'/google-search\'' })
});

app.use('/googleresult', async (req, res) => {
  res.status(404).send({ error: 'This path has been deprecated. Please use: \'/google-search-summary\'' })
});

app.use('/google-search', async (req, res) => {
  const { query } = adaptParseBody(req)
  if (!query) return res.status(400).send({ error: 'Invalid body' })
  res.send(await googleSearch(query))
});

app.use('/ddg-search', async (req, res) => {
  const { query } = adaptParseBody(req)
  if (!query) return res.status(400).send({ error: 'Invalid body' })
  res.send(await ddgSearch(query))
});

app.use('/google-search-summary', async (req, res) => {
  const { query, showUrl = true } = adaptParseBody(req)
  if (!query) return res.status(400).send({ error: 'Invalid body' })
  res.type('text/plain')
  res.send(await googleSearchSummary(showUrl, query))
});

app.use('/ddg-search-summary', async (req, res) => {
  const { query, showUrl = true } = adaptParseBody(req)
  if (!query) return res.status(400).send({ error: 'Invalid body' })
  res.type('text/plain')
  res.send(await ddgSearchSummary(showUrl, query))
});

app.post('/wakeup', (req, res) => {
  res.send('OK');
});

const started = Date.now()
app.get('/started', (req, res) => {
  res.send({ t: started });
});

module.exports = () => true
