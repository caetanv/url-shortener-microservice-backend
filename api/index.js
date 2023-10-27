require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema;

const UrlSchema = new Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model('Url', UrlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

function validateUrl(url) {
  const urlRegex =
    /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

  return urlRegex.test(url);
}

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// post url endpoint
app.post('/api/shorturl', async (req, res) => {
  try {
    const originalUrl = req.body.url;

    if (!validateUrl(originalUrl)) {
      return res.json({ error: 'invalid url' });
    }

    const lastUrlDoc = await Url.findOne({}, {}, { sort: { _id: -1 } });
    let shortUrl = 0;

    if (lastUrlDoc) {
      shortUrl = lastUrlDoc.short_url;
    }

    const url = new Url({
      original_url: originalUrl,
      short_url: (shortUrl += 1),
    });

    await url.save();

    res
      .status(201)
      .json({ original_url: url.original_url, short_url: url.short_url });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
