//Post model
// fields: _id: string
// title : text
// content: long text
// created_time: int
// author:reference to user
// tags: array
// publish: int 0|1
Post = new Meteor.Collection('posts');

var NonEmptyString = Match.Where(function(x){
	check(x, String);
	return x.length !== 0;
});
Post.allow({
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

createNewPost = function(options){
	var id = Random.id();
	Meteor.call('createNewPost', _.extend({_id:id}, options));
	return id;
}
deletePost = function(id){
	Meteor.call('deletePost', id);
}
publishPost = function(id){
	Meteor.call('publishPost', id);
}
updatePost = function(options){
	Meteor.call('updatePost', options);
}

Meteor.methods({
	createNewPost:function(options){
		check(options, {
			title:NonEmptyString,
			content:NonEmptyString,
			publish:Match.Optional(Boolean),
			_id:Match.Optional(NonEmptyString),
			tags:Match.Optional(Array),
			markdown:NonEmptyString
		});
		if( !this.userId){
			throw new Meteor.Error(403, "You must be logged in");
		}
		
		var id = options._id || Random.id();
		Post.insert({
			 _id: id,
			 title : options.title,
			 content: options.content,
			 markdown:options.markdown,
			 created_time: Date.now(),
			 author: this.userId,
			 tags: options.tags,
			 publish: !!options.publish,
			 comment:[]
		});
		
	},
	deletePost:function(id){
		check(id, String);
		if(id.length == 0) return;
		if(!this.userId){
			throw new Meteor.Error(403, "You must be logged in");
		}
		
		Post.remove({_id:id});
	},
	updatePost:function(options){
		check(options, {
			title:NonEmptyString,
			content:NonEmptyString,
			publish:Match.Optional(Boolean),
			_id:NonEmptyString,
			tags:Match.Optional(Array),
			markdown:NonEmptyString
		});
		if( !this.userId){
			throw new Meteor.Error(403, "You must be logged in");
		}
		Post.update({_id:options._id}, {$set:{
			title:options.title,
			content:options.content,
			publish:options.publish,
			tags:options.tags,
			markdown:options.markdown
		}});
		
	},
	publishPost:function(id){
		check(id, String);
		if(id.length == 0) return;
		if(!this.userId){
			throw new Meteor.Error(403, "You must be logged in");
		}
		p = Post.findOne({_id:id});
		if(p){
			Post.update({_id:id}, {$set:{publish:!p.publish}});
		}
	}	
});