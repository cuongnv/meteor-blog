var arrayUnique = function (array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i].title === a[j].title)
                a.splice(j--, 1);
        }
    }

    return a;
};

Router.configure({
	layoutTemplate:'layout',
	notFoundTemplate:'not_found'
});

Router.map(function(){
	this.route('home', {
		path:'/',
		template:'listpost',
		data:function(){
			posts = Post.find({publish:true},{limit:5, sort:{modified_time:-1, created_time:-1}});
			all_publish_posts = Post.find({publish:true}).count();
			listpost = [];
			posts.forEach(function(post){
				content = post.content;
				if(content.length >= 300){
					content = post.content.substr(0, 300);
					content = content.substr(0, Math.min(content.length, content.lastIndexOf(" ")));
					content += "...<br/><a href=\"/post/" + post._id+"\">Read more>>";
				}
				listpost.push({
					post_id:post._id,
					post_url:"/post/" + post._id,
					post_title:post.title,
					post_datetime:new Date(post.created_time),
					post_content: content,
					post_num_of_comments:post.comment.length
				});
			});
			n = all_publish_posts%5;
			pages=[];
			if( n*5 < all_publish_posts ){
				n = n+1;
			}
			for(i = 1; i <= n;i++){
				pages.push({'p':i});
			}
			return {'posts':listpost, 'pages':pages};
		},
		before:function(){
			Session.set('blog_title', document.title);			
		}
	});
	this.route('list_post', {
		path:'/list/:page',
		template:'listpost',
		data:function(){
			posts = Post.find({publish:true},{limit:5, skip:(this.params.page-1)*5,sort:{modified_time:-1, created_time:-1}});
			all_publish_posts = Post.find({publish:true}).count();
			listpost = [];
			posts.forEach(function(post){
				content = post.content;
				if(content.length >= 300){
					content = post.content.substr(0, 300);
					content = content.substr(0, Math.min(content.length, content.lastIndexOf(" ")));
					content += "...<br/><a href=\"/post/" + post._id+"\">Read more>>";
				}
				listpost.push({
					post_id:post._id,
					post_url:"/post/" + post._id,
					post_title:post.title,
					post_datetime:new Date(post.created_time),
					post_content: content,
					post_num_of_comments:post.comment.length
				});
			});
			
			n = all_publish_posts%5;
			pages=[];
			if( n*5 < all_publish_posts ){
				n = n+1;
			}
			for(i = 1; i <= n;i++){
				pages.push({'p':i});
			}
			return {'posts':listpost, 'pages':pages};
		},
		before:function(){
			Session.set('blog_title', document.title);			
		}
	});
	this.route('editor', {
		path:'/post',
		template:'create_post',
		before:[function(){
			if(Meteor.userId() == null){
				this.redirect('login');
			}
		}]
	});
	this.route('post_detail', {
		path:'/post/:id',
		template:'postdetail',
		data:function(){
			var p = Post.findOne({_id:this.params.id, publish:true}, {fields: {title:1, content:1, created_time:1, comment:1}});
			document.title = p.title + ' | ' + Session.get('blog_title');
			return {
				title:p.title,
				content:p.content,
				created_time:new Date(p.created_time),
				comment:p.comment,
				_id:p._id
			};
		},
		unload:function(){
			document.title = Session.get('blog_title');
		}
	});
	this.route('post_detail_2', {
		
	});
	this.route('login', {
		path:'/login',
		template:'login',
		before:function(){
			if(Meteor.user() != null){
				this.redirect('/');
			}
		}
	});
	this.route('admin',{
		path:'/admin',
		template:'admin',
		before:function(){
			if(Meteor.user() == null){
				this.redirect('login');
			}
		},
		data:function(){
			posts = Post.find({}, {fields: {title:1, created_time:1, publish:1, comment:1}}).fetch();
			i = 1;
			_.each(posts, function(p){
				p.no = i++; 
				p.created_time = new Date(p.created_time);
			});
			s = SiteSettings.findOne({});
			return {posts:posts, sites:s};
		}
	});
	this.route('admin_publish',{
		path:'/admin/publish/:id',
		action:function(){
			publishPost(this.params.id);
			this.redirect('/admin');
		}
	});
	this.route('admin_view',{
		path:'/admin/view/:id',
		template:'postdetail',
		data:function(){
			var p = Post.findOne({_id:this.params.id}, {fields: {title:1, content:1, created_time:1, comment:1}});
			return {
				title:p.title,
				content:p.content,
				created_time:new Date(p.created_time),
				comment:p.comment,
				_id:p._id
			};
		}
	});
	this.route('admin_delete', {
		path:'/admin/delete/:id',
		action:function(){
			result = confirm('Do you want to delete this post?');
			if(result){
				//delete post
				deletePost(this.params.id);
			}
			this.redirect('/admin');
		}
	});
	this.route('admin_edit',{
		path:'/admin/edit/:id',
		template:'create_post',
		data:function(){
			p = Post.findOne({_id:this.params.id},{fields:{title:1, markdown:1, content:1, tags:1}});
			p.tags = p.tags.join(',');
			return p;
		}
	});
	this.route('about',{
		path:'/about',
		template:'about'
	});
	this.route('tag',{
		path:'/tag/:slug',
		template:'listpost',
		data:function(){
			t = Tag.findOne({slug:this.params.slug});
			posts = Post.find({publish:true, tags:{$in:[t.name]}});
			listpost = [];
			posts.forEach(function(post){
				content = post.content;
				if(content.length >= 300){
					content = post.content.substr(0, 300);
					content = content.substr(0, Math.min(content.length, content.lastIndexOf(" ")));
					content += "...<br/><a href=\"/post/" + post._id+"\">Read more>>";
				}
				listpost.push({
					post_id:post._id,
					post_url:"/post/" + post._id,
					post_title:post.title,
					post_datetime:new Date(post.created_time),
					post_content: content,
					post_num_of_comments:post.comment.length
				});
			});
			return {'posts':listpost};
		}
	});
	this.route('search',{
		path:'/search',
		data:function(){
			//TODO: improve later by using full-text search mongodb
			searchQuery = Session.get('searchQuery');
			searchQuery = searchQuery.trim().split(' '); 
			posts = [];
			searchQuery.forEach(function(s){
				p = Post.find({title:{$regex:s}}).fetch();
				posts = arrayUnique(posts.concat(p));
			});
			listpost = [];
			posts.forEach(function(post){
				content = post.content;
				if(content.length >= 300){
					content = post.content.substr(0, 300);
					content = content.substr(0, Math.min(content.length, content.lastIndexOf(" ")));
					content += "...<br/><a href=\"/post/" + post._id+"\">Read more>>";
				}
				listpost.push({
					post_id:post._id,
					post_url:"/post/" + post._id,
					post_title:post.title,
					post_datetime:new Date(post.created_time),
					post_content: content,
					post_num_of_comments:post.comment.length
				});
			});
			return {searchQuery:searchQuery.join(' '),'posts':listpost};
		}
	});
	
	
});