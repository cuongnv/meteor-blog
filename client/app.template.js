Template.layout.sites=function(){
	return SiteSettings.findOne({});
}
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
				alert(err);
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
				alert(err);
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
			tags[i] = tags[i].trim().toLowerCase(); 
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
			tags[i] = tags[i].trim().toLowerCase(); 
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
	},
	'click #settings-save':function(e, t){
		e.preventDefault();
		updateSettings({
			sitename:$('#sitename').val().trim(),
			absolute_url:$('#absolute_url').val(),
			quote:$('#quote').val(),
			nick_name: $('#nick_name').val(),
			_id:$('#admin_settings').attr('data-id')
		});
		document.title=$('#sitename').val().trim();
	}
});
Template.tagcloud.tags=function(){
	return Tag.find({}).fetch();
}
Template.postdetail.events({
	'click #btn-comment':function(e, t){
		e.preventDefault();
		id = $('#c_pid').val();
		email = $('#c_email').val().trim();
		content = $('#c_comment').val().trim().replace(/(<script[^>]*>|<\/script>)/g, '');
		if(id == '' || email == '' || content == ''){
			$('#c_error').html('You must fill all require fields');
			return;
		}
		if(!/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)){
			$('#c_error').html('Email not valid');
			return;
		}
		
		addComment({
			_id:id,
			email:email,
			content:content
		});
		$('#c_error').html('');
		$('#c_email').val('');
		$('#c_comment').val('');
	}
});
Template.searchbox.events({
	'click #submitsearch':function(e, t){
		e.preventDefault();
		if($('#searchbox').val().trim() != ''){
			Session.set('searchQuery', $('#searchbox').val().trim());
			Router.go('/search');
		}
		
	}
});