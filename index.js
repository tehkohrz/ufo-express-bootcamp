import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import { read, write, add } from './jsonFileStorage.js';

console.log('hello world');

const app = express();

const PORT = 80;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cookieParser());

// form that adds sightings to the list of sightings
app.get('/sighting', (req, res) => {
  res.render('sighting');
});

// adding user input to the data.json file (where the sightings are listed)

app.post('/sighting', (req, res) => {
  console.log('request body:', req.body);

  add('data.json', 'sightings', req.body, (data, err) => {
    if (err) {
      res.status(500).send('We\'re sorry, we couldn\'t process your request');
    }

    res.redirect('/');
  });
});

// displaying individual instances of UFO sightings from the data.json file
app.get('/sighting/:index', (req, res) => {
  console.log('request came in');

  read('data.json', (data, err) => {
    if (err) {
      console.log('read error', err);
    }

    console.log('done with reading');

    const { index } = req.params;
    console.log(index);

    if (data.sightings[index]) {
      const singleSighting = data.sightings[index];
      res.render('single-sighting', {
        eachSighting: singleSighting,
        index,
      });
    } else {
      res.status(404).send('Sorry, we cannot find that!');
    }
  });
});

// displays the main landing page
app.get('/', (req, res) => {
  // setting the cookie for tracking number of visits to the site
  res.cookie('visits', 1);

  // incrementing the number visits
  let visits = 0;
  if (req.cookies.visits) {
    visits = Number(req.cookies.visits);
  }
  visits += 1;

  res.cookie('visits', visits);

  read('data.json', (data, err) => {
    if (err) {
      console.log('read error', err);
    }
    const sightingQuery = req.query.sighting;
    console.log(sightingQuery);

    if (sightingQuery === 'shape') {
      data.sightings.sort((a, b) => ((a.shape > b.shape) ? 1 : -1));
    }

    if (sightingQuery === 'city') {
      data.sightings.sort((a, b) => ((a.city > b.city) ? 1 : -1));
    }

    if (sightingQuery === 'state') {
      data.sightings.sort((a, b) => ((a.state > b.state) ? 1 : -1));
    }

    if (sightingQuery === 'date_time') {
      data.sightings.sort((a, b) => ((a.date_time > b.date_time) ? 1 : -1));
    }

    console.log('done with reading');

    const { sightings } = data;
    res.render('index', { sightings, visits });
  });
});

// displays the edit form, entry fields populated with previous data
app.get('/sighting/:index/edit', (req, res) => {
  read('data.json', (data, err) => {
    if (err) {
      console.log('read error', err);
    }

    const { index } = req.params;

    const sighting = data.sightings[index];

    res.render('edit-sighting', { index, sighting });
  });
});

// edits content of data.json
app.put('/sighting/:index/edit', (req, res) => {
  const { index } = req.params;

  read('data.json', (data, err) => {
    if (err) {
      console.log('read error', err);
    }

    data.sightings[index] = req.body;

    write('data.json', data, (newData) => {
      console.log('file changed');
      res.redirect('/');
    });
  });
});

// deletes an object(1 specific incident) from the data.json file
app.delete('/sighting/:index/delete', (req, res) => {
  read('data.json', (data) => {
    const { index } = req.params;

    data.sightings.splice(index, 1);

    write('data.json', data, (newData) => {
      console.log('entry deleted');
      res.redirect('/');
    });
  });
});

app.get('/shapes', (req, res) => {
  read('data.json', (data) => {
    const sighting = data.sightings;

    res.render('shapes', { sighting });
  });
});

app.get('/shapes/:shape', (req, res) => {
  const shapes = req.params.shape;
  read('data.json', (data) => {
    const content = data.sightings;

    res.render('shapes-variable', { content, shapes });
  });
});

app.listen(PORT);
