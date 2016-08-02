$(function(){

	var taskModel = {
		localCopy : {},
		currentID : localStorage["task_id"] || 0,
		addNewTask : function(name, description, dueDateObj){
			this.localCopy[this.currentID] = {name: name, description: description, dueDate : dueDateObj , complete: false};
			this.currentID++;
			localStorage["task_id"] = this.currentID;
			this.sendDataToLocalStorage(false);
			taskView.renderMenu();
			
		},
		deleteTask : function(){
			var task_id = $(this).closest(".list_item").attr("data-id");
			delete taskModel.localCopy[task_id];
			taskModel.sendDataToLocalStorage(true);
			taskView.renderMenu();
		},
		editTask: function(task_id,title,description,dateObj,complete){
			this.localCopy[task_id] = {name: title, description: description, dueDate: dateObj, complete: complete};
			localStorage["todo_data"] = JSON.stringify(this.localCopy);
			taskView.renderMenu();
		},
		sendDataToLocalStorage: function(truncate){
			if (truncate){
				localStorage["todo_data"] = JSON.stringify(this.localCopy);
			}
			else{
				var existing_data = localStorage["todo_data"] ? JSON.parse(localStorage["todo_data"]): {},
					updated_data  = $.extend({},existing_data, this.localCopy);
				localStorage["todo_data"] = JSON.stringify(updated_data);
			}
		},
		retrieveDataFromLocalStorage: function(){
			if(localStorage.hasOwnProperty("todo_data")){
				this.localCopy = JSON.parse(localStorage["todo_data"]);
			}
			else{
				this.localCopy = {};
			}
		},
		parseByDueDates: function(completed){
			var byDueDate = {};
			var data = this.localCopy;
			for (task in data){
				if(data[task].complete != completed){continue};
				var date = new Date(data[task].dueDate);
				var date_key;
				if(!isNaN(date.getMonth()) && !isNaN(date.getFullYear())){
					var month = date.getMonth() + 1;
					var year  = date.getFullYear();
					date_key =  month + "/" + year;
				}
				else{
					date_key = "No Due Date";
				}
				if(byDueDate.hasOwnProperty(date_key)){
					byDueDate[date_key][task] = data[task];
				}
				else{
					byDueDate[date_key] = {};
					byDueDate[date_key][task] = data[task];
				}
			}
			return byDueDate;
		}

	}

	var taskView = {
		compileTemplate: function(context){
			var template = Handlebars.compile($("#task_line_item").html());
			return template(context);
		},
		addRow: function(){
			var title = $(this).val();
			var complete_row = $(".active").parent("ul").is("#complete_todos");
			var section_name = $(".active").clone().children().remove().end().text();
			if ( section_name == "All Todos" || section_name == "No Due Date" && !complete_row){
				$("#task_list").append(taskView.compileTemplate({task_name: title, id: taskModel.currentID}));
			}		
			$("#title_date span").text($(".list_item").length);
			taskView.sortCompletedTaskstoBottom();
		},
		addDueDate: function(dateObj){
			if(dateObj){
				$(this).closest(".list_item").find(".due_date").html("Due Date: " + dateObj.toDateString());
			}			
		},
		closeModal: function(){
			$("input[type='checkbox']").prop("checked",false);
		},
		removeRow: function(){
			$(this).closest("li").remove();
		},
		highlightMenuRow: function(){
			$(".active").removeClass("active");
			$(this).addClass("active");
		},
		sortCompletedTaskstoBottom: function(){
			$(".list_item").each(function(index){
				if ($(this).hasClass("checked")){
					var removed = $(this).detach();
					removed.appendTo("#task_list");
				}
			})
		},
		renderTasksFromLocalStorage: function(tasks){
			for(element in tasks){
				var date = tasks[element].dueDate ? new Date(tasks[element].dueDate) : undefined;
				$("#task_list").append(this.compileTemplate({
					task_name: tasks[element].name,  
					complete: tasks[element].complete,
					day: date ? date.getDate() : undefined,
					month:date ? date.getMonth() + 1 : undefined,
					year: date ? date.getFullYear() : undefined,
					due_date: date ? date.toDateString() : undefined,
					description: tasks[element].description,
					id: element
				}));
			}
			$("#title_date").html($(".active").html());

			this.sortCompletedTaskstoBottom();
		},
		renderMenu: function(){
			var active_element = $(".active").clone().children().remove().end().text();
			var parent_id = $(".active").parent("ul").attr("id");
			$("#incomplete_todos, #complete_todos").html("");
			var all_todos_incomplete = taskModel.parseByDueDates(false);
			for(date in all_todos_incomplete){
				$("#incomplete_todos").append("<li>" + date + "<span>" + Object.keys(all_todos_incomplete[date]).length + "</span></li>");
			}
			var all_todos_complete = taskModel.parseByDueDates(true);
			for (date in all_todos_complete){
				$("#complete_todos").append("<li>" + date + "<span>" + Object.keys(all_todos_complete[date]).length + "</span></li>");
			}
			$(".all_todos_count").text(Object.keys(taskModel.localCopy).length);
			$(".menu #" + parent_id + " li:contains(" + active_element + ")").addClass("active");
			taskView.sortMenu();	
		},
		sortMenu: function(){
			function generateIndex(element){
					var text = $(element).clone().children().remove().end().text();
					if(text == "No Due Date"){
						return "00000"
					}
					else{
						var date_vals = text.split("/");
						return date_vals[1] + date_vals[0];
					}
				}
			$("#incomplete_todos li").sort(function(a,b){
				if(generateIndex(a) > generateIndex(b)){ return 1;}
				if(generateIndex(a) < generateIndex(b)){ return -1;}
				return 0;
			}).appendTo("#incomplete_todos");
			$("#complete_todos li").sort(function(a,b){
				if(generateIndex(a) > generateIndex(b)){ return 1;}
				if(generateIndex(a) < generateIndex(b)){ return -1;}
				return 0;
			}).appendTo("#complete_todos");
		}
	}

	var taskController = {
		onAddTaskFirstClick: function(e){
			e.preventDefault();
			$(this).html("<img src='add.png' /><input id='add_field' type='text'></input></a>");
			$("#add_field").focus();
		},
		onAddTaskKeyPress: function(e){
			if (e.which == 13){
				taskView.addRow.apply(this);
				taskModel.addNewTask($(this).val(), undefined, undefined);
				$(this).trigger("blur");
			}
		},
		onTrashCanClick: function(e){
			e.preventDefault();
			taskView.removeRow.apply(this);
			taskModel.deleteTask.apply(this);
		},
		onLeftRowclick: function(e){
			taskView.highlightMenuRow.apply(this);
		},
		onTaskDataSave:function(e){
			e.preventDefault();
			var $form = $(this).closest("form"),
				description = $form.find("[name='description']").val(),
				title = $form.find("#title").val(),
			 	month = $form.find("[name='month']").val() - 1,
			 	year = $form.find("[name='year']").val(),
				day = $form.find("[name='day']").val(),
				id = $form.attr("data-id"),
				completed = $(this).closest(".list_item").hasClass("checked"),
				dateObj = month >= 0 || day !== "" || year !== "" ? new Date(year,month,day) : undefined;
			taskView.addDueDate.apply(this,[dateObj]);
			taskModel.editTask(id, title,description,dateObj,completed);
			taskView.closeModal();
			$(this).parents("label").find(".task_name").html($(this).siblings("#title").val());
		},
		onMarkasComplete: function(e){
			e.preventDefault();
			var $form = $(this).closest("form"),
				name = $form.find("#title").val(),
				description = $form.find("[name='description']").val(),
			 	month = $form.find("[name='month']").val(),
			 	year = $form.find("[name='year']").val(),
				day = $form.find("[name='day']").val(),
				id = $form.attr("data-id"),
				dateObj = month && day && year ? new Date(year,month,day) : undefined;
			taskModel.editTask(id, name,description,dateObj,true);
			if ($(".active").clone().children().remove().end().text() == "All Todos"){
				$(this).closest(".list_item").addClass("checked");
			}
			else{
				$(this).closest(".list_item").remove();
			}			
			taskView.closeModal();
			taskView.sortCompletedTaskstoBottom();
		},
		onAllCompletedRowClick: function(){
			var completed_tasks = {};
			for(task in taskModel.localCopy){
				if(taskModel.localCopy[task].complete)
					completed_tasks[task] = taskModel.localCopy[task];
			}
			$("#task_list").html("");
			taskView.renderTasksFromLocalStorage(completed_tasks);
			$("#title_date").find("span").addClass("special_header");
		},
		onAllToDosRowClick: function(){
			$("#task_list").html("");
			taskView.renderTasksFromLocalStorage(taskModel.localCopy);
		},
		onMenuRowClick: function(){
			var complete = $(this).closest("ul").attr("id") == "complete_todos";
			var date = $(this).clone().children().remove().end().text();
			var all_tasks = taskModel.parseByDueDates(complete);
			var selected_tasks = all_tasks[date];
			$("#task_list").html("");
			taskView.renderTasksFromLocalStorage(selected_tasks);
		},
		bind: function(){
			$("#add_link").on("click", this.onAddTaskFirstClick);
			$("#add_header").on("keypress","#add_field", this.onAddTaskKeyPress);
			$("main").on("click",".delete_row",this.onTrashCanClick);
			$(".menu").on("click","li, h2", this.onLeftRowclick);
			$("#task_list").on("click","form input[value='Save']", this.onTaskDataSave);
			$("#task_list").on("click","form input[value = 'Mark as Complete']", this.onMarkasComplete);
			$(".menu").on("click","li",this.onMenuRowClick);
			$(".menu").on("click","#all_todos_header",this.onAllToDosRowClick);
			$(".menu").on("click",".completed h2", this.onAllCompletedRowClick);			
		},
		init: function(){
			this.bind();
			if (localStorage["todo_data"]){
				taskModel.localCopy = JSON.parse(localStorage["todo_data"]);
				taskView.renderTasksFromLocalStorage(taskModel.localCopy);
			}
			taskView.compileTemplate();
			taskView.renderMenu();		
		}
	}
	taskController.init();
	$("#add_header").on("blur","#add_field",function(){
		$(this).replaceWith("Add New To Do");
	})
})