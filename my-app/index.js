import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

import jsStore from './jsonFileStorage.js';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({
  extended: false,
}));
app.use(cookieParser());
app.use(methodOverride('_method'));

// templates
const availableSorts = {
  date_time: 'Date & Time',
  shape: 'Shape',
  city: 'City',
  state: 'State',
};

const sightingTemplate = {
  text: ['Text', 'text'],
  date_time: ['Date & Time', 'datetime-local'],
  city: ['City', 'text'],
  state: ['State', 'text'],
  shape: ['Shape', 'text'],
  duration: ['Duration', 'text'],
  summary: ['Summary', 'text'],
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
    visitCounter(request, response);

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
  visitCounter(request, response);
  response.render('new-sighting', {
    submitted: false,
    validEntry: false,
    sightingTemplate,
  });
});

app.post('/sighting', (request, response) => {
  request.body.entryDate = Date().slice(0, 24);
  const validEntry = validateForm(request.body);
  if (validEntry) {
    jsStore.add('data.json', 'sightings', request.body, (err) => {
      if (err) {
        response.status(500).send('DB write error.');
      }
    });
    response.render('new-sighting', {
      submitted: true,
      validEntry,
      sightingTemplate,
    });
  } else {
    const entry = request.body;
    response.render('new-sighting', {
      submitted: true,
      entry,
      validEntry,
      sightingTemplate,
    });
  }
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
    visitCounter(request, response);
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
    visitCounter(request, response);
    response.render('sighting-edit', {
      sightingEntry,
      indexNo,
      sightingTemplate,
      validInput: true,
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
  console.log(sightingEntry);

  function readhandler(error, data) {
    data.sightings[index] = request.body;
    const validInput = validateForm(request.body);
    if (validInput) {
      jsStore.write('data.json', data, (err) => {});
      response.redirect(`/sighting/${index}`);
    } else {
      // Render the same content without resetting
      const indexNo = index;
      response.render('sighting-edit', {
        sightingEntry,
        indexNo,
        validInput,
        sightingTemplate,
      });
    }
  }
  jsStore.read('data.json', readhandler);
});

// Delete Entry
app.delete('/sighting/:index', (request, response) => {
  const {
    index,
  } = request.params;
  jsStore.delArray('data.json', 'sightings', index);
  response.redirect('/');
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

  function readhandler(error, data) {
    const filteredData = data.sightings.filter((entry, index) => {
      if (entry.shape === shape) {
        const foundEntry = entry;
        foundEntry.indexNo = index;
        return foundEntry;
      }
    });
    console.log(filteredData);
    visitCounter(request, response);
    response.render('list-for-shape', {
      filteredData,
      shape,
    });
  }
  jsStore.read('data.json', readhandler);
});

app.listen(3004);

// FUNCTIONS MISC

// function to validate the data entered for the entry
// @param entry {object} of the sighting entry
function validateForm(entry) {
  // Date time validation check if its future entry
  if (Date.parse(entry.date_time) > Date.now()) {
    return false;
  }
  return true;
}

// Function that updates the visit cookie and send it back to the cilent
function visitCounter(request, response) {
  // initialising counter if no previous visits
  if (request.cookies.visitCount == undefined) {
    response.cookie('visitCount', 1);
    const currentDate = new Date();
    const lastUpdate = {
      day: currentDate.getDate(),
      month: currentDate.getMonth(),
      year: currentDate.getYear(),
    };
    response.cookie('lastUpdate', lastUpdate);
    return;
  }
  console.log('checking cookie', request.cookies.lastUpdate);

  // Check last visit update and update if its not the same date
  if (dateCheck(request.cookies.lastUpdate)) {
    let visits = Number(request.cookies.visitCount);
    visits += 1;
    response.cookie('visitCount', visits);
  }
}

// Check if the input date is the current date
// As long as different date return True, assuming people dont go back in time
function dateCheck(lastDate) {
  const currentDate = new Date();
  if (lastDate.day !== currentDate.getDate()
    || lastDate.month !== currentDate.getMonth()
    || lastDate.year !== currentDate.getYear()) {
    return true;
  }
  return false;
}
