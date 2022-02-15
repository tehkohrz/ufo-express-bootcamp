import express from 'express';

import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import jsStore from './jsonFileStorage.js';

// File paths
const __dirname = path.resolve();

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// NO EXTENSION
// List of all the sighitngs
app.get('/', (request, response) => {
  function readhandler(error, data) {
    const noOfSightings = data.sightings.length;
    response.render('main', { noOfSightings });
  }
  jsStore.read('data.json', readhandler);
});

// /SIGHTINGS SECTION
// Render an empty form to key in a new sighting
app.get('/sighting', (request, response) => {
  response.render('new-sighting', { submitted: false });
});

app.post('/sighting', (request, response) => {
  jsStore.add('data.json', 'sightings', request.body, (err) => {
    if (err) {
      response.status(500).send('DB write error.');
    }
  });
  response.render('new-sighting', { submitted: true });
});

// /SIGHTING/:INDEX SECTION
// Render a single sighting
app.get('/sighting/:index', (request, response) => {
  function readhandler(error, data) {
    const { index } = request.params;
    const sightingEntry = { ...data.sightings[index] };
    sightingEntry.keys = Object.keys(sightingEntry);
    sightingEntry.indexNo = index;
    response.render('sighting-entry', { sightingEntry });
  }
  jsStore.read('data.json', readhandler);
});

app.listen(3004);
