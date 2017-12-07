//Renvoi la cl� publique de l'account du compte qui se connecte
function getAccountId(key, tab){
	var accountId = "-1";
	$.each(tab, function(i, obj) {
		if(obj.publicKey == key){
			accountId = obj.accountKey;
			//on arr�te la boucle
			return false;
		}
	});
	return accountId;
}

$("#btnAccepter").click(function(){
	//r�cup�rer la cl�Publique, g�n�rer le account et ensuite faire l'ajout des deux dans le tableau
	//qui va �tre converti en JSON pour �tre renvoy� en tant que PUT dans l'entry correspondante
	//voir pour les sessions avec node
	window.location = "/account";
	alert("account");
	var url = "/account";
	var jqxhr =  $.get(url);
	jqxhr.done(function( data ) {
		account = data;
		alert(account.balance);
	});
	jqxhr.fail(function( data ) {
		alert(fail);
	});
});

/*htmlEncode et htmlDecode non utilis�, car encodeURIComponent() r�gle le soucis qu'il y a eu en passant le htmlDecode
  de la description dans l'url pour la requ�te put, lors de l'ajout et de la modification d'une proposition*/
function htmlDecode (string) {
	var whiteList = {
		"&#39;":"'",
		"&#38;":"&",
		"&agrave;":"�",
		"&auml;":"�",
		"&uuml;":"�",
		"&eacute;":"�",
		"&egrave;":"�",
		"&ouml;":"�",
		"&ecirc;&nbsp;":"�",
		"&acirc;":"�",
		"&ucirc;":"�",
		"&ocirc;":"�",
		"&icirc;":"�",
		"&iuml;":"�",
		"&ugrave;":"�",
		"&ccedil;":"�",
		"&quot;":'"'
	};
	var specialCharDecoder = /&#39;|&#38;|&agrave;|&auml;|&uuml;|&eacute;|&egrave;|&ouml;|&ecirc;|&acirc;|&ucirc;|&ocirc;|&icirc;|&iuml;|&ugrave;|&ccedil;|&quot;/g;
	return ('' + string).replace(specialCharDecoder, function (match) {
	   return whiteList[match]; 
	});
}

function htmlEncode (string) {
	var whiteList = {
		"'":"&#39;",
		"&":"&#38;",
		"�":"&agrave;",
		"�":"&auml;",
		"�":"&uuml;",
		"�":"&eacute;",
		"�":"&egrave;",
		"�":"&ouml;",
		"�":"&ecirc;&nbsp;",
		"�":"&acirc;",
		"�":"&ucirc;",
		"�":"&ocirc;",
		"�":"&icirc;",
		"�":"&iuml;",
		"�":"&ugrave;",
		"�":"&ccedil;",
		'"':"&quot;"
		
	};
	var specialCharDecoder = /'|&;/g;
	return ('' + string).replace(specialCharDecoder, function (match) {
	   return whiteList[match]; 
	});
}

/* Test creer un account */
.get('/account', function(req, res) {
    // The SDK does not have tools for creating test accounts, so you'll have to
	// make your own HTTP request.
	// create a completely new and unique pair of keys
	// see more about KeyPair objects: https://stellar.github.io/js-stellar-sdk/Keypair.html
	var pair = StellarSdk.Keypair.random();

	console.log(pair.secret());
	
	console.log(pair.publicKey());
	session.accountId = pair.publicKey();

	var request = require('request');
	request.get({
	  url: 'https://horizon-testnet.stellar.org/friendbot',
	  qs: { addr: pair.publicKey() },
	  json: true
	}, function(error, response, body) {
		if (error || response.statusCode !== 200) {
			console.error('ERROR!', error || body);
		}
		else {
			//console.log(body);
			console.log("Jusqu'ici tout va bien");
			var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
			console.log("l'important c'est l'aterrissage");
			// the JS SDK uses promises for most actions, such as retrieving an account
			server.loadAccount(pair.publicKey()).then(function(account) {
				console.log('Balances for account: ' + pair.publicKey());
				account.balances.forEach(function(balance) {
					console.log(account);
					console.log('Type:', balance.asset_type, ', Balance:', balance.balance);
					var info = "secret : "+pair.secret()+", public : "+pair.publicKey()+", balance : "+balance.balance+"";
					res.render('account.ejs', {accountSecret: pair.secret(), accountPublic: pair.publicKey(), sessPublicKey: session.publicKey});
				});
			});
		}
	});
})
//on r�cup�re le taux d'un euro en francs suisses, puis le taux d'un XLM(Lumens) en Euro et puis on fait le calcul
//pour obtenir le prix d'un XLM en francs suisses.
/*function majTaux(){
	var tauxLumensEuro;
	var tauxEuroCHF;
	var jqxhr = $.get( "http://api.fixer.io/latest", function() {
	})
	.done(function(data) {
		tauxEuroCHF = data.rates.CHF
		var jqxhr = $.get( "http://ticker.stellar.org", function() {
		})
		.done(function(data) {
			$.each(data, function(i, obj){
				if(obj.Name == "XLM_EUR"){
					tauxLumensEuro = obj.Price;
				}
			});
			tauxLumensCHF = tauxLumensEuro * tauxEuroCHF;
			alert(tauxLumensCHF);
		})
		.fail(function() {
			console.log( "error : ticher.stellar.org" );
		})
	})
	.fail(function() {
		console.log( "error : api.fixer.io/latest" );
	})
}*/
/*
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
			console.log(tauxEuroCHF);
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
					var tauxLumensCHF = tauxLumensEuro * tauxEuroCHF;
					return tauxLumensCHF;
					
				}
			}
			xmlhttp2.open("GET", "http://ticker.stellar.org", true);
			xmlhttp2.send();
		}
	}
	xmlhttp.open("GET", "http://api.fixer.io/latest", true);
	xmlhttp.send();
}*/

		//proposition.listeInvestissements.push(new Investissement(utilisateur.accountId, valeur));
			/*
			var http=new XMLHttpRequest();
			var url = "/transaction?";
			var params = "secretKey="; //A CHANGER !!!!!!
			params    += "&destinationKey="+utilisateur.accountId;
			params    += "&valeur="+valeur;
			http.open("POST", url, true);
			
			//Send the proper header information along with the request+
			http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			http.send(params);
			http.onreadystatechange = function() {//Call a function when the state changes.
				
				if(http.readyState == 4 && http.status == 200) {
					alert("Investissement r�ussi, la transaction est en cours.");
					window.location = "/listePropositions";
					
				} else if(http.readyState == 4){
					alert("Un probl�me est survenu, v�rifier que vous avez le solde suffisant sur votre compte.");
				}
			}
			*/
			
			/*
				RECUPER L'ACCOUNT ID EN PARAMETRE QUAND ON RENVOI LA PAGE, POUR LE METTRE DANS L'Investissement
				PUIS ENSUITE AJOUTER L'INVESTISSEMENT DANS LA LISTE ET ENSUITE FAIRE L'ALGO QUI LIT POUR CHAQUE
				PROPOSITION, SI ELLE A ATTEINT LE BUT ET DANS LE CAS CONTRAIRE RENVOI LARGENT GRACE A LA LISTE
				D'INVESTISSEMENT.
			*/
	}
		/*function doPost(){
		alert($('#nomProjet').val());
		var http=new XMLHttpRequest();
		var url = "/ajoutProposition";
		var params = "nomProjet="+$('#nomProjet').val();
		params    += "&dateDebutProjet="+$('#dateDebutProjet').val();
		params    += "&dateFinProjet="+$('#dateFinProjet').val();
		params    += "&descriptionProjet="+CKEDITOR.instances['descriptionProjet'].getData();
		http.open("POST", url, true);

		//Send the proper header information along with the request+
		/*http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		http.setRequestHeader("Accept", "application/json");
		http.setRequestHeader("Accept", "application/x-www-form-urlencoded");
		http.send(params);
		http.onreadystatechange = function() {//Call a function when the state changes.
			
			if(http.readyState == 4 && http.status == 200) {
				alert("r�ussi !");
			} else if(http.readyState == 4){
				alert("La requ�te put n'a pas �t� correctement effectu�e");
			}
		}
	}*/