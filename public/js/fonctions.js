/*
	Auteur : Amir SAIDI
	Date création : septembre 2017
	Lieu : Genève / HEG
	Description : Fichier javascript qui contient toutes les fonctions qui sont utilisées exactement de la même façon par toutes les pages.
*/

// tableau des périodes
var tabPeriodes;
// tableau des comptes.
var tabComptes;
// id de la dernière proposition faite.
var idMaxProposition;
//hash récupérer lors de la récupération du JSON sur cowaboo, permet de le mettre en paramètre lors de la modification.
var hash;

//clé public du compte du site, permet de le mettre en receveur lors des investissements.
var investProjectPublicKey = "GAAUHKDFLSMN47SOESMRRM7R2KDL7CCC4SZIIF5U44C4ZTSSA35QXKHF";

//objectif en chf.
var objectifInvestissement = 3000;
//à combien de pourcent doit être l'objectif, pour que l'investissement va sur le compte du proposant.
//var tauxObjectif = 0.5; (pas utilisé pour l'instant)

/*
	Classe Propositon, contient toutes les informations utiles pour afficher les proposotions
	et également pouvoir distribuer les investissements à celui qui a créé la proposition.
	Il y a la liste des investissements, permettant de voir le monitor de la proposition.
	(les paramètre qui sont défini dans la parenthèse sont des paramètre par défaut,
	c'est à dire que si il n'y a aucune donnée passé en paramètre, l'attribut prendra la valeure
	qui est définie dans la parenthèse.)
*/
function Proposition(nomProjet, dateDebutProjet, dateFinProjet, descriptionProjet, propositionId, publicKey, email, balance = 0, statut = "En cours", listeInvestissements=[]){
	this.nomProjet = nomProjet;
	this.dateDebutProjet = dateDebutProjet;
	this.dateFinProjet = dateFinProjet;
	this.descriptionProjet = descriptionProjet;
	this.propositionId = propositionId;
	this.publicKey = publicKey;
	this.email = email;
	this.balance = balance;
	this.statut = statut;
	this.listeInvestissements = listeInvestissements;
}

/*
	Classe Periode, contient un identifiant, sa date de début et de fin, avec la liste
	des propositions qui ont été faite durant la période.
*/	
function Periode(numeroPeriode, dateDebutPeriode, dateFinPeriode, listePropositions=[]){
	this.numeroPeriode = numeroPeriode;
	this.dateDebutPeriode = dateDebutPeriode;
	this.dateFinPeriode = dateFinPeriode;
	this.listePropositions = listePropositions;
}

/*
	Classe Investissement, contient toutes les informations sur un investissement précis
	permettant de renvoyer les Lumens en cas de retour d'investissements. Contient 
	en plus l'email de l'investisseur, ce qui permet de le prévenir lors de la distribution
	de la crypto-monnaie.
*/
function Investissement(publicKey, montant, dateInvestissement, lienTransaction, email){
	this.publicKey = publicKey;
	this.montant = montant;
	this.dateInvestissement = dateInvestissement;
	this.lienTransaction = lienTransaction;
	this.email = email;
}

/*
	Classe Utilisateur, utile pour savoir quel utilisateur a déjà accepté le règlement.
*/
function Utilisateur(publicKey){
	this.publicKey = publicKey;
}

/*
	Fonction qui applique le datepicker aux champs des dates, ça permet d'avoir le choix des dates
	sur un calendrier peu importe le navigateur.
*/
function doDatePicker(){
	$( function() {
		var dateFormat = "dd/mm/yy",
		  from = $( "#dateDebutProjet" )
			.datepicker({
			  defaultDate: "+1w",
			  changeMonth: true,
			  numberOfMonths: 1,
			  dateFormat: "dd/mm/yy"
			})
			.on( "change", function() {
			  to.datepicker( "option", "minDate", getDate( this ) );
			}),
		  to = $( "#dateFinProjet" ).datepicker({
			defaultDate: "+1w",
			changeMonth: true,
			numberOfMonths: 1,
			dateFormat: "dd/mm/yy"
		  })
		  .on( "change", function() {
			from.datepicker( "option", "maxDate", getDate( this ) );
		  });
	 
		function getDate( element ) {
		  var date;
		  try {
			date = $.datepicker.parseDate( dateFormat, element.value );
		  } catch( error ) {
			date = null;
		  }
	 
		  return date;
		}
	});
}

/*
	Fonction qui recherche un utilisateur et le retourne si il est trouvé, sinon
	ça retourne "null".
*/	
function getUtilisateur(key, tab){
	var cleTrouve = -1;
	var utilisateur;
	$.each(tab, function(i, obj) {
		if(obj.publicKey == key){
			cleTrouve = 1;
			utilisateur = obj;
			return false; //pour arrêter la boucle
		}
	});
	if(cleTrouve == 1){
		return utilisateur;
	} else{
		return "null";
	}
}

/*
	Fonction qui cherche une proposition DANS TOUTES LES PERIODES.
*/
function getPropositionPeriode(id, tab){
	var proposition;
	$.each(tab, function(i, obj) {
		$.each(obj.listePropositions, function(j, obj2) {
			if(obj2.propositionId == id){
				proposition = obj2;
			}
		});
	});
	return proposition;	
}

/*
	Fonction qui cherche une proposition en fonction de son id dans un tableau de propositions passé en paramètre.
*/
function getProposition(id, tab){
	var proposition;
	$.each(tab, function(i, obj) {
		if(obj.propositionId == id){
			proposition = obj;
		}
	});
	return proposition; 
}

/*
	Fonction qui retourne la période qui a l'id envoyé en paramètre. Il y aussi le tableau des periodes
	dans lequel il faut chercher la periode. (c'est utilisé pour l'affichage de la liste des propositions)
*/
function getPeriode(numero, tab){
	var periode;
	$.each(tab, function(i, obj) {
		if(obj.numeroPeriode == numero){
			periode = obj;
		}
	});
	return periode; 
}

/*
	Fonction qui recherche dans la liste des propositions de la periode en paramètre, la proposition qu'il faut modifier.
	Lorsque la proposition est trouvée, on la remplace par celle passée en paramètre, c'est à dire la proposition modifiée.
*/
function setProposition(periode, proposition){
	$.each(periode.listePropositions, function(i, obj) {
		if(obj.propositionId == proposition.propositionId){
			obj = proposition;
		}
	});
	return periode;
}

/*
	Fonction qui met à jour la balance du compte de l'utilisateur connecté en appelant le GET Balance de app.js
	qui lui utilise le module de stellar qui permet de communiquer avec l'api Horizon et récupérer la balance.
*/
function getBalance(){
	var balance;
	var balanceCHF = 0;
	var jqxhr =  $.get( "/balance");
	jqxhr.done(function( data ) {
		$.each(JSON.parse(data), function(i, obj) {
			balance = parseFloat(obj.balance);
			balanceCHF = obj.tauxLumensCHF;
			if(!balance>0){
				balance=0;
			}
			$('#solde').text("Votre solde : "+balance.toFixed(7)+" XLM / "+(balanceCHF*balance).toFixed(2)+" CHF");
		});
	});
	jqxhr.fail(function(data){
		balance = 0;
		$('#solde').text("Votre solde : "+balance.toFixed(7)+" XLM / "+(balanceCHF*balance).toFixed(2)+" CHF");
	});
	//return balance;
}


/*
	Récupère le JSON des périodes avec les propositions et leurs investissements et les converti en objet.
	Il y a un paramètre qui est le nom de la fonction a exécuter une fois que le traitement est terminé,
	cela permet d'avoir récupéré toutes les données avant de les utiliser dans une fonction. (problème d'asynchronicité)
*/
function initPeriodes (nomFonction=""){
	if(nomFonction!="lancerTransactions"){
		attendre(true);
	}
	tabPeriodes = [];
	var xmlhttp;
	xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
			idMaxProposition = 0;
			var data = xmlhttp.responseText;
			data = JSON.parse(data);
			valueJSON = data.dictionary.entries;
			obj = valueJSON;
			for(var key in obj){
				hash = key;
				objJ = JSON.parse(obj[key].value);//decodeURIComponent(obj[key].value));
				objJ.forEach(function(obj2){
					tabPropositions = [];
					obj2.listePropositions.forEach(function(obj3) {
						tabInvestissements = [];
						obj3.listeInvestissements.forEach(function(obj4){
							tabInvestissements.push(new Investissement(obj4.accountId, obj4.montant, obj4.dateInvestissement, obj4.lienTransaction));
						});
						idMaxProposition = obj3.propositionId;
						tabPropositions.push(new Proposition(obj3.nomProjet, obj3.dateDebutProjet, obj3.dateFinProjet, obj3.descriptionProjet,
											 obj3.propositionId, obj3.publicKey, obj3.email, obj3.balance, obj3.statut, obj3.listeInvestissements));
					});
					tabPeriodes.push(new Periode(obj2.numeroPeriode, obj2.dateDebutPeriode, obj2.dateFinPeriode, tabPropositions));
				})
			}
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
		} else if (xmlhttp.readyState == 4) {
			alert("il y a eu une erreur lors du chargement des propositions, veuillez s'il vous plait relancer la page.");
		}
	}
	xmlhttp.open("GET", "http://groups.cowaboo.net/group-coInvest/public/api/observatory?observatoryId=Propositions", true);
	xmlhttp.send();
}


/*
	Fonction permettant de récupérer les comptes à travers le JSON posté sur Cowaboo et de les mettre dans un tableau d'Utilisateurs,
	pour pouvoir les utiliser. (On convertit le JSON en objets)
*/
function initComptes (){
	tabComptes = [];
	var url = "http://groups.cowaboo.net/group-coInvest/public/api/observatory?observatoryId=Comptes";
	var jqxhr =  $.get(url);
	jqxhr.done(function( data ) {
		valueJSON = data.dictionary.entries;
		$("#json").text(valueJSON);
		sessPublicKey = $('#sessPublicKey').text();
		$.each(valueJSON, function(i, obj) {
			hash = i;
			$.each(JSON.parse(obj.value), function(j, obj2) {
				if(obj2.publicKey!="undefined"){
					tabComptes.push(new Utilisateur(obj2.publicKey));
				}
			});
		});
		if(getUtilisateur(sessPublicKey, tabComptes)!="null"){
			$('#submit').attr('action', '/accueil');
		} else{
			tabComptes.push(new Utilisateur(sessPublicKey));
		}
	});
	jqxhr.fail(function(data){
		alert("Le fichier json n'a pas été récupéré");
	});
}

/*
	Cette fonction permet d'envoyer les comptes en les convertissant en JSON, ils sont envoyés à app.js
	qui va les envoyer sur Cowaboo. L'envoi est fait depuis app.js car il est côté serveur et pour faire
	les PUT sur cowaboo, on a besoin de la clé privée, donc on passe juste l'information depuis le client 
	pour que le serveur utilisent ses informations et les envoient à Cowaboo. On envoi aussi le hash des valeurs
	précédentes pour l'entrer en paramètre des values de cowaboo, ce qui permet d'avoir un lien avec l'ancienne entry (je pense).
*/
function putComptes () {
	attendre(true);
	var dataString = 'comptes='+ encodeURIComponent(JSON.stringify(tabComptes)) + '&hash=' + hash;
	$.ajax({
		type: "PUT",
		url: "/comptes",
		data: dataString,
		success: function(data) {
			attendre(false);
			if(data=="error"){
				alert("Désolé, il y a eu un problème avec un des serveurs.");
			} else{
				window.location="/accueil";	
			}
			
		},
		error: function(data) {
			attendre(false);
			alert("Désolé, il y a eu un problème avec un des serveurs.");
		}
	});
}

/*
	Même principe que putCompte mais avec les périodes contenants les propositions qui elle mêmes contiennent
	les investissements. Cette fonction est appelée depuis plusieurs endroit, donc celon l'action qui est faite
	un message différents est renvoyé au client.
*/
function putPeriodes(action, proposition=null){
	attendre(true);
	var dataString = 'periodes='+ encodeURIComponent(JSON.stringify(tabPeriodes)) + '&hash=' + hash;
	$.ajax({
		type: "PUT",
		url: "/periodes",
		data: dataString,
		success: function(data) {
			if(data=="error"){
				attendre(false);
				switch(action) {
					case "modification":
						message("La modification n'a pas pu être faite, dû à un souci d'un serveur");
						break;
					case "investissement":
						message("l'investissement n'a pas pu être fait, dû à un souci d'un serveur");
						break;
					case "création":
						message("la création n'a pas pu être faite, dû à un souci d'un serveur");
				}
			} else{
				attendre(false);
				switch(action) {
					case "modification":
						message("Modification réussie.");
						break;
					case "investissement":
						getBalance();
						message("Votre investissement a été pris en compte.");
						setTimeout(function(){
							window.location = "/moniteurs/"+proposition;	
						}, 2000);
						break;
					case "création":
						message("Création de proposition réussie.");
						setTimeout(function(){
							window.location="/listePropositions";	
						}, 2000);
				}	
			}
			
		},
		error: function(data) {
			attendre(false);
			switch(action) {
				case "modification":
					message("La modification n'a pas pu être faite, dû à un souci d'un serveur");
					break;
				case "investissement":
					message("l'investissement n'a pas pu être fait, dû à un souci d'un serveur");
					break;
				case "création":
					alert("la création n'a pas pu être faite, dû à un souci d'un serveur");
			}
		}
	});
}

/*
	fonction qui change le curseur lorsqu'un traitement commence ou lorsqu'un traitement fini.
*/
function attendre(oui){
	if(oui==true){
		$('body').css('cursor', 'progress');
	}else{
		$('body').css('cursor', '');
	}
}

function message(msg){
	$('#msgInformation').text(msg);
	$('#information').dialog();
}

/*
	fonctions de récupération de la taille du navigateur

function getWindowHeight() {
    var windowHeight=0;
    if (typeof(window.innerHeight)=='number') {
        windowHeight=window.innerHeight;
    }
    else {
     if (document.documentElement&&
       document.documentElement.clientHeight) {
         windowHeight = document.documentElement.clientHeight;
    }
    else {
     if (document.body&&document.body.clientHeight) {
         windowHeight=document.body.clientHeight;
      }
     }
    }
    return windowHeight;
}

/*
	fonctions de positionnement du pied de page

function setFooter() {
    if (document.getElementById) {
        var windowHeight=getWindowHeight();
        if (windowHeight>0) {
            var contentHeight=
            document.body.offsetHeight;
			//alert(document.getElementsByTagName('footer'));
            var footerElement=document.getElementsByTagName('footer');
            var footerHeight=footerElement.offsetHeight;
        if (windowHeight-(contentHeight+footerHeight)>=0) {
            footerElement.style.position='relative';
            //footerElement.style.top=
            (windowHeight-(contentHeight+footerHeight))+'px';
        }
        else {
            footerElement.style.position='static';
        }
       }
      }
}
 */
