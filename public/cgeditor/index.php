<!DOCTYPE html>
<head>
<title>Coder Garden Editor</title>
<link rel="stylesheet" type="text/css" href="css/demo.css">
<link rel="stylesheet" type="text/css" href="css/code.css">
<link rel="stylesheet" type="text/css" href="css/default.min.css">
</head>
<body>
	<div id="wrapper">
		<div class="cg-editor">
			<div class="cg-toolbar">
				<div class="cg-btn" id="cg-code">C</div>
				<div class="cg-btn" id="cg-uncode">UC</div>
				<div class="cg-btn"></div>
				<div class="cg-btn"></div>
				<div class="cg-btn"></div>
			</div>
			<div class="cg-clearfix"></div>
			<textarea id="source" style="width: 600px; height: 300px;">#H1 here
    void main(){
        int x;
        printf("hello world");
        scanf("%d", &x);
    }
Finish first block
    int printInfo(){
        int x = 0;
        return x;
    }
![CG](images/logo.png "coder garden")</textarea>
		</div>
		<h1>Preview:</h1>
		<div id="preview"></div>
	</div>
	<!-- for loading performance. -->
	<script type="text/javascript" src="jquery.js"></script>
	<script type="text/javascript" src="jquery.cgeditor.js"></script>
	<script type="text/javascript">
	$(document).ready(function(){
		$('#source').cgEditor({
			'previewTag':$('#preview'),
			'enableTab':true,
			
			});
	});
	</script>
</body>
