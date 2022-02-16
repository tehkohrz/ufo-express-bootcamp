import express from 'express';
import methodOverride from 'method-override';

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
app.use(methodOverride('_method'));

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

// Edit the data for a sighting
app.get('/sighting/:index/edit', (request, response) => {
  function readhandler(error, data) {
    const { index } = request.params;
    const sightingEntry = { ...data.sightings[index] };
    sightingEntry.keys = Object.keys(sightingEntry);
    sightingEntry.indexNo = index;
    response.render('sighting-edit', { sightingEntry });
  }
  jsStore.read('data.json', readhandler);
});

// PUT request for the overwrite of the data.json
// Redirect to sighting/:index to display data
app.put('/sighting/:index/edit', (request, response) => {
  const { index } = request.params;
  function readhandler(error, data) {
    const sightingEntry = request.body;
    data.sightings[index] = request.body;
    jsStore.write('data.json', data, (err) => {
      console.log('Write sucess!');
    });
    response.render('sightings-entry', { sightingEntry });
  }
  jsStore.read('data.json', readhandler);
});

// Delete Entry
app.delete(('/sighting/:index'), (request, response) => {
  function readhander(error, data) {
    const { index } = request.params;
    data.sightings.splice(index, 1);
    const noOfSightings = data.sightings.length;
    jsStore.write('data.json', data, (err) => { console.log('Deleted entry');
    });
    response.render('main', { noOfSightings });
  }
  jsStore.read('data.json', readhander);
});

app.listen(3004);
