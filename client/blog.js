Meteor.startup(function(){
	Hooks.init();
	Deps.autorun(function () {
		Meteor.subscribe('posts');
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
				listpost.push({
					post_id:post._id,
					post_url:"/post/" + post._id,
					post_title:post.title,
					post_datetime:new Date(post.created_time),
					post_content:post.content,
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
			this.subscribe('allposts');
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
				created_time:p.created_time,
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
		if(window.isAttack == null){
			$('#entry-markdown').cgEditor({
				'previewTag':$('.rendered-markdown'),
				'enableTab':true,
			});
			window.isAttack = true;
		}
	},
	'click button#btn-save':function(event, template){
		if($('#pid').val().trim() == ''){
			if($('#ptag').val().trim() == ''){
				id = createNewPost({
					title:$('#ptitle').val().trim(),
					content: $('.rendered-markdown').html().trim(),
					markdown:$("#entry-markdown").val(),
					tags:['uncategory'],
					publish:true
				});
			}else{
				id = createNewPost({
					title:$('#ptitle').val().trim(),
					content: $('.rendered-markdown').html().trim(),
					markdown:$("#entry-markdown").val(),
					tags:$('#ptag').val().trim().split(','),
					publish:true
				});
			}
			Router.go('/');
		}else{
			//update
			updatePost({
				title:$('#ptitle').val().trim(),
				content: $('.rendered-markdown').html().trim(),
				markdown:$("#entry-markdown").val(),
				tags:$('#ptag').val().trim().split(','),
				publish:true,
				_id:$('#pid').val().trim()
			});
			Router.go('/admin')
		}
		
	},
	'click button#btn-saveasdraft':function(e, t){
		if($('#pid').val().trim() == ''){
			createNewPost({
				title:$('#ptitle').val().trim(),
				content: $('.rendered-markdown').html().trim(),
				markdown:$("#entry-markdown").val(),
				tags:$('#ptag').val().split(','),
				publish:false
			});
			Router.go('/');
		}else{
			//update
			updatePost({
				title:$('#ptitle').val().trim(),
				content: $('.rendered-markdown').html().trim(),
				markdown:$("#entry-markdown").val(),
				tags:$('#ptag').val().trim().split(','),
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
	}
});
