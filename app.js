const addy        = require('./utils/address');
const axios       = require('axios');
const bodyParser  = require('body-parser');
const express 	  = require('express');
const app         = express()

// assign app settings from environment || default values
const port    = process.env.PORT || 8080;

// convert to read this from Env setting
let deposit_address_list = addy.getAddressList('eth');
const update_url         = process.env.API_UPDATE_URL;

// parse application/json
app.use(bodyParser.json())

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// set the home page route
app.get('/', function(req, res) {
  const name    = process.env.HEROKU_APP_NAME || 'Unknown Name';
  const version = process.env.HEROKU_RELEASE_VERSION || 'Unknown Version';
  res.json({"name": name,"version": version}); 	
});

//
// Retrieve transaction sent to monitored ETH addresses
//
app.post('/transaction/update', function(req, res) {
  let count = 0;
  let total = 0;
  const errors = [];
  const promises = [];
  for (var address of deposit_address_list) {
    let url = "http://api.ethplorer.io/getAddressTransactions/"+address+"?apiKey=freekey";
    const addy = address;
    console.log("processing deposit address "+addy);

    promises.push(axios.get(url)
      .then(function(response) {
        const body = response.data;
        if (body && body.length > 0) {
          for (var txn of body) {
            let data = {};
            data["wallet_address"] = txn.from;
            data["tx_id"] = txn.hash;
            data["tx_hash"] = txn.hash;
            data["amount"] = txn.value;
            data["currency"] = 'ETH';
            count++;
            total += txn.value;
            axios.post(update_url, data)
              .then(response => {
                console.log("Updated "+txn.hash+ " Successfully for sending wallet"+txn.from);
              })
              .catch(error => {
                console.log("Update of txn "+txn.hash+ " Failed wallet"+txn.from+" Status was "+error.response.status);
                errors.push("Error " + error.response.status + " while updating wallet " + error.message);
              });
          }
          console.log("Processed "+count+" transactions for a total of "+total+" ETH");
        } else {
          console.log("No transactions for address "+addy+" at ts "+new Date());
        }
      })
      .catch(function (err) {
        errors.push("Error processing wallet updates "+err);
      })
    );
  }
  Promise.all(promises)
  .then(function(values) {
     if (errors && errors.length > 0) {
       res.send({ status: 500, error: errors });
     } else {
       res.send({ status: 200, error: errors });
     }
  });
});

// Start the app listening to default port
app.listen(port, function() {
   const name = process.env.HEROKU_APP_NAME || 'Unknown'
   console.log(name + ' app is running on port ' + port);
   console.log("ETH Addy List is "+deposit_address_list);
});

