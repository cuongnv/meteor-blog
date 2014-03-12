Hooks.onLoggedIn = function(userId){
	if(!(Meteor.user().profile 
			&& Meteor.user().profile.role 
			&& Meteor.user().profile.role == 'Admin')){
		console.log('[+] Force logout user!');
		Meteor.users.update({_id:userId}, {$set : { "services.resume.loginTokens" : [] }});
	}
}
Meteor.publish("posts", function(){
	if(this.userId == null){
		return Post.find({$or:[{"publish":true}]});
	}else{
		return Post.find({});
	}	
});
Meteor.publish("tags", function(){
	return Tag.find({});
});
Meteor.publish('settings', function(){
	return SiteSettings.find({});
});