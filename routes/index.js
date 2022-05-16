var express = require('express');
const axios = require("axios");
var router = express.Router();
const bodyParser = require('body-parser');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/kibana', function(req, res, next) {
  res.render('kibana', { title: 'Express' });
});

//obtenir 1 vin
router.get('/wine/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const wineapi = await axios.get('http://127.0.0.1:8889/api/wine/' + id);
  console.log(wineapi);
  //await res.json(wineapi.data);
  res.render('wine', { title: 'Express', winetable:wineapi.data });
});

router.get('/wine/all/:id', async (req, res) => {
  const page = parseInt(req.params.id);
  const wineapi = await axios.get('http://127.0.0.1:8889/api/wine/all?page=' + page);
  console.log(wineapi);
  await res.json(wineapi.data);
});

router.delete("/wine/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const wineapi = await axios.delete('http://127.0.0.1:8889/api/wine/' + id);
  console.log(wineapi);
  await res.json("le vin "+id+" a ete supprime");
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
