import express from 'express';
import methodOverride from 'method-override';

import {
  fileURLToPath,
} from 'url';
import path, {
  dirname,
} from 'path';

import jsStore from './jsonFileStorage.js';

// File paths
const __dirname = path.resolve();

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({
  extended: false,
}));
app.use(methodOverride('_method'));

const availableSorts = {
  date_time: 'Date & Time',
  shape: 'Shape',
  city: 'City',
  state: 'State',
};

// NO EXTENSION
// List of all the sightings
app.get('/', (request, response) => {
  function readhandler(error, data) {
    // Assigning each entry their original index before sort
    // else the link will call the entry inp the unsorted index from data.json
    data.sightings.forEach((entry, i) => {
      entry.originalIndex = i;
    });
    let renderedData = data.sightings;
    // @@@@@@@@@ Double check the sort function
    if (Object.keys(request.query).length) {
      const sortkey = request.query.sortBy;
      const sortedData = data.sightings.sort((a, b) => (a[sortkey] > b[sortkey] ? 1 : -1));
      renderedData = sortedData;
    }
    const noOfSightings = renderedData.length;
    response.render('main', {
      noOfSightings,
      renderedData,
      availableSorts,
    });
    // @@@@@@@@@@@@@@@@ TEST ZONE @@@@@@@@@@@@@@@@@ //
  }
  jsStore.read('data.json', readhandler);
});

// /SIGHTINGS SECTION
// Render an empty form to key in a new sighting
app.get('/sighting', (request, response) => {
  response.render('new-sighting', {
    submitted: false,
  });
});

app.post('/sighting', (request, response) => {
  request.body.entryDate = Date().slice(0, 24);
  jsStore.add('data.json', 'sightings', request.body, (err) => {
    if (err) {
      response.status(500).send('DB write error.');
    }
  });
  response.render('new-sighting', {
    submitted: true,
  });
});

// /SIGHTING/:INDEX SECTION
// Render a single sighting
app.get('/sighting/:index', (request, response) => {
  function readhandler(error, data) {
    const {
      index,
    } = request.params;
    const sightingEntry = {
      ...data.sightings[index],
    };
    sightingEntry.keys = Object.keys(sightingEntry);
    sightingEntry.indexNo = index;
    response.render('sighting-entry', {
      sightingEntry,
    });
  }
  jsStore.read('data.json', readhandler);
});

// Edit the data for a sighting
app.get('/sighting/:index/edit', (request, response) => {
  function readhandler(error, data) {
    const {
      index,
    } = request.params;
    const sightingEntry = {
      ...data.sightings[index],
    };
    const indexNo = index;
    response.render('sighting-edit', {
      sightingEntry, indexNo,
    });
  }
  jsStore.read('data.json', readhandler);
});

// PUT request for the overwrite of the data.json
// Redirect to sighting/:index to display data
app.put('/sighting/:index/edit', (request, response) => {
  const {
    index,
  } = request.params;
  const sightingEntry = request.body;

  function readhandler(error, data) {
    console.log(request.body);

    data.sightings[index] = request.body;
    jsStore.write('data.json', data, (err) => {
    });
    response.redirect(`/sighting/${index}`);
  }
  jsStore.read('data.json', readhandler);
});

// Delete Entry
app.delete('/sighting/:index', (request, response) => {
  function readhander(error, data) {
    const {
      index,
    } = request.params;
    data.sightings.splice(index, 1);
    const noOfSightings = data.sightings.length;
    jsStore.write('data.json', data, (err) => {
      console.log('Deleted entry');
    });
    // response.render('main', { noOfSightings });
    response.redirect('/');
  }
  jsStore.read('data.json', readhander);
});

// SHAPES SECTION
// Get sighting based on shape
app.get('/shapes', (request, response) => {
  function readhandler(error, data) {
    const shapesList = [];
    data.sightings.forEach((entry) => {
      const shapes = entry.shape;
      if (!(shapesList.includes(shapes))) {
        shapesList.push(shapes);
      }
    });
    shapesList.sort((a, b) => a - b);
    response.render('shapes', {
      shapesList,
    });
  }
  jsStore.read('data.json', readhandler);
});

// Render the list of entry with the shape
app.get('/shapes/:shape', (request, response) => {
  const {
    shape,
  } = request.params;

  function readhander(error, data) {
    const filteredData = data.sightings.filter((entry, index) => {
      if (entry.shape === shape) {
        const foundEntry = entry;
        foundEntry.indexNo = index;
        return foundEntry;
      }
    });
    console.log(filteredData);
    w;

    response.render('list-for-shape', {
      filteredData,
      shape,
    });
  }
  jsStore.read('data.json', readhander);
});

app.listen(3004);
