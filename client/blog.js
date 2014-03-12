Meteor.startup(function(){
	Hooks.init();
	Deps.autorun(function () {
		Meteor.subscribe('posts');
		Meteor.subscribe('tags');
	});
});

Hooks.onLoggedOut = function () {
    // this runs right after a user logs out, on the client or server
	
}
Hooks.onLoggedIn = function(){
	Router.go('/');
}

Router.configure({
	layoutTemplate:'layout',
	notFoundTemplate:'not_found'
});

Router.map(function(){
	this.route('home', {
		path:'/',
		template:'listpost',
		data:function(){
			posts = Post.find({publish:true},{limit:5});
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
		},
		before:function(){
			this.subscribe('posts');
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
			var p = Post.findOne({_id:this.params.id, publish:true}, {fields: {title:1, content:1, created_time:1}});
			return {
				title:p.title,
				content:p.content,
				created_time:new Date(p.created_time),
				_id:p._id
			};
		}
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
			posts = Post.find({}, {fields: {title:1, created_time:1, publish:1}}).fetch();
			i = 1;
			_.each(posts, function(p){
				p.no = i++; 
				p.created_time = new Date(p.created_time);
			});
			return {posts:posts};
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
			var p = Post.findOne({_id:this.params.id}, {fields: {title:1, content:1, created_time:1}});
			return {
				title:p.title,
				content:p.content,
				created_time:new Date(p.created_time),
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
	})
	
	
});
Template.layout.events({
	'click #btn-logout':function(e, t){
		Meteor.logout();
	},
	'click #btn-login':function(e, t){
		Router.go('/login');
	}
});
Template.login.events({
	'click #btn-login':function(event, t){
		event.preventDefault();
		var username = t.find('#username').value,
		password = t.find('#password').value;
		Meteor.loginWithPassword(username, password, function(err){
			if(err){
				//TODO: error here
				
			}else{
				
			}
		});
	},
	'click #btn-register':function(event, t){
		event.preventDefault();
		var username = t.find('#username').value,
		password = t.find('#password').value;
		Accounts.createUser({username: username, password : password, profile:{}}, function(err){
			if(err){
				//TODO:error
			}else{
				
			}
		});
	}
	
});
Template.create_post.events({
	'keypress #entry-markdown':function(event, template){
		if(window.isAttack == null || window.isAttack == false){
			$('#entry-markdown').cgEditor({
				'previewTag':$('.rendered-markdown'),
				'enableTab':true,
			});
			window.isAttack = true;
		}
	},
	'click button#btn-save':function(event, template){
		tags = $('#ptag').val().trim().split(',');
		for(i = 0; i < tags.length; i++){
			tags[i] = tags[i].trim(); 
		}
		if(tags.length == 0) tags.push('uncategory');
		
		window.isAttack = false;
		
		if($('#pid').val().trim() == ''){
			id = createNewPost({
				title:$('#ptitle').val().trim(),
				content: $('.rendered-markdown').html().trim(),
				markdown:$("#entry-markdown").val(),
				tags:tags,
				publish:true
			});
			
			Router.go('/');
		}else{
			updatePost({
				title:$('#ptitle').val().trim(),
				content: $('.rendered-markdown').html().trim(),
				markdown:$("#entry-markdown").val(),
				tags:tags,
				publish:true,
				_id:$('#pid').val().trim()
			});
			
			Router.go('/admin')
		}
		
	},
	'click button#btn-saveasdraft':function(e, t){
		tags = $('#ptag').val().trim().split(',');
		for(i = 0; i < tags.length; i++){
			tags[i] = tags[i].trim(); 
		}
		if(tags.length == 0) tags.push('uncategory');
		
		window.isAttack = false;
		
		if($('#pid').val().trim() == ''){
			createNewPost({
				title:$('#ptitle').val().trim(),
				content: $('.rendered-markdown').html().trim(),
				markdown:$("#entry-markdown").val(),
				tags:tags,
				publish:false
			});
			
			Router.go('/');
		}else{
			//update
			updatePost({
				title:$('#ptitle').val().trim(),
				content: $('.rendered-markdown').html().trim(),
				markdown:$("#entry-markdown").val(),
				tags:tags,
				publish:false,
				_id:$('#pid').val().trim()
			});
			Router.go('/admin');
		}
	}
});
Template.admin.events({
	'click ul.nav li a':function(e, t){
		e.preventDefault();
		$('ul.nav li').removeClass('active');
		$(e.target).parent().addClass('active');
		tab = $(e.target).attr('href');
		$('.admin_tab').hide();
		if(tab == '/admin/posts'){
			$('#admin_posts').show();
		}else if(tab == '/admin/users'){
			$('#admin_users').show();
		}else if(tab == '/admin/tags'){
			$('#admin_tags').show();
		}else if(tab == '/admin/settings'){
			$('#admin_settings').show();
		}
	}
});
Template.tagcloud.tags=function(){
	return Tag.find({}).fetch();
}
