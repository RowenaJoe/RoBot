var request = require('request'),
	JSONStream = require('JSONStream');

// flowdock
var apiToken = "",
    flows = [];

// get flow data
var flowData = {};
for (var i = 0; i < flows.length; i++) {
    request(encodeURI("https://" + apiToken + ":DUMMY@api.flowdock.com/flows/" + flows[i]), function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var flow = JSON.parse(body);
            flowData[flow.id] = { name: flow.organization.parameterized_name + "/" + flow.parameterized_name, token: flow.api_token };
        }
        else console.log("Error getting flow data: " + (error || response) + "\n");
    });
}

// stream messages
var stream = request(encodeURI("https://" + apiToken + ":DUMMY@stream.flowdock.com/flows?filter=" + flows.join(","))).pipe(JSONStream.parse());
stream.on('data', function (data) {
    if (data.event == "message" && typeof data.content == "string") {
        // check if message is for RoBot
        var match = data.content.match(/robot (.+)/i);
        if (match) {
            var message = match[1];

            // post reply
            var reply;
            for (var i = 0; i < commands.length; i++) {
                var command = commands[i];
                var match = message.match(command.pattern);
                if (match) {
                    reply = command.reply(match, data);
                    break;
                }
            }
            if (reply != null && reply != undefined)
                post(reply, data);

        }
        else if (data.content.toLowerCase() === "robot") {
            post("Yes?", data);
        }
    }
});

// post a message
function post(reply, data) {
    var flow = flowData[data.flow];
    var options =
    {
        url: encodeURI("https://api.flowdock.com/v1/messages/chat/" + flow.token),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "content": reply.toString(), "external_user_name": "RoBot" })
    };
    request(options, function (error, response, body) {
        // log
        if (!error && response.statusCode == 200) {
            if (data) console.log("---" + flow.name + "---\n" + data.user + ": " + data.content);
            console.log("RoBot: " + reply + "\n");
        } else {
            console.log("Error posting reply: " + (error || response) + "\n");
        }
    });
}


/* commands:
each command requires:
	* a 'description' for the help listing
	* a regex 'pattern' to trigger the command
	* a 'reply' method which takes parameters:
		* the regex 'match' array
		* the flowdock stream 'data' object
	  the 'reply' method returns CheezeBot's reply (or null for no reply)
	  (alternatively, 'reply' can call the 'post' method directly, which is useful inside a callback)
*/
var commands = [
    {
        description: "help:\t\t\t\tdisplay this message",
        pattern: /^help/,
        reply: function () {
            var help = "RoBot commands:";
            for (var i = 0; i < commands.length; i++) {
                var command = commands[i];
                if (command.description) {
                    help += "\n\t" + command.description;
                }
            }
            return help;
        }
    },
    {
        description: "eat cheesey rice:\t\tnom nom!",
        pattern: /^eat chee(?:s|z)ey rice/,
        reply: function () {
            var cheesey = [
                "http://3.bp.blogspot.com/-bReIhp8ifSI/UA0vpaxB9WI/AAAAAAAADqo/7WnX6qwsNl0/s1600/Cheese+Baked+Rice+with+Chicken+Chop.jpg",
                "http://photobucket.w3ocean.com/albums/aa91/girrgirrl/P1080504easycheesybakedrice.JPG",
                "http://2.bp.blogspot.com/-LgrJBZEotio/T0rlOAvF17I/AAAAAAAAGSk/MNMMGZMMGb4/s400/mexicanchicken.jpg",
                "http://2.bp.blogspot.com/-B7Qnbmc8QxU/TvDUAK7DrkI/AAAAAAAABrc/Sy3KOPKcmQ4/s640/IMG_0293.jpg",
                "http://1.bp.blogspot.com/-vXVCvioaFA4/TrQR03ePT5I/AAAAAAAAE9I/Hh3IAa6ntD0/s1600/DSC_7108.jpg",
                "http://themightyskavenger.files.wordpress.com/2013/06/img_20130521_193931_310.jpg",
                "http://yummychitchat.com/wp-content/uploads/2012/04/TOHK-Curry-and-cream-sauce-rice.jpg"
            ];

            return cheesey[Math.floor(Math.random() * cheesey.length)] + "\n" + "Much cheesey. Very rice!";
        }
    },
    {
        pattern: /^gif (.+)/,
        reply: function (match, data) {
            var search = match[1];
            return "cheezebot gif " + search;
        }
    },
    {
        description: "{your question}?:\t\task a question, any question!",
        pattern: /(.+)\?/,
        reply: function () {
            return "http://emojipedia.org/wp-content/uploads/2013/08/107-thumbs-up-sign.png" + "\n" + "Ivan says yes!";
        }
    },
	{
	    description: "praise {person}:\t\tpraise someone",
	    pattern: /^praise (.+)/,
	    reply: function (match, data) {
	        var person = match[1];
	        var praises = [
	            "is more than average",
	            "is awesomepants!",
	            "is like a a sparkly pony!",
	            "shines like the sun",
	            "is a fracken legend!",
	            "has real purrrdy eyes",
	            "is shiny",
	            "is totes amazeballs",
	            "is more fun than fairy bread!"
	        ];
	        return "@" + person + " " + praises[Math.floor(Math.random() * praises.length)];
	    }
	},
    {
        description: "odd:\t\t\t\tget an oddball compliment",
        pattern: /^odd/,
        reply: function () {
            var praises = [
		        "If ninjas captured you, I would spend all of my frree time training to be a stellar ninja. Which might take some time, since I am very far from being that, but I want you to know that I would eventually save you",
		        "Being normal is overrated. I'd much rather be weird with you",
		        "You're that \"nothing\" when people ask me what I'm thinking about",
		        "I often don't know what I'm doing, but when you're around, I'm at least having fun",
		        "You could open that jar of mayonnaise using only 3 fingers.",
		        "If Einstein could meet you, he'd be \"mildly to moderately\" intimidated.",
		        "At least two friends are going to name their child and/or goldfish after you.",
		        "You are freakishly good at thumb wars.",
		        "A 3rd tier cable network would totally create a television show about you.",
		        "You never forget to fill the ice-cube tray.",
		         "You are your parent's greatest accomplishment, unless they invented the \"spork\".",
		        "Some dudes hope you start a band so they can start a cover band of that band.",
		        "Your handshake conveys intelligence, confidence and minor claminess.",
		        "Cops admire your ability to stay a perfect 3-5 kms above the speed limit.",
		        "Callers are intimidated by how funny your voicemail greeting is.",
		        "People behind you at movies think you are the perfect height.",
		        "You want the best for everyone...except Goose.",
		        "You are someone's \"the one that got away\"."
            ];
            return praises[Math.floor(Math.random() * praises.length)];
        }
    },
    {
        description: "feed me {food description}:\tgimmee!",
        pattern: /^(?:feed me|feedme) (.+)/,
        reply: function(match, data) {
            request(encodeURI("http://www.recipepuppy.com/api/?q=" + match[1]),
                function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var responseData = JSON.parse(body);
                        if (responseData != null) {
                            var allrecipes = responseData.results;
                            if (allrecipes.length == 0) {
                                post("Nada. Are you sure " + match[1] + " is a food?", data);
                                return;
                            }
                            // get first recipe with a thumbnail
                            var recipe = null;
                            for (var i = 0; i < allrecipes.length; i++) {
                                if (allrecipes[i].thumbnail != "") {
                                    recipe = allrecipes[i];
                                    break;
                                }
                            }
                            var reply;
                            if (recipe != null) {
                                reply = recipe.thumbnail + "\n" + recipe.title + "\n" + recipe.href;
                            } else {
                                recipe = allrecipes[Math.floor(Math.random() * allrecipes.length)];
                                reply = recipe.title + "\nRecipe: " + recipe.href;
                            }
                            post(reply, data);
                        }
                    } else console.error("Error requesting recipepuppy: " + JSON.stringify(error || response) + "\n");
                });
        }
    },
    {
        description: "lolcat {search}:\t\tsearch for a lolcat image",
        pattern: "^lolcat (.+)",
        reply: function (match, data) {
            request(encodeURI("http://ajax.googleapis.com/ajax/services/search/images?v=1.0&rsz=8&safe=active&q=lolcat " + match[1]),
                function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var result = JSON.parse(body);
                        var images = result.responseData.results;
                        if (images.length > 0) {
                            var image = images[Math.floor(Math.random() * images.length)];
                            
                            post(ensureImageExtension(image.unescapedUrl), data);
                        }
                        
                    }
                    else {
                        console.error("Error requesting google image apis: " + JSON.stringify(error || response) + "\n");
                    }
                });
        }
    }
];

function ensureImageExtension(url) {
    var ext = url.split('.').pop();
    if (ext.match(/(png|jpe?g|gif)/i)) {
        return url;
    } else
        return  url + ".png";
}
