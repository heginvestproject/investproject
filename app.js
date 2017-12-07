var express = require('express');
var session = require('cookie-session'); // Charge le middleware de sessions
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var StellarSdk = require('stellar-sdk');


var server = new StellarSdk.Server('https://horizon.stellar.org');
//new StellarSdk.Server('https://horizon-testnet.stellar.org'); (pour faire les tests)
var fs = require("fs");
var vm = require('vm');
var schedule = require('node-schedule');
var tabPeriodes;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var nodemailer = require('nodemailer');


//var $ = require('jquery');

eval(fs.readFileSync(__dirname + '/compteGestion.js')+'');
eval(fs.readFileSync(__dirname + '/public/js/fonctions.js')+'');

var tauxLumensCHF;
var balanceCompte;

var transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // secure:true for port 465, secure:false for port 587
  auth: {
    user: email,
    pass: emailMdp
  }
});

//Le taux de change (XLM/CHF) est mis à jour toutes les 5 minutes
var k = schedule.scheduleJob('*/5 * * * *', function(){
	majTaux();
});

//fonction qui va être lancée tous les 1er du mois
var j = schedule.scheduleJob('0 0 1 * *', function(){
	initPeriodes("lancerTransactions");
});

var app = express();
app.use(express.static(__dirname + '/public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');



/* On utilise les sessions */
app.use(session({secret: 'investProjectSecret'}))


/* S'il n'y a pas de session, on les initialises pour la suite */
.use(function(req, res, next){
    if (typeof(session.publicKey) == 'undefined') {
        session.publicKey = req.session.publicKey;
    }
	if (typeof(session.doAcceptation) == 'undefined') {
        session.doAcceptation = req.session.doAcceptation;
    }
	majTaux()
	next();
})

/***********************************************************************************
************************************GET*********************************************
***********************************************************************************/

.get('/',function(req, res){
	//session = req.session; (j'avais session undefined et lorsque j'ai mis ça en commentaire ça a fonctionnée
	// peut être le problème est du que je redéfinissait session alors qu'en haut il était égal à require('cookie-session')...
	//Session set when user Request our app via URL
	if(session.publicKey) {
	/*
	* This line check Session existence.
	* If it existed will do some action.
	*/
		if(session.doAcceptation=="true"){
			res.redirect('/acceptation');
		} else{
			res.redirect('/accueil');
		}
	}
	else {
		res.redirect('/connexion');
	}
})

/* On vérifie que l'utilisateur a déjà accepté ou pas le règlement (dans acceptation.ejs) */
.get('/acceptation', function(req, res) {
	var pasConnecte=verifSession(req, res);
	if(pasConnecte==false){
		res.render('acceptation.ejs', {sessPublicKey: session.publicKey});
	}
})


/* On affiche le formulaire de connexion */
.get('/accueil', function(req, res) {
	var pasConnecte=verifSession(req, res);
	if(pasConnecte==false){
		res.render('accueil.ejs', {tauxLumensCHF:tauxLumensCHF, balanceCompte:balanceCompte});
	}
	
})

/* On affiche le formulaire de connexion */
.get('/ajouterLumens', function(req, res) {
	var pasConnecte=verifSession(req, res);
	if(pasConnecte==false){
		res.render('ajouterLumens.ejs', {tauxLumensCHF:tauxLumensCHF, balanceCompte:balanceCompte});
	}  
})

//Permet aux clients de voir la balance de leur compte
.get('/balance', function(req, res) {
	majBalance(true, res);
})


/* On affiche le formulaire de connexion */
.get('/connexion', function(req, res) { 
    res.render('connexion.ejs');
})

/* On affiche le formulaire de création de proposition */
.get('/creationProposition', function(req, res) { 
    var pasConnecte=verifSession(req, res);
	if(pasConnecte==false){
		res.render('creationProposition.ejs', {sessPublicKey: session.publicKey, tauxLumensCHF:tauxLumensCHF, balanceCompte:balanceCompte, sessEmail: session.email});
	}
	
})

/* On reset les variables de session */
.get('/deconnexion', function(req, res) { 
    var pasConnecte=verifSession(req, res);
	if(pasConnecte==false){
		session.publicKey=null;
		session.email=null;
		balanceCompte=0;
		res.redirect('/connexion');
	}
})

/*
/* On affiche les champs pour faire une transaction /
.get('/doTransactions', function(req, res) { 
    res.render('doTransactions.ejs');
})
*/

/* On affiche la page permettant de créer des exemples */
.get('/exemples', function(req, res) { 
    res.render('exemples.ejs', {sessPublicKey: session.publicKey, tauxLumensCHF:tauxLumensCHF, balanceCompte:balanceCompte, sessEmail: session.email});
})

/* On affiche le formulaire d'inscription */
.get('/inscription', function(req, res) { 
    res.render('inscription.ejs');
})

/* On affiche que l'inscription a été réussie */
.get('/inscriptionReussie', function(req, res) { 
    res.render('inscriptionReussie.ejs');
})

/* On affiche la liste des propositions de la période en cours */
.get('/listePropositions', function(req, res) { 
    var pasConnecte=verifSession(req, res);
	if(pasConnecte==false){
		res.render('listePropositions.ejs', {tauxLumensCHF:tauxLumensCHF, balanceCompte:balanceCompte});
	}
	
})

/* On affiche le moniteur de la proposition dont l'id est passé en paramètre */
.get('/moniteurs/:idProposition', function(req, res) {
	var pasConnecte=verifSession(req, res);
	if(pasConnecte==false){
		res.render('moniteur.ejs', {idProposition: req.params.idProposition, tauxLumensCHF:tauxLumensCHF, balanceCompte:balanceCompte});
	}
    
})

/* on affiche la proposition qui veut être vue en détail, grâce à son ID en paramètre*/
.get('/propositions/:idProposition', function(req, res) {
	var pasConnecte=verifSession(req, res);
	if(pasConnecte==false){
		res.render('proposition.ejs', {sessPublicKey: session.publicKey, idProposition: req.params.idProposition, tauxLumensCHF:tauxLumensCHF, balanceCompte:balanceCompte, sessEmail: session.email});
	}
    
})

/* On affiche le formulaire de connexion */
.get('/reglement', function(req, res) { 
	var pasConnecte=verifSession(req, res);
	if(pasConnecte==false){
		res.render('reglement.ejs', {tauxLumensCHF:tauxLumensCHF, balanceCompte:balanceCompte});
	}
})



/***********************************************************************************
************************************PUT*********************************************
***********************************************************************************/

.put('/comptes', urlencodedParser, function(req, res) {
	majComptes(req.body.comptes, req.body.hash, res);
})


.put('/periodes', urlencodedParser, function(req, res) {
	majPeriodes(req.body.periodes, req.body.hash, res);
})
/***********************************************************************************
************************************POST*********************************************
***********************************************************************************/

/* On initialise les sessions lors de la connexion */
.post('/init', urlencodedParser, function(req, res) { 
    session.publicKey=req.body.publicKey;
	session.doAcceptation=req.body.doAcceptation;
	session.email=req.body.email;
	if(session.doAcceptation=="true"){
		res.redirect('/acceptation');
	} else{
		res.redirect('/accueil');
	}
	majBalance();
	
})

//Permet d'effectuer un investissement
.post('/transaction', urlencodedParser, function(req, res) {
	// destinationID information venant du 2ème input
	var destinationId = req.body.destinationKey;
	// secretKey information venant du 1er input
	var secretKey = req.body.secretKey;
	var montant = req.body.valeur;
	
	
	var StellarSdk = require('stellar-sdk');
	StellarSdk.Network.usePublicNetwork();
	var server = new StellarSdk.Server('https://horizon.stellar.org');
	var sourceKeys = StellarSdk.Keypair
	  .fromSecret(secretKey);
	// First, check to make sure that the destination account exists.
	// You could skip this, but if the account does not exist, you will be charged
	// the transaction fee when the transaction fails.
	server.loadAccount(destinationId)
	// If the account is not found, surface a nicer error message for logging.
	.catch(StellarSdk.NotFoundError, function (error) {
	throw new Error('The destination account does not exist!');
	})
	// If there was no error, load up-to-date information on your account.
	.then(function() {
	return server.loadAccount(sourceKeys.publicKey());
	})
	.then(function(sourceAccount) {
	// Start building the transaction.
	var transaction = new StellarSdk.TransactionBuilder(sourceAccount)
	  .addOperation(StellarSdk.Operation.payment({
		destination: destinationId,
		// Because Stellar allows transaction in many currencies, you must
		// specify the asset type. The special "native" asset represents Lumens.
		asset: StellarSdk.Asset.native(),
		amount: montant
	  }))
	  // A memo allows you to add your own metadata to a transaction. It's
	  // optional and does not affect how Stellar treats the transaction.
	  .addMemo(StellarSdk.Memo.text('Test Transaction'))
	  .build();
	// Sign the transaction to prove you are actually the person sending it.
	transaction.sign(sourceKeys);
	// And finally, send it off to Stellar!
	return server.submitTransaction(transaction);
	})
	.then(function(result) {
		console.log('Success! Results:', result);
		res.send(result);
		//res.redirect('/doTransactions');
	})
	.catch(function(error) {
		console.error('Something went wrong!', error);
		res.send("error");
	});
	
	/*if(result==true){
		res.send("transaction réussie");
	}else{
		res.send("transaction échouée");
	}*/

})

/* En cas de page inexistante, on redirige vers la page qui renvoi soit vers la connexion soit vers l'accueil 
.use(function(req, res, next){
   // res.redirect('/');
	console.log("page non trouvée");
})*/

//fonction qui fait une transaction avec la clé secrète de l'account de celui qui envoit des Lumens,
//la clé publique du destinataire et le montant de lumens envoyés.
function doTransaction (secret, destinationAccount, montant){
	var StellarSdk = require('stellar-sdk');
	StellarSdk.Network.useTestNetwork();
	var server = new StellarSdk.Server('https://horizon.stellar.org');
	var sourceKeys = StellarSdk.Keypair
	  .fromSecret(secret);
	StellarSdk.Network.usePublicNetwork();
	// First, check to make sure that the destination account exists.
	// You could skip this, but if the account does not exist, you will be charged
	// the transaction fee when the transaction fails.
	server.loadAccount(destinationAccount)
	// If the account is not found, surface a nicer error message for logging.
	.catch(StellarSdk.NotFoundError, function (error) {
	throw new Error('The destination account does not exist!');
	})
	// If there was no error, load up-to-date information on your account.
	.then(function() {
	return server.loadAccount(sourceKeys.publicKey());
	})
	.then(function(sourceAccount) {
	// Start building the transaction.
	var transaction = new StellarSdk.TransactionBuilder(sourceAccount)
	  .addOperation(StellarSdk.Operation.payment({
		destination: destinationAccount, ////// AAAAAAAAAAAAAAAAAAAAAA VERIFIER
		// Because Stellar allows transaction in many currencies, you must
		// specify the asset type. The special "native" asset represents Lumens.
		asset: StellarSdk.Asset.native(),
		amount: montant
	  }))
	  // A memo allows you to add your own metadata to a transaction. It's
	  // optional and does not affect how Stellar treats the transaction.
	  .addMemo(StellarSdk.Memo.text('Test Transaction'))
	  .build();
	// Sign the transaction to prove you are actually the person sending it.
	transaction.sign(sourceKeys);
	// And finally, send it off to Stellar!
	return server.submitTransaction(transaction);
	})
	.then(function(result) {
		console.log('Success! Results:', result);
		//res.redirect('/doTransactions');
	})
	.catch(function(error) {
		console.error('Something went wrong!', error);
	});
}

function majComptes(json, hash, res="-1"){
	var http=new XMLHttpRequest();
	var url = "http://groups.cowaboo.net/group-coInvest/public/api/entry?";
	var params = "secretKey="+secretInvestProject;
	params    += "&observatoryId=Comptes";
	params    += "&hash="+hash;
	params    += "&newValue="+encodeURIComponent(json);
	http.open("PUT", url, true);

	//Send the proper header information along with the request+
	http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	http.setRequestHeader("Accept", "application/json");
	http.setRequestHeader("Accept", "application/x-www-form-urlencoded");
	http.send(params);
	http.onreadystatechange = function() {//Call a function when the state changes.
		
		if(http.readyState == 4 && http.status == 200) {
			if(res!="-1"){
				res.send("success");
			}
		} else if(http.readyState == 4){
			if(res!="-1"){
				res.send("error");
			}
		}
	}
}

function majPeriodes(json, hash, res="-1"){
	var http=new XMLHttpRequest();
	var url = "http://groups.cowaboo.net/group-coInvest/public/api/entry?";
	var params = "secretKey="+secretInvestProject;
	params    += "&observatoryId=Propositions";
	params    += "&hash="+hash;//recuperer le hash du PUT et l'envoyer au client (investir) faire la meme pour comptes
	params    += "&newValue="+encodeURIComponent(json);
	http.open("PUT", url, true);

	//Send the proper header information along with the request+
	http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	http.setRequestHeader("Accept", "application/json");
	http.setRequestHeader("Accept", "application/x-www-form-urlencoded");
	http.send(params);
	http.onreadystatechange = function() {//Call a function when the state changes.
		
		if(http.readyState == 4 && http.status == 200) {
			if(res!="-1"){
				res.send("success");
			}
		} else if(http.readyState == 4){
			if(res!="-1"){
				res.send("error");
			}
		}
	}
}

function majTaux(){
	var tauxLumensEuro;
	var tauxEuroCHF;
	var xmlhttp;
	// compatible with IE7+, Firefox, Chrome, Opera, Safari
	xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
			var data = JSON.parse(xmlhttp.responseText);
			tauxEuroCHF = data.rates.CHF;
			var xmlhttp2;
			// compatible with IE7+, Firefox, Chrome, Opera, Safari
			xmlhttp2 = new XMLHttpRequest();
			xmlhttp2.onreadystatechange = function(){
				if (xmlhttp2.readyState == 4 && xmlhttp2.status == 200){
					var data = JSON.parse(xmlhttp2.responseText);
					data.forEach(function(obj) {
						if(obj.Name == "XLM_EUR"){
							tauxLumensEuro = obj.Price;
						}
					});
					tauxLumensCHF = tauxLumensEuro * tauxEuroCHF;;
					
				}
			}
			xmlhttp2.open("GET", "http://ticker.stellar.org", true);
			xmlhttp2.send();
		}
	}
	xmlhttp.open("GET", "http://api.fixer.io/latest", true);
	xmlhttp.send();
}

//Fonction qui lance les transactions correspondantes aux résultats de chaque proposition
function lancerTransactions(){
	var periode = tabPeriodes.pop();
	periode.listePropositions.forEach(function(obj){
		//si la balance de la proposition atteint l'objectif d'investissement, alors le compte de l'utilisateur
		//qui a fait la proposition est crédité des lumens
		if((obj.balance*tauxLumensCHF) >= (objectifInvestissement)){
			doTransaction(secretInvestProject, obj.publicKey, obj.balance.toString());
			obj.statut = "investissements obtenus";
			envoyerEmail(obj.email, 'trueProposant', obj.nomProjet, obj.balance);
			obj.listeInvestissements.forEach(function(obj2){
				envoyerEmail(obj2.email, false, obj.nomProjet, obj2.montant);
			});
		//si la balance de la proposition n'atteint pas l'objectif d'investissement, alors les investissements sont
		//renvoyé aux investisseurs
		}else{
			envoyerEmail(obj.email, 'falseProposant', obj.nomProjet, obj.balance);
			obj.listeInvestissements.forEach(function(obj2){
				doTransaction(secretInvestProject, obj2.publicKey, obj2.montant.toString());
				envoyerEmail(obj2.email, true, obj.nomProjet, obj2.montant);
			});
			obj.statut = "investissements rendus";
		}
	});
	tabPeriodes.push(periode);
	var d = new Date();
	//le mois renvoyé est un chiffre de 0 à 11, donc si on est en janvier, on aura 0, donc on fait +1 pour avoir 01/
	//et on fait +2 pour avoir le mois suivant pour la date fin, ce qui donne 02 (février).
	var mois = d.getMonth()+2;
	var jour = d.getDate();
	var heure = d.getHours();
	var minute = d.getMinutes();
	var annee = d.getFullYear();
	if (mois < 10) { mois = '0' + mois; }
	if (jour < 10) { jour = '0' + jour; }
	if (mois=="01"){
		annee =d.getFullYear()+1;
	}
	
	var dateDebut = jour+"/"+(d.getMonth()+1)+"/"+annee;
	var dateFin = "01/"+mois+"/"+annee;
	tabPeriodes.push(new Periode(periode.numeroPeriode+1, d.getFullYear, dateFin));
	majPeriodes(encodeURIComponent(JSON.stringify(tabPeriodes)), hash);
}

/*
	Fonction qui met à jour la balance de la personne connectée.
*/
function majBalance(demande=false, res=""){
	var server = new StellarSdk.Server('https://horizon.stellar.org');
	//on prend la clé publique de celui connecté
	var publicKey = session.publicKey;
	if(server.loadAccount(publicKey)!="Unhandled rejection NotFoundError: [object Object]"){		
		// the JS SDK uses promises for most actions, such as retrieving an account
		server.loadAccount(publicKey).then(function(account) {
			account.balances.forEach(function(balance) {
				balanceCompte = balance.balance;
				console.log(balance.balance);
				actif=true;
				if(demande==true){
					var info = '[{"publicKey": "'+publicKey+'", "balance": "'+balance.balance+'", "tauxLumensCHF": "'+tauxLumensCHF+'"}]';
					res.send(info);
				}
			});
		});
	} else {
		balanceCompte=0;
		if(demande==true){
			var info = '[{"publicKey": "'+publicKey+'", "balance": "test", "tauxLumensCHF": "'+tauxLumensCHF+'"}]';
			res.send(info);
		}	
	}
}


/*
	Fonction qui envoie un mail à la personne concernée par la distribution d'un investissement.
	Cette fonction est faite pour l'envoi d'un email à une personne à la fois.
*/
function envoyerEmail(emailClient, retourInvestissement, nomProj, solde){
	var message ="";
	if(retourInvestissement==true){
		message = "<b> Le projet : "+nomProj+" n'a pas atteint l'objectif, donc votre investissement de "+solde+" XLM / "+
		(solde*tauxLumensCHF).toFixed(2)+" CHF retourne sur votre compte.<br><br>Si dans les 5-10 minutes qui suivent,"+
		"vous n'avez pas reçu la somme, veuillez contacter l'administrateur du site internet. Vous trouverez ses informations"+
		" de contact dans le pied de page du site internet. <br><br><br> InvestProject</b>"
	}else if(retourInvestissement==false){
		message = "<b> Le projet : "+nomProj+" a atteint l'objectif, donc votre investissement de "+solde+" XLM / "+
		(solde*tauxLumensCHF).toFixed(2)+" CHF a été envoyé sur le compte du proposant du projet. <br><br><br> InvestProject</b>"
	}else if(retourInvestissement=='trueProposant'){
		message = "<b> Votre projet : "+nomProj+" a atteint l'objectif, donc l'investissement de "+solde+" XLM / "+
		(solde*tauxLumensCHF).toFixed(2)+" CHF a été envoyé sur votre compte. <br><br><br> InvestProject</b>"
	}else {
		message = "<b> Votre projet : "+nomProj+" n'a pas atteint l'objectif, donc l'investissement de "+solde+" XLM / "+
		(solde*tauxLumensCHF).toFixed(2)+" CHF a été retourné sur les comptes des investisseurs. <br><br><br> InvestProject</b>"
	}

	var mailOptions = {
        from: email,
        to: emailClient,
        subject: "Résultat d'un investissement sur InvestProject",
       // text: req.body.message,
        html: message
	};

	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			return console.log(error);
		}
		console.log('Message sent: ' + info.response);
	});

}

/*
	Fonction qui vérifie si la personne est connectée ou pas.
*/
function verifSession(req, res){
	var pasConnecte=false;
	if(session.publicKey==null) {
		res.redirect("/connexion");
		pasConnecte=true;
	}
	return pasConnecte;
}


//port sur lequel est l'application
app.listen(80);   