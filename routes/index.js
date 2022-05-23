var express = require('express');
const axios = require("axios");
var router = express.Router();
const bodyParser = require('body-parser');
var formidable = require('formidable');

const {Client} = require('@elastic/elasticsearch')
const client = new Client({node: 'http://localhost:9200'})

module.exports = client;
var nom_index = "wine";

router.get('/', function(req, res, next) {
  res.redirect('/list/0');
});

/* GET home page. */
router.get('/list/:id', async function (req, res, next) {
  const page = parseInt(req.params.id);
  const wineapi = await axios.get('http://127.0.0.1:8889/api/wine/all?page=' + page);
  console.log(wineapi);
  res.render('index', {title: 'Express', winetable: wineapi.data});
});


router.get('/kibana', function(req, res, next) {
  res.render('kibana', { title: 'Express' });
});

router.get('/edit/:id', async function(req, res, next) {
  const id = parseInt(req.params.id);
  const wineapi = await axios.get('http://127.0.0.1:8889/api/wine/' + id);
  console.log(wineapi);
  //await res.json(wineapi.data);
  res.render('updatewine', { title: 'Express', winetable:wineapi.data });
});
//obtenir 1 vin
router.get('/wine/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const wineapi = await axios.get('http://127.0.0.1:8889/api/wine/' + id);
  console.log(wineapi);
  //await res.json(wineapi.data);
  res.render('wine', { title: 'Express', winetable:wineapi.data });
});

router.get('/wine/json/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const wineapi = await axios.get('http://127.0.0.1:8889/api/wine/' + id);
  console.log(wineapi);
  await res.json(wineapi.data);
});

router.get('/wine/all/:id', async (req, res) => {
  const page = parseInt(req.params.id);
  const wineapi = await axios.get('http://127.0.0.1:8889/api/wine/all?page=' + page);
  console.log(wineapi);
  await res.json(wineapi.data);
});

router.get('/wine/del/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const wineapi = await axios.delete('http://127.0.0.1:8889/api/wine/' + id);


  try {
      await client.deleteByQuery({
        index: nom_index,
        body: {
          query: {
            match: {ID: id}
          }
        }
      })
      await client.indices.refresh({index: nom_index})
    res.redirect('/');
  } catch (error) {
    res.send('Unable to delete data. Check syntax.')
  }
});

router.delete("/wine/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const wineapi = await axios.delete('http://127.0.0.1:8889/api/wine/' + id);
  console.log(wineapi);
  await res.json("le vin "+id+" a ete supprime");
});

router.get('/newwine', function (req, res, next) {
  res.render('newwine', {title: 'Add new wine'});
});

router.post('/newwine', async function (req, res, next) {
  let userJson = {};
  var form = new formidable.IncomingForm();
  form.parse(req, async function (err, fields, files) {
    var values = [
      [fields.name, fields.description, fields.country, fields.region, fields.year],
    ];
    userJson = {fields};
    console.log(userJson.fields);
    console.log("save " + fields.name + " " + fields.description + " " + fields.country + " " + fields.region + " " + fields.year);
    const wineapi = axios.post('http://127.0.0.1:8889/api/wine/add', userJson.fields);

  var lastid = await getNextId();
  var parseId = parseInt(lastid) + 1;
  var stringId = parseId;
  var id = stringId.toString();
  console.log(id);
  var name = fields.name;
  var description = fields.description;
  var country = fields.country;
  var region = fields.region;
  var year = fields.year;

    try {
        await client.index({
          index: nom_index,

          body: {
            ID: id,
            NAME: name,
            DESCRIPTION: description,
            COUNTRY: country,
            REGION: region,
            YEAR: year
          }
        })
        await client.indices.refresh({index: nom_index})
        res.redirect('/');
    } catch (error) {
      res.send('Unable to add data. Check syntax.')
    }
  })
});

async function getNextId() {
  const wineapi = await axios.get('http://127.0.0.1:8889/api/wine/getnextid');
  var id = wineapi.data;
  return id;
}

router.post('/updatewine', function  (req, res, next) {
  let userJson = {};
  var form = new formidable.IncomingForm();
  form.parse(req, async function (err, fields, files) {
    var values = [
      [fields.name, fields.description, fields.country, fields.region, fields.year, fields.id],
    ];
    userJson = {fields};
    console.log(userJson.fields);
    console.log("save " + fields.name + " " + fields.description + " " + fields.country + " " + fields.region + " " + fields.year);
    const wineapi = axios.put('http://127.0.0.1:8889/api/wine/' + fields.id, userJson.fields);

    var id = fields.id;
    console.log(id);
    var name = fields.name;
    var description = fields.description;
    var country = fields.country;
    var region = fields.region;
    var year = fields.year;

    try {
      await client.updateByQuery({
        index: nom_index,

        script: {
          source: "ctx._source.COUNTRY = params.COUNTRY; ctx._source.YEAR = params.YEAR; ctx._source.DESCRIPTION = params.DESCRIPTION; ctx._source.NAME = params.NAME; ctx._source.REGION = params.REGION; ",
          lang: "painless",
            params: {
            COUNTRY: country,
            YEAR: year,
            DESCRIPTION: description,
            NAME: name,
            REGION: region,

          }
        },
        query: {
            match: {
                ID: "" + id + ""
            }
        }
      }).then(function (resp) {
        console.log("modif reussi", resp);
      },
        function (err) {
            console.log(err.message);
        });
      await client.indices.refresh({index: nom_index})
      res.redirect('/edit/' + fields.id);
    } catch (error) {
      res.send('Unable to add data. Check syntax.')
    }

  })
});

router.post("/wine/add", async (req, res) => {
  console.log(req.body);
  const wineapi = await axios.post('http://127.0.0.1:8889/api/wine/add', req.body);
  await res.json("le vin a ete ajoute");
});

router.put("/wine/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const wineapi = await axios.put('http://127.0.0.1:8889/api/wine/' + id, req.body);
  console.log(wineapi);
  await res.json("le vin a ete modifie");
});


module.exports = router;
