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
			var p = Post.findOne({_id:this.params.id}, {fields: {title:1, content:1, created_time:1}});
			return {
				title:p.title,
				content:p.content,
				created_time:p.created_time,
				_id:p._id
			};
		}
	});
	this.route('login', {
		path:'/login',
		template:'login',
		before:[function(){
			if(Meteor.user() != null){
				this.redirect('/');
			}
		}]
	});
	this.route('admin',{
		path:'/admin',
		template:'admin',
		before:[function(){
			if(Meteor.user() == null){
				this.redirect('login');
			}
		}],
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
//		this.redirect('/');
	},
	'click button#btn-saveasdraft':function(e, t){
		createNewPost({
			title:$('#ptitle').val().trim(),
			content: $('.rendered-markdown').html().trim(),
			markdown:$("#entry-markdown").val(),
			tags:$('#ptag').val().split(','),
			publish:false
		});
//		Meteor.redirect('/');
	}
});

