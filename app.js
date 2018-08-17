const bodyParser    = require('body-parser');
const express 	  = require('express');
const request       = require('request-promise');
const rp            = require('request-promise');
const app           = express()

// assign app settings from envirtonment || default values
const port    = process.env.PORT || 8080;

// convert to read this from Env setting
const deposit_address_list = ['0xa0d7eF69cEBA8df2EFB11FdaFD53571C5CA710C2'];
const update_url = 'https://api.abelegroup.io/monitoring/update_transaction';

// parse application/json
app.use(bodyParser.json())

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// set the home page route
app.get('/', function(req, res) {
  res.json({"name": name,"version": version}); 	
});

//
// Retrieve transaction sent to Abele ETH addresses
//
app.post('/transaction/update', function(req, res) {
  let count = 0;
  let total = 0;
  for (var address of deposit_address_list) {
    let url = "http://api.ethplorer.io/getAddressTransactions/"+address+"?apiKey=freekey";
    console.log("Processing deposit address "+address);
    var options = { uri: url, json: true };
    rp(options)
    .then(function(body) {
      if (body && body.length > 0) {
        for (var txn of body) {
          const sender = txn.from;
          const hash = txn.hash;
          const amount = txn.value;
          count++;
          total += amount;
          request.post( update_url , { currency: 'ETH', amount: amount, wallet_address: sender, tx_hash: hash },
            function (error, response, body) {
              if (!error && response.statusCode == 200) {
                console.log(body)
              } else {
                console.log("Error " +response.statusCode+"  while updating sending wallet "+sender+" for currency ETH and amount "+amount);
              }
            }
          );
        }
        console.log("Process "+count+" transactions for a total of "+total+" ETH");
      } else {
        console.log("No transactions for address "+address+" at ts "+new Date());
      }
    })
    .catch(function (err) {
      res.send({ status: 500 });
    });
  }
});

//
// Retrieve total transactions sent to ETH address
//
app.get('/transaction/total', function(req, res) {
    var options = {
       uri: "https://api.etherscan.io/api?module=account&action=balance&address=" + ETH_ADDR + "&tag=latest&apikey=" + apikey,
       json: true
    };
    rp(options).then(function(body) {
        const total = body.result;
        const ts = +new Date()
        res.json({"currency": "ETH","total": total, "timestamp": ts});
    })
    .catch(function (err) {
        res.status(500);
    });
});

// Start the app listening to default port
app.listen(port, function() {
   const name = process.env.HEROKU_APP_NAME || 'Unknown'
   console.log(name + ' app is running on port ' + port);
});
