var monk = require('monk');

var theQuery = require("./create_query")

module.exports = {


	updateSolver: function (solver, dataDone) {
		var collection = db2.get('solvers');
		collection.update({email : solver.email}, {$set:{problems:solver.problems}}, function (err, doc){

                });		

	},
	addMember: function (member, problemId, dataDone) {
		var collection = db2.get('problems'); 
		console.log("problems - "+member.problems);
		collection.findOne({key : parseInt(problemId)}, function (err, doc) {
			
			console.log("problem"+doc);
			if (doc){
				var theSolvers = doc.solvers;
				if (!theSolvers) theSolvers = [];
				var aSolver = {
					"email": member.email,
					"comment": member.comments

				}
				
				theSolvers.push(aSolver);	
				console.log("add Member "+theSolvers);
				collection.update({key : doc.key}, {$set:{solvers:theSolvers}}, function (err, doc){

                		});

			}
		});		
	},
	
	insertSolver: function (solver, dataDone) {
                console.log("solver "+ JSON.stringify(solver));
		var collection = db2.get('solvers');
               	collection.insert({
                                        "first_name" : solver.first_name,
                                        "full_name": solver.full_name,
                                        "email" : solver.email,
                                        "company_url": "",
                                        "comments": solver.comments,
                                        "topics": "",
					"skills": solver.skills,
					"whatsapp": "",
					"looking_for": "",
					"bio": "",	
					"location": solver.location,
                                        "problems": solver.problems
                                        }, function (err, doc) {
                                                //console.log(err+" "+doc);
                                                if (err) {
                                                // If it failed, return error
                                                console.log('problem inserting');
                                                }
                                        else {
                                                console.log('inserted '+doc);
                                        }
            	})
	},


	searchProblems: function (resp, dataDone) {
		var collection = db2.get('problems');
		collection.find({area : resp}, function (err, doc) {
			dataDone(doc);	
		});		
	},
	matchProject: function (resp, dataDone) {
		var collection = db2.get('projects');
		console.log("match "+resp);
		collection.find({need : resp}, function (err, doc) {	
			console.log("found "+ JSON.stringify(doc));
			if (doc){
				dataDone(doc);
			}
		});
			
	},
	searchByEmail: function (resp, dataDone){
		var collection = db2.get('solvers');
		collection.findOne({email : resp}, function (err, doc) {
                        console.log("found "+ JSON.stringify(doc));
               		dataDone(doc);
                });	
		//dataDone("You have a long beard with "+ resp);

	},
	
	searchUser: function (resp, dataDone) {
		var collection = db2.get('crawl');
		
		collection.find(theQuery.createQuery(resp),{}, function(e, docs) {
			var message = '';
			if (docs.length > 0){
				message = "Ok, so I found "+docs.length+" people in "+resp;
				dataDone(message);
			}
			var data = [];
			for (var i = 0;i<docs.length;i++){
				console.log("coming here "+resp+" "+docs[i].first_name);
				var theEmail = docs[i].email[0];
				if (typeof docs[i].email === 'string') theEmail = docs[i].email.trim();	
				
				db2.get("people2").findOne({email:theEmail}, function(e, doc){
					
					var theLocation = doc.location[0];
                                	if (typeof doc.location === 'string') theLocation = doc.location.trim();
					var message2 = doc.full_name+" "+doc.company_url+" "+theLocation;
					dataDone(message2);
			
				});
			}
					
		});
	}
}
