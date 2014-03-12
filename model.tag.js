/**
 * fields:
 * - name: string
 * - slug: string
 * - weight:int(default 1)
 */
Tag = new Meteor.Collection('tags');
Tag.allow({
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