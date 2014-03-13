/**Post model
 fields: 
 - _id: string
 - title : text
 - content: long text
 - created_time: int
 - author:reference to user
 - tags: array
 - comment: array [{time, email, content}]
 - publish: int 0|1
*/
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
addComment = function(options){
	Meteor.call('addComment', options);
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
		
		//insert tag
		_.each(options.tags, function(t){
			t = t.trim();
			tag = Tag.findOne({name:t});
			if(tag == null){
				Tag.insert({
					name:t,
					slug:t.replace(new RegExp('[ ]', 'g'), '-'),
					weight:1
				});
			}else{
				Tag.update({name:t}, {$inc:{weight:1}});
			}
		});
		
		var id = options._id || Random.id();
		Post.insert({
			 _id: id,
			 title : options.title,
			 content: options.content,
			 markdown:options.markdown,
			 created_time: Date.now(),
			 modified_time: Date.now(),
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
		p = Post.findOne({_id:id});
		//insert tag
		_.each(p.tags, function(t){
			t = t.trim();
			Tag.update({name:t}, {$inc:{weight:-1}});
		});
		
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
		
		//insert new tag, decrease remove tags
		p = Post.findOne({_id:options._id});
		_.each(p.tags, function(t){
			t = t.trim();
			if(options.tags.indexOf(t) == -1){
				Tag.update({name:t}, {$inc:{weight:-1}});
			}else{
				tag = Tag.findOne({name:t});
				if(tag == null){
					Tag.insert({
						name:t,
						slug:t.replace(new RegExp('[ ]', 'g'), '-'),
						weight:1
					});
				}
			}
		});
		Post.update({_id:options._id}, {$set:{
			title:options.title,
			content:options.content,
			publish:options.publish,
			tags:options.tags,
			markdown:options.markdown,
			modified_time: Date.now()
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
	},
	addComment:function(options){
		check(options, {
			email:NonEmptyString,
			content:NonEmptyString,
			_id:NonEmptyString
		});
//		if(!this.userId){
//			throw new Meteor.Error(403, "You must be logged in");
//		}
		Post.update({_id:options._id}, {$push:{comment:{
			email:options.email, 
			content:options.content,
			created_time:Date.now()
			}}});
	}
	
});