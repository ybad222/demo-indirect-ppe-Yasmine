const http = require('http');
const compression = require('compression');
const mustacheExpress = require('mustache-express');
const colors = require('colors');
const fs = require('fs');
const path = require('path');
const logger = require('coolest-logger');

// Load express
const express = require('express');
const app = express();
app.disable('etag');

// Load express middlewares
const morgan = require('morgan');
const serveStatic = require('serve-static');

// Catch uncaught exceptions
process.on('uncaughtException', function (err) {
	// handle the error safely
	console.log(err);
});
let listeningPort = 8090;

// Enable GZip compression
app.use(compression());

// Enable body parser
const bodyParser = require('body-parser');
// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: false
}));
// Set a maximun for body parser
app.use(bodyParser.json({
	limit: '50mb'
}));


app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.use(morgan());

app.use(['/stackoverflow'], function (req, res) {
    let data = {}
    res.render('stackOverflow', data);
});

app.use(['/loginOK'], function (req, res) {
    let data = {RLOC:req.query.rloc,FREQUENT_FLYER:req.query.ff}
    console.log(("Someone connected to access "+req.query.rloc+" with frequent flyer "+req.query.ff+" and his password is..."+req.query.password).green)
    res.render('loginOK', data);
});
app.use(['/paymentOK'], function (req, res) {
    let data = {RLOC:req.query.rloc}
    data.coolLogger = logger.logUnicorn.toString()+logger.logRobot.toString()
    res.render('paymentOK', data);
});
app.use(['/payment'], function (req, res) {
    let data = {"RLOC": req.query.rloc||'None'}
    if (req.query.rloc === 'RWSA49'){
        data = JSON.parse(fs.readFileSync("./views/nce-lhr.json"));
    } else if (req.query.rloc === 'RWSA48'){
        data = JSON.parse(fs.readFileSync("./views/nce-mad.json"));
    }
    data.coolLogger = logger.logUnicorn.toString()+logger.logRobot.toString()
    res.render('payment', data);
});
app.use(['/mybooking'], function (req, res) {
    res.status(200);
    let data = {"RLOC": req.query.rloc||'None'}
    if (req.query.rloc === 'RWSA49'){
        data = JSON.parse(fs.readFileSync("./views/nce-lhr.json"));
    } else if (req.query.rloc === 'RWSA48'){
        data = JSON.parse(fs.readFileSync("./views/nce-mad.json"));
    }
    data.MODIFY = req.query.modifyAction||'payment';
    if (!data.MEDICAL){
        data.MEDICAL = 'none'
    }
    let cc_style = 'display:none'
    if (req.query['DISPLAY_CC'] === 'true'){
        cc_style = '';
    }
    data.CC_STYLE = cc_style;
    data['XSS_NAME'] = req.query.name||''
    let ext_style = 'display:none'
    let ext_style_conceal = 'display:none'
    if (req.query.hasOwnProperty("ext")){
        if (req.query['ext'] === 'conceal'){
            ext_style_conceal = ''
        } else {
            ext_style = ''
        }
    }
    data.EXT_STYLE = ext_style
    data.EXT_STYLE_CONCEAL = ext_style_conceal
    if (!req.query.hasOwnProperty("ext") && !req.query['DISPLAY_CC'] === 'true'){
        data.CREDIT_CARD = '';
        console.log('No credit card'.red)
    }
    data.coolLogger = logger.logUnicorn.toString()+logger.logRobot.toString()
    console.log(data)
    if (data['ETICKET']){
        res.render('booking', data);
    } else {
        res.render('nobooking', data);
    }
});
app.use(['/modifybooking'], function (req, res) {
    let data = {RLOC:req.query.rloc,FREQUENT_FLYER:req.query.ff,ORIGIN:req.query.origin}
    data.ACTION="loginOK"
    console.log((new Date()+ "Some target connected try to access "+req.query.rloc+" with frequent flyer "+req.query.ff).gray)
    res.status(200);
    res.render('modifyBooking', data);
});
app.use(['/email'], function (req, res) {
    email(req,res)
});
function email(req,res){
    let rloc = true
    let data = {"RLOC": req.query.rloc||'None'}
    if (req.query.rloc === 'RWSA49'){
        data = JSON.parse(fs.readFileSync("./views/nce-lhr.json"));
    } else if (req.query.rloc === 'RWSA48'){
        data = JSON.parse(fs.readFileSync("./views/nce-mad.json"));
    } else {
        // Redirect to standard email
        rloc = false;
    }
    if (rloc){
        data['TRAVELLER_NAME_UPPERCASE'] = data['TRAVELLER_NAME'].toUpperCase()
    }
    let modifyAction = '/payment';
    data['MODIFY_ACTION'] = modifyAction;
    if (rloc == false){
        res.redirect("/email?rloc=RWSA49");
    } else {
        res.status(200);
        res.render('email', data);
    }
}

// Enable Cross domain CORS requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method == 'OPTIONS') {
        res.status(200).end();
    } else {
        next();
    }
});

// Mount a Static File server to serve static files
app.use(serveStatic( path.join( __dirname,'./static')));

// Log all errors
app.use((err, req, res, next) => {
	log.error(err.stack);
	next(err);
});

// Log client errors
app.use((err, req, res, next) => {
	if (req.xhr) {
		res.status(500).send({
			error: 'internal server error'
		});
	} else {
		next(err);
	}
});

// Final logger for errors if not catched before
app.use((err, req, res, next) => {
	if (res.headersSent) {
		return next(err);
	}
	res.status(500);
	res.send({ error: err });
});

// Default 404 
app.use((req, res) => {
    let error = "404 File not found. Are you an hacker ?"
    return res.status(404).send({
        error: error
    });
});

// Create HTTP server
const httpServer = http.Server(app);
httpServer.listen(listeningPort, () => {
    console.log(`Config - HTTP Express server listening on port ${listeningPort}`.blue);
});
