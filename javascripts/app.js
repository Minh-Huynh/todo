$(function(){
	var Todo = Backbone.Model.extend({
	});

	var Todos = Backbone.Collection.extend({
		model: Todo
	});

	var menuView = Backbone.View.extend({
		el: ".menu",
	    	events: { "click li" : "filterTodos",
	       		  "click #all_todos_header": "displayAll"	},
	    	filterTodos: function(e){
			var element = $(e.target),
	    		    month = element.attr("data-month")|| undefined,
	    		    year = element.attr("data-year")|| undefined,
	    		    complete = "true" == element.attr("data-complete");
			$(".active").removeClass("active");
			element.addClass("active");
			this.eventObj.trigger("filter_main_list",{year: year, month: month, complete: complete});
		},
	    	displayAll: function(e){
			this.eventObj.trigger("display_all",this.collection);
			$(".active").removeClass("active");
			$(e.target).addClass("active");
		},
	    	template: Handlebars.compile($("#menu_view").html()),
	    	initialize: function(options){
			this.listenTo(this.collection, "all", this.render);
			this.eventObj = options.eventObj;
		},
	    	processDataForView: function(){
			this.menuData = [];
			var t = this;
			_.each(this.collection.toJSON(),function(model){
				   var matching_data =_.findWhere(t.menuData, {month: model.month, year: model.year, complete:model.complete});
			matching_data ? matching_data["count"]++ : t.menuData.push({month: model.month, year: model.year, complete:model.complete, count: 1});

			});
		},
		menuData: [],
		render: function(){
			this.processDataForView();
			this.$el.html(this.template({collection_size: this.collection.toJSON().length, due_date_group: this.menuData}));
		}
	});

	var TodoViews = Backbone.View.extend({
		el: "#task_list",
		initialize: function(){
	    		this.render();
		},
		render: function(){
	    		this.collection.each(function(task){
				this.$el.append(new TodoView({model: task});
				}
		}			
	 });

	var TodoView = Backbone.View.extend({
		template: Handlebars.compile($("#task_line_item").html()),
	    	initialize: function(){
			this.render();
			this.listenTo(this.model, "remove", this.remove);
			this.listenTo(this.model, "change:complete", this.completed);
			this.listenTo(this.model, "change:name change:due_date change:description", this.updateFormData);
		},
	    	render: function(){
			return this.template(this.model.toJSON());
		}
	}

	var App = {
		todos: new Todos(),
		bind: function(){
			$("#add_header").on("keypress","#add_field", this.initialNewTask);
		},
		initialNewTask: function(e){
			if(e.which == 13){
				var name = $(this).val(),
				    id = App.nextId;
				App.nextId++;
				App.todos.add({task_name: name, complete: false});
				$(this).trigger("blur").val("");
				$("#add_header input").replaceWith("Add new to do");
			}
		},
		init: function(){
			this.bind();
			this.view = new todoViews({collection:this.todos});
			this.menuView = new menuView({collection: this.todos });

		}

	};
	
App.init();
window.Obj = App;
});

