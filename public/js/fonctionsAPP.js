/*function doTransaction (secret, destinationAccount, montant){
	var StellarSdk = require('stellar-sdk');
	StellarSdk.Network.useTestNetwork();
	var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
	var sourceKeys = StellarSdk.Keypair
	  .fromSecret(secret);


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
		return transaction;
		//res.redirect('/doTransactions');
	})
	.catch(function(error) {
		console.error('Something went wrong!', error);
	});
}*/

function initTableau (nomFonction=""){
	tabPeriodes = [];
	var url = "http://groups.cowaboo.net/group-coInvest/public/api/observatory?observatoryId=Propositions";
	var jqxhr =  $.get(url);
	jqxhr.done(function( data ) {
		valueJSON = data.dictionary.entries;
		$.each(valueJSON, function(i, obj) {
			hash = i;
			//alert(JSON.parse(obj.value));
			$.each(JSON.parse(obj.value), function(j, obj2) {
				//if(obj2.publicKey!="undefined"){
				tabPropositions = [];
				$.each(obj2.listePropositions, function(k, obj3) {
					tabInvestissements = [];
					$.each(obj3.listeInvestissements, function(l, obj4){
						tabInvestissements.push(new Investissement(obj4.accountId, obj4.montant, obj4.dateInvestissement, obj4.lienTransaction));
					});
					idMaxProposition = obj3.propositionId;
					tabPropositions.push(new Proposition(obj3.nomProjet, obj3.dateDebutProjet, obj3.dateFinProjet, obj3.descriptionProjet, obj3.propositionId, obj3.publicKey, obj3.accountId, obj3.balance, obj3.statut, obj3.listeInvestissements));
				});
				tabPeriodes.push(new Periode(obj2.numeroPeriode, obj2.dateDebutPeriode, obj2.dateFinPeriode, tabPropositions));
					
					//GERER LES SESSION POUR EVITER LE UNDEFINED SAUF DECONNEXION, VOIR LA REDIRECTION
					//METTRE CETTE PAGE CORRECTE, FAIRE LEXEMPLE DE TRANSACTION, MODIFIER LES SPRINTS
					//COMMENCER POUR LES PAIEMENTS
				//}
			});
		});
		//On sait quoi faire lorsque la requête est terminée
		switch(nomFonction) {
			case "afficherProposition":
				afficherProposition();
				break;
			case "afficherListePropositions":
				afficherListePropositions();
				break;
			case "lancerTransactions":
				lancerTransactions();
				break;
			case "afficherListeInvestissements":
				afficherListeInvestissements();
		}
	});
	jqxhr.fail(function(data){
		alert("Le fichier json n'a pas été récupéré");
		//$("#resultat").text("Cette clé privée n'est pas valide");
	});
}