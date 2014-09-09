var request = require('request'),
	JSONStream = require('JSONStream');

// credentials
	// flowdock
var apiToken = "",
	flows = [],
	
// get flow data
var flowData = {};
for (var i = 0; i < flows.length; i++) {
	request(encodeURI("https://" + apiToken + ":DUMMY@api.flowdock.com/flows/" + flows[i]), function(error, response, body) {
		if (!error && response.statusCode == 200) {
			var flow = JSON.parse(body);
			flowData[flow.id] = { name: flow.organization.parameterized_name + "/" + flow.parameterized_name, token: flow.api_token };
		}
		else console.log("Error getting flow data: " + (error || response) + "\n");
	});
}

// stream messages
var stream = request(encodeURI("https://" + apiToken + ":DUMMY@stream.flowdock.com/flows?filter=" + flows.join(",")))
	.pipe(JSONStream.parse());
stream.on('data', function(data) {
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
			if (reply != null && reply != undefined) post(reply, data);
		}
	}
});

// post a message
function post(reply, data) {
	var flow = flowData[data.flow];
	var options = {
		url: encodeURI("https://api.flowdock.com/v1/messages/chat/" + flow.token),
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ "content": reply.toString(), "external_user_name": "RoBot" })
	};
	request(options, function(error, response, body) {
		// log
		if (!error && response.statusCode == 200) {
			if (data) console.log("---" + flow.name + "---\n" + data.user + ": " + data.content);
			console.log("RoBot: " + reply + "\n");
		}
		else console.log("Error posting reply: " + (error || response) + "\n");
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
		reply: function() {
			var help = "RoBot commands:";
			for (var i = 0; i < commands.length; i++) {
				var command = commands[i];
				help += "\n\t" + command.description;
			}
			return help;
		}
	},
	{
	    description: "praise  {person}:\t\t\t\tpraise someone",
		pattern: /^praise (.+)/,
		reply: function (match, data) {
		    var person = match[1];
			var praises = ["is more than average", "is awesomepants!", "is like a a sparkly pony!", "shines like the sun", "is a fracken legend!"];
			return "@" + person + praises[Math.floor(Math.random() * praises.length)];
		}
	},
        {
    	description: "pathead:\t\t\t\tpraise yourself, you narcissistic weasel",
    	pattern: /^praise/,
    	reply: function () {
    	    var praises = ["is more than average", "is awesomepants!", "is like a a sparkly pony!", "shines like the sun", "is a fracken legend!"];
    	    return "You're " + praises[Math.floor(Math.random() * praises.length)];
    	}
        },
	{
		description: "{sumthin sumthin} ok?:\t\t\t\tfor reassurance",
		pattern: /(.+) ^ok?/,
		reply: function() {
		    return "http://emojipedia.org/wp-content/uploads/2013/08/107-thumbs-up-sign.png" + "\n" + "Ivan says yes!";
		}
	},
	{
		description: "about:\t\t\t\tdeveloper and source info",
		pattern: /^about/,
		reply: function() {
			return "RoBot, a clone of CheezeBot by Adam-G\nSource: git.io/1roJvQ\nSuggestions or contributions welcome.";
		}
	},
];

// utility functions
function pad(len, str) {
	while (str.length < len) str += " ";
	return str;
}
