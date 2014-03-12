/**
 * fields:
 * - username
 * - text
 * - created_time
 * - colour
 * - otherinfo:{ip, useragent...}
 */
Chatbox = new Meteor.Collection('chatbox');

Chatbox.allow({
	insert:function(userId, post){
		return false;
	},
	update:function(userId, post){
		return false;
	},
	remove:function(userId, post){
		return false;
	}
});
insertChat = function(options){
	Meteor.call('insertChat', options);
};
Meteor.methods({
	insertChat:function(options){
		Chatbox.insert({
			username:options.username,
			text:options.text,
			created_time: Date.now(),
			color:options.color
		});
	}
})