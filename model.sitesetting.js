/**
 * SiteSettings
 * fields:
 * - site_name: String : name of site
 * - site_url: String : absolute url
 * - logo: String : url of logo image
 * - quote: String
 * - nick_name: String
 */
SiteSettings = new Meteor.Collection('sitesettings');
SiteSettings.allow({
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
var NonEmptyString = Match.Where(function(x){
	check(x, String);
	return x.length !== 0;
});
updateSettings = function(options){
	Meteor.call('updateSettings', options);
}

Meteor.methods({
	updateSettings:function(options){
		check(options, {
			sitename:NonEmptyString,
			absolute_url:NonEmptyString,
			quote:NonEmptyString,
			nick_name: NonEmptyString,
			_id:NonEmptyString
		});
		console.log(options);
		if(!this.userId){
			throw new Meteor.Error(403, "You must be logged in");
		}
		
		SiteSettings.update({_id:options._id}, {$set:{
			site_name:options.sitename,
			site_url:options.absolute_url,
			quote:options.quote,
			nick_name: options.nick_name,	
		}});
	}
});