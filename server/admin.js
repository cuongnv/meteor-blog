Hooks.onLoggedIn = function(userId){
	if(!(Meteor.user().profile 
			&& Meteor.user().profile.role 
			&& Meteor.user().profile.role == 'Admin')){
		console.log('[+] Force logout user!');
		Meteor.users.update({_id:userId}, {$set : { "services.resume.loginTokens" : [] }});
	}
}
Meteor.publish("posts", function(){
	return Post.find({$or:[{"publish":true}]});
});