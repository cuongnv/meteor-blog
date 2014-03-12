Meteor.startup(function(){
	Hooks.init();
	s = SiteSettings.findOne({});
	if(s) document.title = s.site_name;
	Deps.autorun(function () {
		Meteor.subscribe('posts');
		Meteor.subscribe('tags');
		Meteor.subscribe('settings');
		Meteor.subscribe('chatbox');
	});
	
	if(ReactiveCookie.get('username') == null){
		ReactiveCookie.set('username', makeid() , {days:1});
		ReactiveCookie.set('color', getRandomColor(), {days:1});
	}
	
});

Hooks.onLoggedOut = function () {
    // this runs right after a user logs out, on the client or server
	
}
Hooks.onLoggedIn = function(){
	Router.go('/');
}
function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
var getRandomColor = function() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}
