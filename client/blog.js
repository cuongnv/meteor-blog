function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

Meteor.startup(function(){
});


//router
Meteor.Router.add({
	'/':'listpost',
	'/admin':'admin',
    '/post/:post_id': {to :"postdetail", and:function(post_id){
    	Session.set("currentPostId", post_id);
    }},
    '/login':'login',
    '*':'not_found',
});


//template
Template.listpost.posts = function(){
	posts = Post.find({},{limit:5});
	listpost = [];
	posts.forEach(function(post){
		listpost.push({
			post_id:post._id,
			post_url:"/post/" + post._id,
			post_title:post.title,
			post_datetime:post.created_time,
			post_content:post.content,
			post_num_of_comments:post.comment.length
		});
	});
	return listpost;
};
Template.postdetail.post = function(){
	post_id = Session.get("currentPostId");
	var current_post = Post.findOne({'_id':post_id});
	if(current_post){
		return {
			post_id:current_post._id,
			post_url:current_post.url + "/" + current_post._id,
			post_title:current_post.title,
			post_datetime:current_post.created_time,
			post_content:current_post.content,
			post_comment:current_post.comment
		};
	}
};
