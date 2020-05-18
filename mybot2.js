const TelegramBot = require('node-telegram-bot-api');

var dataAccess = require("./data_access");
console.log('bot server started...');

// replace the value below with the Telegram token you receive from @BotFather
const token = '1234682792:AAFRumRmO6Bx-Ssb7qSUQaUC5VxNz-t3MQ8';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

var msg_count = 0;
var selectedProblem;
var problem_id;
var newUser = false;
var restart = false;
var problemText =[];
var problemIds = [];
var interactions = "";


// Matches "/echo [whatever]
bot.onText(/\/speakers (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

	//calling other file
	
	if (resp){
	
		dataAccess.searchUser(resp, function dataDone(data){
			
			bot.sendMessage(chatId, data);	
		}); 
		
	} else {
		//bot.sendMessage(chatId, "Sorry I couldn't find anything! Try again by typing the country name");
	}

});

// Listen for any kind of message. There are different kinds of
// messages.
//key value pairs for problem statements

var problemKeys = {
    1: "/startups",
    2: "/remote_working",
    3: "/remote_learning",
    4: "/supply_chains",
    5: "/mental_health",
    6: "/ai_covid"			
};



var aNumber = "/319";
console.log(aNumber.replace(/\//g, ""));
console.log("number "+aNumber.match(/^\/\d+$/));

const solver = {
    first_name: "",
    full_name: "",
    email:"",
    location:"",
    skills:"",
    problems:"",
    comments:"",
    topics: ""
};


for (var key of Object.keys(problemKeys)) {
    console.log(key + " -> " + problemKeys[key])
}

//Menu message
function startMenu(msg){
	 var theMenu =  "Hey "+msg.chat.first_name+",\n\nWelcome, the goal for this application is to match our community of solvers and gather insights.\n\nPlease choose from the following areas of problem statements below: \n";
	
	for (var key of Object.keys(problemKeys)) {
		theMenu+= problemKeys[key]+"\n";
	}	

	return theMenu;
}

bot.on("polling_error", (msg) => console.log(msg));

bot.on('message', (msg) => {
	const chatId = msg.chat.id;
	console.log(msg.message_id+" and "+msg_count );
	console.log(msg.text.toString().toLowerCase());
	solver.first_name = msg.chat.first_name;
	solver.full_name = msg.chat.first_name+" "+msg.chat.last_name;
		
	if (msg.text.toString().toLowerCase() == "/start" ){
		problemIds = [];
		newUser = false;	
		msg_count = msg.message_id + 2;
		bot.sendMessage(chatId, startMenu(msg));		
	} else {
		//Check if its number and display problem statement or add user to it
		if (restart) {
			newUser = false;
			restart = false;
			problemIds = [];
			msg_count = msg.message_id;
		}
		if (msg.message_id == msg_count){
			if (Object.values(problemKeys).includes(msg.text.toString())){
				var selectedElem = msg.text.toString().replace(/\//g, "");
				console.log("---"+selectedElem);
				displayProblems(selectedElem, msg, bot, chatId);
			} else {
				restart = true; 
				bot.sendMessage(chatId, "Sorry, I don't identify that. Please try again with the keys shown above!");	
			}
		}

		
		//just browse more
		if (msg.text.toString().toLowerCase() == "/browse_more"){
			//msg_count = msg.message_id + 2;
			restart = true;		
			bot.sendMessage(chatId, startMenu(msg));
		}

		//Selected problem number will add the user to it and ask for more data
		if (msg.message_id == msg_count + 1){
			if(msg.text.toString().match(/^\/\d+$/)){
				problem_id = msg.text.toString().replace(/\//g, "");
				//check of we have email address
				bot.sendMessage(chatId,"Now, can you please give me your email address?");	
			} else {
				bot.sendMessage(chatId, "Sorry, I don't identify that. Please try with the numbers shown above!");
				msg_count = msg.message_id +1;
			}
		}		
		 //Check if user is part of our database or not
                if (msg.message_id == msg_count + 3){
                        if (validateEmail(msg.text.toString())){
                                dataAccess.searchByEmail(msg.text.toString().toLowerCase(), function dataDone(data){
					if (data){//if user exists, link the problem statement in database
						solver.email = data.email;
						solver.problems = data.problems;
						questionSolution(bot, chatId, problem_id);
					} else {
						newUser = true;
						solver.email = msg.text.toString();
						bot.sendMessage(chatId, "Now, can you tell me some of the skills you have? e.g. nodejs developer, marketing");
					}
					//add the selected problem to solver object
					var theProblems = solver.problems;
					if (!theProblems) theProblems = new Set();
					else theProblems = new Set(theProblems);
					theProblems.add(problem_id);
					solver.problems = Array.from(theProblems);
					console.log(theProblems);
                                });
                        } else {
                                msg_count = msg.message_id;
                                bot.sendMessage(chatId, "Sorry, I something is wrong with the email, can you try again?");
                        }
                }

		//Check if is a new user otherwise continue
		if (!newUser){	
			if (msg.message_id == msg_count + 5) proposeSolution(bot, msg, chatId);
			
			if (msg.message_id == msg_count + 7) { 
				solver.comments = msg.text.toString();
				dataAccess.updateSolver(solver,  function dataDone(data){});
                                dataAccess.addMember(solver, problem_id, function dataDone(data){});
				notifyMsg(bot, chatId, msg);
			}
			
		} else { 
			//Skills Function
			if (msg.message_id == msg_count + 5){
				console.log("insert skills");
				solver.skills = msg.text.toString().toLowerCase();
				bot.sendMessage(chatId, "Now, can you tell where are you located including city and country?");
			}
			//Location Function
		       	if (msg.message_id == msg_count + 7){
				questionSolution(bot, chatId, problem_id);
				solver.location = msg.text.toString();
				console.log("insert Location");
			}
			
			if (msg.message_id == msg_count + 9){
                                proposeSolution(bot, msg, chatId);
                        }
			
			//insert problem statement feedback and solver object	
			if (msg.message_id == msg_count + 11){
				solver.comments = msg.text.toString();
				dataAccess.insertSolver(solver,  function dataDone(data){});
				dataAccess.addMember(solver, problem_id, function dataDone(data){});
				notifyMsg(bot, chatId, msg);
			}
			
		}

	}
		
});

function notifyMsg (bot, chatId, msg){
	msg_count = msg.message_id; 
	bot.sendMessage(chatId, "Great, we added this information and will notify of new solutions and problems. Just make sure to /start again!");
	
}

function questionSolution (bot, chatId, problemId){
	bot.sendMessage(chatId, "Now, do you have a basic idea for a solution or contribution to this problem "+problemId.replace(/\//g, "")+" ? /YES or /NO")
}

function proposeSolution (bot, msg, chatId){	
	if (msg.text.toString() == "/YES"){
		bot.sendMessage(chatId, "Please, briefly describe your proposed solution");
	} else {
		msg_count = msg.message_id;
		bot.sendMessage(chatId, "Ok no problem! You can check more problem with /start");               
	}

}



function displayProblems(key,msg, bot, chatId){

	dataAccess.searchProblems(key, function dataDone(data){
		var problemText = "I found the following problems in the ares of "+key+":\n\n";
		var theKeys = "";
		msg_count = msg.message_id + 1;
		for (var i = 0; i < data.length;i++){
			problemIds.push(data[i].key);
			theKeys+="/"+data[i].key+", ";
			problemText+="/"+data[i].key+": "+ data[i].description+"\n\n";
		}

		problemText+="Now, please click on the following numbers "+theKeys+" if you can contribute or help solve these problems or just /browse_more !";
		bot.sendMessage(chatId, problemText)

	});

}


function validateEmail(email) 
{
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}


