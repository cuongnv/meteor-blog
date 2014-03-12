Meteor.startup(function(){
	Hooks.init();
	s = SiteSettings.findOne({});
	if(s) document.title = s.site_name;
	Deps.autorun(function () {
		Meteor.subscribe('posts');
		Meteor.subscribe('tags');
		Meteor.subscribe('settings');
	});
	
});

Hooks.onLoggedOut = function () {
    // this runs right after a user logs out, on the client or server
	
}
Hooks.onLoggedIn = function(){
	Router.go('/');
}
